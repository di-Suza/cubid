import { chatRepository, type ChatRepository } from './chat.repository.js';

export class ChatService {
  constructor(private readonly repository: ChatRepository = chatRepository) {}
}

export const chatService = new ChatService();
