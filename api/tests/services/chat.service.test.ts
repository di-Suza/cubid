import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestError } from '../../src/shared/errors/BadRequestError.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';
import { ChatService } from '../../src/modules/chat/chat.service.js';
import type { ChatMessageRecord, ChatMessageRepositoryPort } from '../../src/modules/chat/chat.types.js';

class FakeChatRepository implements ChatMessageRepositoryPort {
  readonly messages: ChatMessageRecord[] = [];

  createMessage = async (input: { auctionId: string; senderId: string; message: string }) => {
    const message: ChatMessageRecord = {
      id: `chat-${this.messages.length + 1}`,
      auctionId: input.auctionId,
      sender: {
        id: input.senderId,
        name: 'Bidder One'
      },
      message: input.message,
      createdAt: new Date('2026-07-30T10:00:00.000Z')
    };

    this.messages.push(message);
    return message;
  };
}

describe('ChatService', () => {
  it('persists a trimmed authenticated auction chat message', async () => {
    const repository = new FakeChatRepository();
    const service = new ChatService(repository);

    const message = await service.sendMessage({
      auctionId: 'auction-1',
      message: '  Final minute bid?  ',
      actor: { userId: 'user-1' }
    });

    assert.equal(message.message, 'Final minute bid?');
    assert.equal(message.sender.id, 'user-1');
    assert.equal(repository.messages.length, 1);
  });

  it('rejects unauthenticated chat messages', async () => {
    const service = new ChatService(new FakeChatRepository());

    await assert.rejects(
      () =>
        service.sendMessage({
          auctionId: 'auction-1',
          message: 'hello',
          actor: {}
        }),
      UnauthorizedError
    );
  });

  it('rejects blank chat messages before repository work', async () => {
    const repository = new FakeChatRepository();
    const service = new ChatService(repository);

    await assert.rejects(
      () =>
        service.sendMessage({
          auctionId: 'auction-1',
          message: '   ',
          actor: { userId: 'user-1' }
        }),
      BadRequestError
    );
    assert.equal(repository.messages.length, 0);
  });
});
