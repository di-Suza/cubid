import { ChatMessageModel, type ChatMessageDocument } from './chatMessage.model.js';

export class ChatRepository {
  constructor(private readonly chatMessageModel = ChatMessageModel) {}

  get model(): typeof this.chatMessageModel {
    return this.chatMessageModel;
  }
}

export const chatRepository = new ChatRepository();

export type { ChatMessageDocument };
