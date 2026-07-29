export type PaymentStatus = 'NOT_REQUIRED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED';
export type PaymentGateway = 'mock' | 'razorpay' | 'stripe';

export interface Payment {
  id: string;
  auctionId: string;
  winnerId: string;
  amountMinor: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  verifiedAt: string | null;
}
