import { ChatMessageModel, type ChatMessageDocument } from './chatMessage.model.js';
import { UserModel } from '../users/user.model.js';
import type { ChatMessageRecord, ChatMessageRepositoryPort } from './chat.types.js';

export class ChatRepository implements ChatMessageRepositoryPort {
  constructor(
    private readonly chatMessageModel = ChatMessageModel,
    private readonly userModel = UserModel
  ) {}

  get model(): typeof this.chatMessageModel {
    return this.chatMessageModel;
  }

  async createMessage(input: { auctionId: string; senderId: string; message: string }): Promise<ChatMessageRecord> {
    const [message, user] = await Promise.all([
      this.chatMessageModel.create({
        auctionId: input.auctionId,
        senderId: input.senderId,
        message: input.message
      }),
      this.userModel.findById(input.senderId).select('name').lean()
    ]);

    return {
      id: String(message._id),
      auctionId: String(message.auctionId),
      sender: {
        id: input.senderId,
        name: typeof user?.name === 'string' ? user.name : 'Bidder'
      },
      message: message.message,
      createdAt: message.createdAt
    };
  }
}

export const chatRepository = new ChatRepository();

export type { ChatMessageDocument };
