export type PaymentStatus = 'NOT_REQUIRED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED';
export type PaymentGateway = 'mock' | 'razorpay' | 'stripe';

export interface Payment {
  id: string;
  auctionId: string;
  winnerId: string;
  amountMinor: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  status: PaymentStatus;
  verifiedAt: string | null;
}

export interface WinnerPaymentAuction {
  id: string;
  title: string;
  imageUrl: string;
  currency: string;
  winningAmountMinor: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  endAt: string;
  seller: {
    id: string;
    name: string;
  };
}

export interface WinnerPayment {
  payment: Payment;
  auction: WinnerPaymentAuction;
}
