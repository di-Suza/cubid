import type { PublicUser } from '../user';

export interface ChatMessage {
  id: string;
  auctionId: string;
  sender: PublicUser;
  message: string;
  createdAt: string;
}
