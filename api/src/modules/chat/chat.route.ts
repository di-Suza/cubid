import { Router } from 'express';

import { chatController, type ChatController } from './chat.controller.js';

export class ChatRoute {
  readonly router = Router();

  constructor(private readonly controller: ChatController = chatController) {
    this.register();
  }

  private register(): void {
    // Chat history endpoints will be registered when room chat is implemented.
  }
}

export const chatRoute = new ChatRoute();
