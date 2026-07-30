import type { PaymentGateway } from '../../shared/constants/auction.js';
import type { EnginePaymentRecord } from '../../modules/auction-engine/auctionEngine.types.js';

export interface PaymentCheckoutOrder {
  paymentId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  amountMinor: number;
  currency: string;
  keyId?: string;
  checkoutUrl?: string;
}

export interface PaymentVerificationInput {
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  outcome?: 'SUCCESSFUL' | 'FAILED';
}

export interface PaymentGatewayVerificationResult {
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  status: 'SUCCESSFUL' | 'FAILED';
}

export interface PaymentWebhookInput {
  signature?: string;
  rawBody: Buffer;
  body: unknown;
}

export interface PaymentGatewayProvider {
  readonly gateway: PaymentGateway;
  createOrder(payment: EnginePaymentRecord): Promise<PaymentCheckoutOrder>;
  verifyPayment(input: PaymentVerificationInput): Promise<PaymentGatewayVerificationResult>;
  parseWebhook(input: PaymentWebhookInput): Promise<PaymentGatewayVerificationResult | null>;
}
