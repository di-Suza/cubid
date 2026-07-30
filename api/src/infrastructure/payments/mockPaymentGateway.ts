import type { EnginePaymentRecord } from '../../modules/auction-engine/auctionEngine.types.js';
import type {
  PaymentCheckoutOrder,
  PaymentGatewayProvider,
  PaymentGatewayVerificationResult,
  PaymentVerificationInput,
  PaymentWebhookInput
} from './paymentGateway.types.js';

export class MockPaymentGatewayProvider implements PaymentGatewayProvider {
  readonly gateway = 'mock' as const;

  async createOrder(payment: EnginePaymentRecord): Promise<PaymentCheckoutOrder> {
    return {
      paymentId: payment.id,
      gateway: this.gateway,
      gatewayOrderId: `mock_order_${payment.id}`,
      amountMinor: payment.amountMinor,
      currency: payment.currency
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentGatewayVerificationResult> {
    return {
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: input.outcome === 'FAILED' ? null : `mock_payment_${Date.now()}`,
      status: input.outcome ?? 'SUCCESSFUL'
    };
  }

  async parseWebhook(_input: PaymentWebhookInput): Promise<PaymentGatewayVerificationResult | null> {
    return null;
  }
}

export const mockPaymentGatewayProvider = new MockPaymentGatewayProvider();
