import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import type { AuctionStatus } from '../../../../entities/auction';
import { LoadingSpinner } from '../../../../shared/ui';
import { getErrorMessage } from '../../../../shared/utils';
import { useListMyAuctionsQuery } from '../../api/auction.api';
import './AuctionMarketplacePages.css';

const statusOptions: Array<{ label: string; value: 'ALL' | AuctionStatus }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Completed', value: 'COMPLETED' }
];

const formatMoney = (amountMinor: number, currency: string): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);

export const MyAuctionsPage = () => {
  const [status, setStatus] = useState<'ALL' | AuctionStatus>('ALL');
  const { data, error, isLoading } = useListMyAuctionsQuery({
    status: status === 'ALL' ? undefined : status
  });

  return (
    <section className="market-page">
      <header className="market-page__header">
        <div>
          <p className="eyebrow">Seller</p>
          <h1>My auctions</h1>
        </div>
        <Link className="market-link-button" to="/create-auction">
          <Plus size={16} />
          New auction
        </Link>
      </header>

      <div className="market-toolbar market-toolbar--single">
        <div className="segmented-control segmented-control--filters" aria-label="My auction status filter">
          {statusOptions.map((option) => (
            <button
              aria-pressed={status === option.value}
              key={option.value}
              onClick={() => setStatus(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="market-state">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="market-state market-state--error">
          <p>{getErrorMessage(error, 'Unable to load your auctions')}</p>
        </div>
      ) : data?.items.length ? (
        <div className="owner-auction-list">
          {data.items.map((auction) => (
            <article key={auction.id}>
              <img alt={auction.title} src={auction.imageUrl} />
              <div>
                <span className={`status-pill status-pill--${auction.status}`}>{auction.status}</span>
                <h2>{auction.title}</h2>
                <p>{auction.description}</p>
              </div>
              <dl>
                <div>
                  <dt>Current</dt>
                  <dd>{formatMoney(auction.currentHighestBidMinor, auction.currency)}</dd>
                </div>
                <div>
                  <dt>Bids</dt>
                  <dd>{auction.bidCount ?? 0}</dd>
                </div>
              </dl>
              <Link to={`/auctions/${auction.id}`}>Open room</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="market-state">
          <h2>No auctions here yet</h2>
          <p>Create an auction and it will appear in this workspace.</p>
          <Link className="market-link-button" to="/create-auction">Create auction</Link>
        </div>
      )}
    </section>
  );
};
