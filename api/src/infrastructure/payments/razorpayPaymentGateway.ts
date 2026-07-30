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

interface RazorpayOrderResponse {
  id: string;
}

interface RazorpayWebhookPaymentEntity {
  id?: string;
  order_id?: string;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPaymentEntity;
    };
    order?: {
      entity?: {
        id?: string;
      };
    };
  };
}

export class RazorpayPaymentGatewayProvider implements PaymentGatewayProvider {
  readonly gateway = 'razorpay' as const;

  async createOrder(payment: EnginePaymentRecord): Promise<PaymentCheckoutOrder> {
    this.assertConfigured();

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: payment.amountMinor,
        currency: payment.currency,
        receipt: payment.id,
        notes: {
          paymentId: payment.id,
          auctionId: payment.auctionId,
          winnerId: payment.winnerId
        }
      })
    });

    if (!response.ok) {
      throw new AppError('Unable to create Razorpay order', HTTP_STATUS.BAD_REQUEST, 'RAZORPAY_ORDER_FAILED', {
        status: response.status
      });
    }

    const order = (await response.json()) as RazorpayOrderResponse;

    return {
      paymentId: payment.id,
      gateway: this.gateway,
      gatewayOrderId: order.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      keyId: env.razorpayKeyId
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

    if (!input.gatewayPaymentId || !input.gatewaySignature) {
      throw new BadRequestError('Razorpay payment id and signature are required', 'PAYMENT_VERIFICATION_INVALID');
    }

    const expected = crypto
      .createHmac('sha256', env.razorpayKeySecret)
      .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(input.gatewaySignature);
    const valid = expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    return {
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: input.gatewayPaymentId,
      status: valid ? 'SUCCESSFUL' : 'FAILED'
    };
  }

  async parseWebhook(input: PaymentWebhookInput): Promise<PaymentGatewayVerificationResult | null> {
    this.assertConfigured();

    if (!input.signature || !env.razorpayWebhookSecret) {
      throw new BadRequestError('Razorpay webhook signature is required', 'PAYMENT_WEBHOOK_INVALID');
    }

    const expected = crypto
      .createHmac('sha256', env.razorpayWebhookSecret)
      .update(input.rawBody)
      .digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(input.signature);
    const valid = expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (!valid) {
      throw new BadRequestError('Razorpay webhook signature is invalid', 'PAYMENT_WEBHOOK_INVALID');
    }

    const payload = input.body as RazorpayWebhookPayload;
    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;
    const gatewayOrderId = payment?.order_id ?? order?.id;

    if (!gatewayOrderId) {
      return null;
    }

    return {
      gatewayOrderId,
      gatewayPaymentId: payment?.id ?? null,
      status: ['payment.captured', 'order.paid'].includes(payload.event ?? '') ? 'SUCCESSFUL' : 'FAILED'
    };
  }

  private assertConfigured(): void {
    if (!env.razorpayKeyId || !env.razorpayKeySecret) {
      throw new AppError('Razorpay keys are not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, 'PAYMENT_GATEWAY_NOT_CONFIGURED');
    }
  }
}

export const razorpayPaymentGatewayProvider = new RazorpayPaymentGatewayProvider();
