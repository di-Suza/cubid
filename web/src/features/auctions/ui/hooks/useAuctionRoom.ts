import { useCallback, useEffect, useState } from 'react';

import type { AuctionSnapshot, AuctionStats } from '../../../../entities/auction';
import type { Bid, PlaceBidResult } from '../../../../entities/bid';
import { SOCKET_EVENTS, socketClient, type SocketAck } from '../../../../shared/services/socket';

type RoomConnectionStatus = 'idle' | 'joining' | 'joined' | 'reconnecting' | 'error';

interface UseAuctionRoomOptions {
  auctionId?: string | null;
  enabled?: boolean;
  onBidAccepted?: (bid: Bid) => void;
  onBidRejected?: (result: PlaceBidResult) => void;
  onSnapshot?: (snapshot: AuctionSnapshot) => void;
}

const isNewerSnapshot = (current: AuctionSnapshot | null, next: AuctionSnapshot): boolean => {
  if (!current) {
    return true;
  }

  if (next.version !== current.version) {
    return next.version > current.version;
  }

  return next.lastSequence >= current.lastSequence;
};

export const useAuctionRoom = ({
  auctionId,
  enabled = true,
  onBidAccepted,
  onBidRejected,
  onSnapshot
}: UseAuctionRoomOptions = {}) => {
  const [status, setStatus] = useState<RoomConnectionStatus>('idle');
  const [snapshot, setSnapshot] = useState<AuctionSnapshot | null>(null);
  const [lastAcceptedBid, setLastAcceptedBid] = useState<Bid | null>(null);
  const [lastRejection, setLastRejection] = useState<PlaceBidResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback(
    (next: AuctionSnapshot) => {
      setSnapshot((current) => (isNewerSnapshot(current, next) ? next : current));
      onSnapshot?.(next);
    },
    [onSnapshot]
  );

  useEffect(() => {
    if (!enabled || !auctionId) {
      setStatus('idle');
      setSnapshot(null);
      return;
    }

    let active = true;
    socketClient.connect();

    const joinRoom = async () => {
      setStatus(socketClient.instance?.connected ? 'joining' : 'reconnecting');
      setError(null);

      const response = await socketClient.emitWithAck<{ auctionId: string }, AuctionSnapshot>(
        SOCKET_EVENTS.AUCTION_JOIN,
        { auctionId }
      );

      if (!active) {
        return;
      }

      if (response.success) {
        applySnapshot(response.data);
        setStatus('joined');
        return;
      }

      setStatus('error');
      setError(response.error.message);
    };

    const handleSnapshot = (next: AuctionSnapshot) => {
      applySnapshot(next);
      setStatus('joined');
      setError(null);
    };

    const handleStatsUpdate = (stats: AuctionStats) => {
      setSnapshot((current) => (current ? { ...current, stats } : current));
    };

    const handleBidAccepted = (bid: Bid) => {
      setLastAcceptedBid(bid);
      onBidAccepted?.(bid);
    };

    const handleBidRejected = (result: PlaceBidResult) => {
      setLastRejection(result);
      onBidRejected?.(result);
    };

    const handleRoomError = (payload: { message?: string }) => {
      setStatus('error');
      setError(payload.message ?? 'Realtime room error');
    };

    const handleDisconnect = () => {
      if (active) {
        setStatus('reconnecting');
      }
    };

    socketClient.on('connect', joinRoom);
    socketClient.on('disconnect', handleDisconnect);
    socketClient.on<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_SNAPSHOT, handleSnapshot);
    socketClient.on<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_STATE, handleSnapshot);
    socketClient.on<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_STARTED, handleSnapshot);
    socketClient.on<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_ENDED, handleSnapshot);
    socketClient.on<[AuctionStats]>(SOCKET_EVENTS.STATS_UPDATE, handleStatsUpdate);
    socketClient.on<[Bid]>(SOCKET_EVENTS.BID_ACCEPTED, handleBidAccepted);
    socketClient.on<[PlaceBidResult]>(SOCKET_EVENTS.BID_REJECTED, handleBidRejected);
    socketClient.on<[{ message?: string }]>(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);

    void joinRoom();

    return () => {
      active = false;
      socketClient.instance?.emit(SOCKET_EVENTS.AUCTION_LEAVE, { auctionId });
      socketClient.off('connect', joinRoom);
      socketClient.off('disconnect', handleDisconnect);
      socketClient.off<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_SNAPSHOT, handleSnapshot);
      socketClient.off<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_STATE, handleSnapshot);
      socketClient.off<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_STARTED, handleSnapshot);
      socketClient.off<[AuctionSnapshot]>(SOCKET_EVENTS.AUCTION_ENDED, handleSnapshot);
      socketClient.off<[AuctionStats]>(SOCKET_EVENTS.STATS_UPDATE, handleStatsUpdate);
      socketClient.off<[Bid]>(SOCKET_EVENTS.BID_ACCEPTED, handleBidAccepted);
      socketClient.off<[PlaceBidResult]>(SOCKET_EVENTS.BID_REJECTED, handleBidRejected);
      socketClient.off<[{ message?: string }]>(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
    };
  }, [applySnapshot, auctionId, enabled, onBidAccepted, onBidRejected]);

  const resync = useCallback(async (): Promise<SocketAck<AuctionSnapshot> | null> => {
    if (!enabled || !auctionId) {
      return null;
    }

    const response = await socketClient.emitWithAck<{ auctionId: string }, AuctionSnapshot>(
      SOCKET_EVENTS.AUCTION_RESYNC,
      { auctionId }
    );

    if (response.success) {
      applySnapshot(response.data);
      setStatus('joined');
      setError(null);
      return response;
    }

    setStatus('error');
    setError(response.error.message);
    return response;
  }, [applySnapshot, auctionId, enabled]);

  return {
    connected: status === 'joined',
    error,
    lastAcceptedBid,
    lastRejection,
    resync,
    snapshot,
    status
  };
};
