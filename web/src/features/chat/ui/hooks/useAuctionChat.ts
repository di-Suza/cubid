import { useCallback, useEffect, useState } from 'react';

import type { ChatMessage } from '../../../../entities/chat';
import { SOCKET_EVENTS, socketClient, type SocketAck } from '../../../../shared/services/socket';

interface UseAuctionChatOptions {
  auctionId?: string | null;
  enabled?: boolean;
}

export const useAuctionChat = ({ auctionId, enabled = true }: UseAuctionChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !auctionId) {
      setMessages([]);
      return;
    }

    socketClient.connect();

    const handleMessage = (message: ChatMessage) => {
      if (message.auctionId !== auctionId) {
        return;
      }

      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) {
          return current;
        }

        return [...current, message].slice(-100);
      });
    };

    socketClient.on<[ChatMessage]>(SOCKET_EVENTS.CHAT_MESSAGE, handleMessage);

    return () => {
      socketClient.off<[ChatMessage]>(SOCKET_EVENTS.CHAT_MESSAGE, handleMessage);
    };
  }, [auctionId, enabled]);

  const sendMessage = useCallback(
    async (message: string): Promise<SocketAck<ChatMessage> | null> => {
      if (!enabled || !auctionId) {
        return null;
      }

      setIsSending(true);
      setError(null);

      const response = await socketClient.emitWithAck<{ auctionId: string; message: string }, ChatMessage>(
        SOCKET_EVENTS.CHAT_SEND,
        {
          auctionId,
          message
        }
      );

      setIsSending(false);

      if (!response.success) {
        setError(response.error.message);
        return response;
      }

      return response;
    },
    [auctionId, enabled]
  );

  return {
    error,
    isSending,
    messages,
    sendMessage
  };
};
