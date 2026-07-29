import { Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import type { ChatMessage } from '../../../../entities/chat';
import { Button } from '../../../../shared/ui';
import './AuctionChatPanel.css';

interface AuctionChatPanelProps {
  disabled?: boolean;
  error?: string | null;
  isSending?: boolean;
  messages: ChatMessage[];
  onSend: (message: string) => Promise<unknown>;
}

const formatMessageTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));

export const AuctionChatPanel = ({ disabled = false, error, isSending = false, messages, onSend }: AuctionChatPanelProps) => {
  const [draft, setDraft] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || disabled || isSending) {
      return;
    }

    const response = await onSend(message);

    if (response && typeof response === 'object' && 'success' in response && response.success === true) {
      setDraft('');
    }
  };

  return (
    <section className="auction-chat-panel" aria-label="Auction chat">
      <div className="auction-chat-panel__header">
        <h2>Room chat</h2>
        <span>{messages.length}</span>
      </div>

      <div className="auction-chat-panel__messages" role="log" aria-live="polite">
        {messages.length ? (
          messages.map((message) => (
            <article className="auction-chat-panel__message" key={message.id}>
              <div>
                <strong>{message.sender.name}</strong>
                <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
              </div>
              <p>{message.message}</p>
            </article>
          ))
        ) : (
          <p className="auction-chat-panel__empty">No messages yet.</p>
        )}
      </div>

      <form className="auction-chat-panel__form" onSubmit={handleSubmit}>
        <input
          aria-label="Chat message"
          disabled={disabled || isSending}
          maxLength={1000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message"
          value={draft}
        />
        <Button disabled={disabled || isSending || !draft.trim()} icon={<Send size={16} />} type="submit">
          Send
        </Button>
      </form>

      {error ? <p className="auction-chat-panel__error">{error}</p> : null}
    </section>
  );
};
