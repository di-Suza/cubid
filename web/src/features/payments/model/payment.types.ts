export type { Payment, PaymentGateway, PaymentStatus } from '../../../entities/payment';

export interface CreatePaymentOrderPayload {
  auctionId: string;
}
