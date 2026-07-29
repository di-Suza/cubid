import type { AuctionEngineActor, EnginePublicUser } from '../auction-engine/auctionEngine.types.js';

export interface ChatMessageRecord {
  id: string;
  auctionId: string;
  sender: EnginePublicUser;
  message: string;
  createdAt: Date;
}

export interface SendChatMessageInput {
  auctionId: string;
  message: string;
  actor: AuctionEngineActor;
}

export interface ChatMessageRepositoryPort {
  createMessage(input: {
    auctionId: string;
    senderId: string;
    message: string;
  }): Promise<ChatMessageRecord>;
}
