import { useCallback, useState } from 'react';

import type { PlaceBidResult } from '../../../../entities/bid';
import { SOCKET_EVENTS, socketClient } from '../../../../shared/services/socket';

interface UseBidIntentOptions {
  auctionId?: string | null;
  disabled?: boolean;
  onAccepted?: (result: Extract<PlaceBidResult, { ok: true }>) => void;
  onRejected?: (result: Extract<PlaceBidResult, { ok: false }>) => void;
}

const createRequestId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const useBidIntent = ({ auctionId, disabled = false, onAccepted, onRejected }: UseBidIntentOptions = {}) => {
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PlaceBidResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const placeBid = useCallback(
    async (amountMinor: number, requestId = createRequestId()): Promise<PlaceBidResult> => {
      if (!auctionId) {
        const result: PlaceBidResult = {
          ok: false,
          code: 'AUCTION_NOT_FOUND',
          message: 'auctionId is required before placing a bid'
        };

        setLastResult(result);
        setError(result.message);
        onRejected?.(result);
        return result;
      }

      if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
        const result: PlaceBidResult = {
          ok: false,
          code: 'INVALID_AMOUNT',
          message: 'Bid amount must be a positive integer minor currency value'
        };

        setLastResult(result);
        setError(result.message);
        onRejected?.(result);
        return result;
      }

      setPendingRequestId(requestId);
      setError(null);

      const response = await socketClient.emitWithAck<
        { auctionId: string; amountMinor: number; requestId: string },
        PlaceBidResult
      >(SOCKET_EVENTS.BID_PLACE, {
        auctionId,
        amountMinor,
        requestId
      });

      setPendingRequestId(null);

      if (!response.success) {
        const result: PlaceBidResult = {
          ok: false,
          code: 'STATE_CONFLICT',
          message: response.error.message
        };

        setLastResult(result);
        setError(result.message);
        onRejected?.(result);
        return result;
      }

      setLastResult(response.data);

      if (response.data.ok) {
        onAccepted?.(response.data);
      } else {
        setError(response.data.message);
        onRejected?.(response.data);
      }

      return response.data;
    },
    [auctionId, onAccepted, onRejected]
  );

  return {
    canSubmit: Boolean(auctionId) && !disabled && !pendingRequestId,
    error,
    isSubmitting: Boolean(pendingRequestId),
    lastResult,
    pendingRequestId,
    placeBid
  };
};
