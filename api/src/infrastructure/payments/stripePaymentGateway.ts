import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import type { EnginePaymentRecord } from '../../modules/auction-engine/auctionEngine.types.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { BadRequestError } from '../../shared/errors/BadRequestError.js';
import type {
  PaymentCheckoutOrder,
  PaymentGatewayProvider,
  PaymentGatewayVerificationResult,
  PaymentVerificationInput,
  PaymentWebhookInput
} from './paymentGateway.types.js';

interface StripeCheckoutSessionResponse {
  id: string;
  url?: string | null;
  payment_intent?: string | null;
  payment_status?: string;
}

interface StripeWebhookPayload {
  type?: string;
  data?: {
    object?: {
      id?: string;
      payment_intent?: string | null;
      payment_status?: string;
    };
  };
}

const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

export class StripePaymentGatewayProvider implements PaymentGatewayProvider {
  readonly gateway = 'stripe' as const;

  async createOrder(payment: EnginePaymentRecord): Promise<PaymentCheckoutOrder> {
    this.assertConfigured();

    const body = new URLSearchParams({
      mode: 'payment',
      client_reference_id: payment.id,
      success_url: `${env.webAppUrl}/my-wins?payment=${payment.id}&status=success`,
      cancel_url: `${env.webAppUrl}/my-wins?payment=${payment.id}&status=cancelled`,
      'metadata[paymentId]': payment.id,
      'metadata[auctionId]': payment.auctionId,
      'metadata[winnerId]': payment.winnerId,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': payment.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(payment.amountMinor),
      'line_items[0][price_data][product_data][name]': 'Cubid winning bid'
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      throw new AppError('Unable to create Stripe checkout session', HTTP_STATUS.BAD_REQUEST, 'STRIPE_SESSION_FAILED', {
        status: response.status
      });
    }

    const session = (await response.json()) as StripeCheckoutSessionResponse;

    return {
      paymentId: payment.id,
      gateway: this.gateway,
      gatewayOrderId: session.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      checkoutUrl: session.url ?? undefined
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentGatewayVerificationResult> {
    this.assertConfigured();

    if (input.outcome === 'FAILED') {
      return {
        gatewayOrderId: input.gatewayOrderId,
        gatewayPaymentId: input.gatewayPaymentId ?? null,
        status: 'FAILED'
      };
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${input.gatewayOrderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.stripeSecretKey}`
      }
    });

    if (!response.ok) {
      throw new BadRequestError('Stripe checkout session could not be verified', 'PAYMENT_VERIFICATION_INVALID');
    }

    const session = (await response.json()) as StripeCheckoutSessionResponse;

    return {
      gatewayOrderId: session.id,
      gatewayPaymentId: session.payment_intent ?? input.gatewayPaymentId ?? null,
      status: session.payment_status === 'paid' ? 'SUCCESSFUL' : 'FAILED'
    };
  }

  async parseWebhook(input: PaymentWebhookInput): Promise<PaymentGatewayVerificationResult | null> {
    this.assertConfigured();

    if (!input.signature || !env.stripeWebhookSecret) {
      throw new BadRequestError('Stripe webhook signature is required', 'PAYMENT_WEBHOOK_INVALID');
    }

    this.verifyWebhookSignature(input.rawBody, input.signature);

    const payload = input.body as StripeWebhookPayload;
    const session = payload.data?.object;

    if (!session?.id) {
      return null;
    }

    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed'].includes(payload.type ?? '')) {
      return null;
    }

    return {
      gatewayOrderId: session.id,
      gatewayPaymentId: session.payment_intent ?? null,
      status: ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(payload.type ?? '')
        ? 'SUCCESSFUL'
        : 'FAILED'
    };
  }

  private verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): void {
    const timestamp = this.getStripeSignaturePart(signatureHeader, 't');
    const signatures = signatureHeader
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('v1='))
      .map((part) => part.slice(3));

    if (!timestamp || signatures.length === 0) {
      throw new BadRequestError('Stripe webhook signature is malformed', 'PAYMENT_WEBHOOK_INVALID');
    }

    const timestampSeconds = Number(timestamp);

    if (!Number.isSafeInteger(timestampSeconds)) {
      throw new BadRequestError('Stripe webhook timestamp is invalid', 'PAYMENT_WEBHOOK_INVALID');
    }

    const currentSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(currentSeconds - timestampSeconds) > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
      throw new BadRequestError('Stripe webhook timestamp is outside tolerance', 'PAYMENT_WEBHOOK_INVALID');
    }

    const expected = crypto
      .createHmac('sha256', env.stripeWebhookSecret)
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex');
    const valid = signatures.some((signature) => this.safeCompare(expected, signature));

    if (!valid) {
      throw new BadRequestError('Stripe webhook signature is invalid', 'PAYMENT_WEBHOOK_INVALID');
    }
  }

  private getStripeSignaturePart(signatureHeader: string, key: string): string | null {
    const part = signatureHeader
      .split(',')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${key}=`));

    return part ? part.slice(key.length + 1) : null;
  }

  private safeCompare(expected: string, actual: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);

    return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  private assertConfigured(): void {
    if (!env.stripeSecretKey) {
      throw new AppError('Stripe secret key is not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, 'PAYMENT_GATEWAY_NOT_CONFIGURED');
    }
  }
}

export const stripePaymentGatewayProvider = new StripePaymentGatewayProvider();
