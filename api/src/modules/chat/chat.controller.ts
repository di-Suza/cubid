import { chatService, type ChatService } from './chat.service.js';

export class ChatController {
  constructor(private readonly service: ChatService = chatService) {}
}

export const chatController = new ChatController();
