import { FormEvent, useMemo, useState } from 'react';
import { CreditCard, Gavel, LogIn, RefreshCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { useBidIntent } from '../../../bids';
import { AuctionChatPanel, useAuctionChat } from '../../../chat';
import { useAppSelector } from '../../../../app/store/hooks';
import { Button, Input } from '../../../../shared/ui';
import { getErrorMessage } from '../../../../shared/utils';
import { useGetAuctionDetailQuery } from '../../api/auction.api';
import { useAuctionRoom } from '../hooks/useAuctionRoom';
import './AuctionRoomPage.css';

const formatMoney = (amountMinor: number, currency: string): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

const toAmountMinor = (value: string): number | null => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
};

export const AuctionRoomPage = () => {
  const { auctionId } = useParams();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [bidAmount, setBidAmount] = useState('');
  const detailQuery = useGetAuctionDetailQuery(auctionId ?? '', { skip: !auctionId });
  const { connected, error, lastRejection, resync, snapshot, status } = useAuctionRoom({ auctionId });
  const chat = useAuctionChat({ auctionId, enabled: Boolean(auctionId) });
  const bidIntent = useBidIntent({
    auctionId,
    disabled: !snapshot?.permissions.canBid,
    onAccepted: () => setBidAmount('')
  });

  const suggestedBid = useMemo(
    () => (snapshot ? (snapshot.minimumNextBidMinor / 100).toFixed(2) : ''),
    [snapshot]
  );
  const bidErrorMessage = bidIntent.error ?? (lastRejection && !lastRejection.ok ? lastRejection.message : null);
  const detail = detailQuery.data;
  const title = snapshot?.title ?? detail?.title ?? 'Auction room';
  const description = snapshot?.description ?? detail?.description ?? 'Waiting for the authoritative room snapshot.';
  const imageUrl = snapshot?.imageUrl ?? detail?.imageUrl;
  const currency = snapshot?.currency ?? detail?.currency ?? 'INR';
  const roomStatus = snapshot?.status ?? detail?.status ?? status;
  const currentBidMinor = snapshot?.currentHighestBidMinor ?? detail?.currentHighestBidMinor ?? 0;
  const minimumNextBidMinor = snapshot?.minimumNextBidMinor ?? detail?.startingBidMinor ?? 0;
  const roomNotice = (() => {
    if (!currentUser) {
      return {
        message: 'Guests can watch this room live. Sign in to bid or send chat.',
        cta: { icon: <LogIn size={16} />, label: 'Sign in', to: '/sign-in' }
      };
    }

    if (snapshot?.permissions.canPay) {
      return {
        message: 'You won this auction. Complete payment to lock the purchase.',
        cta: { icon: <CreditCard size={16} />, label: 'Pay winning bid', to: '/my-wins' }
      };
    }

    if (snapshot?.permissions.isWinner && snapshot.paymentStatus === 'SUCCESSFUL') {
      return { message: 'You won this auction and payment is complete.' };
    }

    if (snapshot?.status === 'COMPLETED' && snapshot.highestBidder) {
      return { message: `Auction completed. Winner: ${snapshot.highestBidder.name}.` };
    }

    if (snapshot?.permissions.isOwner) {
      return { message: 'Owner view is read-only for bidding, so the auction engine can prevent self-bids.' };
    }

    if (snapshot && !snapshot.permissions.canBid) {
      return { message: 'Bidding is closed or not available for this room state.' };
    }

    return null;
  })();

  const handleBidSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountMinor = toAmountMinor(bidAmount || suggestedBid);

    if (!amountMinor) {
      return;
    }

    await bidIntent.placeBid(amountMinor);
  };

  if (!auctionId) {
    return (
      <section className="auction-room-page auction-room-page--empty">
        <h1>Auction not found</h1>
      </section>
    );
  }

  return (
    <section className="auction-room-page">
      <header className="auction-room-header">
        <div>
          <p className="eyebrow">Live room</p>
          <h1>{title}</h1>
          <span className={`auction-room-header__status auction-room-header__status--${roomStatus}`}>
            {roomStatus}
          </span>
        </div>
        <div className="auction-room-header__actions">
          <span className={connected ? 'auction-room-signal auction-room-signal--online' : 'auction-room-signal'}>
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connected ? 'Connected' : 'Syncing'}
          </span>
          <Button icon={<RefreshCw size={16} />} onClick={() => void resync()} variant="secondary">
            Resync
          </Button>
        </div>
      </header>

      {error ? <p className="auction-room-alert">{error}</p> : null}
      {detailQuery.error && !snapshot ? (
        <p className="auction-room-alert">{getErrorMessage(detailQuery.error, 'Unable to load auction detail')}</p>
      ) : null}
      {roomNotice ? (
        <div className="auction-room-mode">
          <span>{roomNotice.message}</span>
          {roomNotice.cta ? (
            <Link to={roomNotice.cta.to}>
              {roomNotice.cta.icon}
              {roomNotice.cta.label}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="auction-room-grid">
        <main className="auction-room-main">
          <section className="auction-room-hero">
            {imageUrl ? (
              <img alt={title} src={imageUrl} />
            ) : (
              <div className="auction-room-hero__loading">Loading auction state</div>
            )}
            <div className="auction-room-hero__meta">
              <span>
                <ShieldCheck size={16} />
                Server authoritative
              </span>
              <p>{description}</p>
            </div>
          </section>

          <section className="auction-room-metrics" aria-label="Auction metrics">
            <article>
              <span>Current bid</span>
              <strong>{formatMoney(currentBidMinor, currency)}</strong>
            </article>
            <article>
              <span>Minimum next</span>
              <strong>{formatMoney(minimumNextBidMinor, currency)}</strong>
            </article>
            <article>
              <span>Bids</span>
              <strong>{snapshot?.bidCount ?? 0}</strong>
            </article>
            <article>
              <span>Heat</span>
              <strong>{snapshot?.stats.heat ?? 'LOW'}</strong>
            </article>
          </section>

          <form className="auction-room-bid" onSubmit={handleBidSubmit}>
            <Input
              disabled={!snapshot?.permissions.canBid || bidIntent.isSubmitting}
              label="Bid amount"
              min="0"
              name="bidAmount"
              onChange={(event) => setBidAmount(event.target.value)}
              placeholder={suggestedBid}
              step="0.01"
              type="number"
              value={bidAmount}
            />
            <Button
              disabled={!bidIntent.canSubmit}
              icon={<Gavel size={16} />}
              type="submit"
            >
              Place bid
            </Button>
          </form>

          {bidErrorMessage ? <p className="auction-room-alert auction-room-alert--inline">{bidErrorMessage}</p> : null}

          <section className="auction-room-lists">
            <div>
              <h2>Recent bids</h2>
              <div className="auction-room-list">
                {snapshot?.recentBids.length ? (
                  snapshot.recentBids.map((bid) => (
                    <article key={bid.id}>
                      <strong>{formatMoney(bid.amountMinor, snapshot.currency)}</strong>
                      <span>{bid.bidder.name}</span>
                    </article>
                  ))
                ) : (
                  <p>No bids yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2>Timeline</h2>
              <div className="auction-room-list">
                {snapshot?.timeline.length ? (
                  snapshot.timeline.map((event) => (
                    <article key={event.id}>
                      <strong>{event.type.replaceAll('_', ' ')}</strong>
                      <span>Sequence {event.sequence}</span>
                    </article>
                  ))
                ) : (
                  <p>No events yet.</p>
                )}
              </div>
            </div>
          </section>
        </main>

        <aside className="auction-room-side">
          <section className="auction-room-panel">
            <h2>Room state</h2>
            <dl>
              <div>
                <dt>Seller</dt>
                <dd>{snapshot?.seller.name ?? '--'}</dd>
              </div>
              <div>
                <dt>Highest bidder</dt>
                <dd>{snapshot?.highestBidder?.name ?? '--'}</dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>{snapshot ? formatDateTime(snapshot.endAt) : '--'}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{snapshot?.version ?? '--'}</dd>
              </div>
              <div>
                <dt>Last sequence</dt>
                <dd>{snapshot?.lastSequence ?? '--'}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{snapshot?.paymentStatus ?? '--'}</dd>
              </div>
              <div>
                <dt>Viewers</dt>
                <dd>{snapshot?.stats.onlineViewers ?? 0}</dd>
              </div>
            </dl>
          </section>

          <AuctionChatPanel
            disabled={!snapshot?.permissions.canChat}
            error={chat.error}
            isSending={chat.isSending}
            messages={chat.messages}
            onSend={chat.sendMessage}
          />
        </aside>
      </div>
    </section>
  );
};
