import { FormEvent, useMemo, useState } from 'react';
import { Gavel, RefreshCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { useBidIntent } from '../../../bids';
import { AuctionChatPanel, useAuctionChat } from '../../../chat';
import { Button, Input } from '../../../../shared/ui';
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
  const [bidAmount, setBidAmount] = useState('');
  const { connected, error, lastRejection, resync, snapshot, status } = useAuctionRoom({ auctionId });
  const chat = useAuctionChat({ auctionId, enabled: Boolean(snapshot?.permissions.canChat) });
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
          <h1>{snapshot?.title ?? 'Auction room'}</h1>
          <span className={`auction-room-header__status auction-room-header__status--${snapshot?.status ?? 'loading'}`}>
            {snapshot?.status ?? status}
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

      <div className="auction-room-grid">
        <main className="auction-room-main">
          <section className="auction-room-hero">
            {snapshot ? (
              <img alt={snapshot.title} src={snapshot.imageUrl} />
            ) : (
              <div className="auction-room-hero__loading">Loading auction state</div>
            )}
            <div className="auction-room-hero__meta">
              <span>
                <ShieldCheck size={16} />
                Server authoritative
              </span>
              <p>{snapshot?.description ?? 'Waiting for the authoritative room snapshot.'}</p>
            </div>
          </section>

          <section className="auction-room-metrics" aria-label="Auction metrics">
            <article>
              <span>Current bid</span>
              <strong>{snapshot ? formatMoney(snapshot.currentHighestBidMinor, snapshot.currency) : '--'}</strong>
            </article>
            <article>
              <span>Minimum next</span>
              <strong>{snapshot ? formatMoney(snapshot.minimumNextBidMinor, snapshot.currency) : '--'}</strong>
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
