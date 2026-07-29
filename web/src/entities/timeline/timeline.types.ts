export type TimelineEventType =
  | 'AUCTION_CREATED'
  | 'AUCTION_STARTED'
  | 'BID_ACCEPTED'
  | 'AUCTION_ENDED'
  | 'WINNER_DECLARED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED';

export interface TimelineEvent {
  id: string;
  auctionId: string;
  type: TimelineEventType;
  sequence: number;
  actorPublicId: string | null;
  publicMetadata: Record<string, unknown>;
  createdAt: string;
}
