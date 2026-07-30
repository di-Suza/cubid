import { chatRepository, type ChatRepository } from './chat.repository.js';
import { BadRequestError } from '../../shared/errors/BadRequestError.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';
import type { ChatMessageRecord, ChatMessageRepositoryPort, SendChatMessageInput } from './chat.types.js';

export class ChatService {
  constructor(private readonly repository: ChatMessageRepositoryPort = chatRepository) {}

  async sendMessage(input: SendChatMessageInput): Promise<ChatMessageRecord> {
    if (!input.actor.userId) {
      throw new UnauthorizedError('Authentication required for auction chat');
    }

    const message = input.message.trim();

    if (!message || message.length > 1000) {
      throw new BadRequestError('Chat message must be 1-1000 characters', 'INVALID_CHAT_MESSAGE');
    }

    if (!input.auctionId.trim()) {
      throw new BadRequestError('auctionId is required', 'INVALID_AUCTION_ID');
    }

    return this.repository.createMessage({
      auctionId: input.auctionId.trim(),
      senderId: input.actor.userId,
      message
    });
  }
}

export const chatService = new ChatService();

export type { ChatMessageRepositoryPort };
