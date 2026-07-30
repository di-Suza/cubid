export type { Payment, PaymentGateway, PaymentStatus, WinnerPayment } from '../../../entities/payment';

export interface CreatePaymentOrderPayload {
  paymentId: string;
}

export interface MockCheckoutPayload {
  paymentId: string;
  outcome: 'SUCCESSFUL' | 'FAILED';
}

export interface PaymentCheckoutOrder {
  paymentId: string;
  gateway: 'mock' | 'razorpay' | 'stripe';
  gatewayOrderId: string;
  amountMinor: number;
  currency: string;
  keyId?: string;
  checkoutUrl?: string;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  outcome?: 'SUCCESSFUL' | 'FAILED';
}
