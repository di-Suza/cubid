export type { Payment, PaymentGateway, PaymentStatus, WinnerPayment } from '../../../entities/payment';

export interface CreatePaymentOrderPayload {
  auctionId: string;
}

export interface MockCheckoutPayload {
  paymentId: string;
  outcome: 'SUCCESSFUL' | 'FAILED';
}
