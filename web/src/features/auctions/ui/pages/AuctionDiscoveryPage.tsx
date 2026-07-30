import { Link } from 'react-router-dom';
import { CalendarClock, Gavel } from 'lucide-react';
import { useState } from 'react';

import type { AuctionStatus, AuctionSummary } from '../../../../entities/auction';
import { useAppSelector } from '../../../../app/store/hooks';
import { Button, Input, LoadingSpinner } from '../../../../shared/ui';
import { useDebounce } from '../../../../shared/hooks';
import { getErrorMessage } from '../../../../shared/utils';
import { useListAuctionsQuery } from '../../api/auction.api';
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

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

const AuctionCard = ({ auction }: { auction: AuctionSummary }) => (
  <article className="auction-card">
    <Link aria-label={`Open ${auction.title}`} to={`/auctions/${auction.id}`}>
      <img alt={auction.title} src={auction.imageUrl} />
    </Link>
    <div className="auction-card__body">
      <div className="auction-card__topline">
        <span className={`status-pill status-pill--${auction.status}`}>{auction.status}</span>
        <span>{auction.bidCount ?? 0} bids</span>
      </div>
      <h2>
        <Link to={`/auctions/${auction.id}`}>{auction.title}</Link>
      </h2>
      <p>{auction.description}</p>
      <dl>
        <div>
          <dt>Current</dt>
          <dd>{formatMoney(auction.currentHighestBidMinor, auction.currency)}</dd>
        </div>
        <div>
          <dt>Start</dt>
          <dd>{formatDate(auction.startAt)}</dd>
        </div>
        <div>
          <dt>Seller</dt>
          <dd>{auction.seller.name}</dd>
        </div>
      </dl>
    </div>
  </article>
);

export const AuctionDiscoveryPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [status, setStatus] = useState<'ALL' | AuctionStatus>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const { data, error, isFetching, isLoading } = useListAuctionsQuery({
    status: status === 'ALL' ? undefined : status,
    search: debouncedSearch
  });
  const auctions = data?.items ?? [];

  return (
    <section className="market-page">
      <header className="market-page__header">
        <div>
          <p className="eyebrow">Auctions</p>
          <h1>Discover auctions</h1>
        </div>
        <Link className="market-link-button" to={user ? '/create-auction' : '/sign-in'}>
          <Gavel size={16} />
          Create auction
        </Link>
      </header>

      <div className="market-toolbar">
        <div className="segmented-control segmented-control--filters" aria-label="Auction status filter">
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
        <Input
          aria-label="Search auctions"
          name="search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title or description"
          value={search}
        />
      </div>

      {isLoading ? (
        <div className="market-state">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="market-state market-state--error">
          <p>{getErrorMessage(error, 'Unable to load auctions')}</p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Retry
          </Button>
        </div>
      ) : auctions.length ? (
        <>
          <div className="market-results-meta">
            <CalendarClock size={16} />
            <span>{isFetching ? 'Refreshing auctions' : `${data?.meta.total ?? auctions.length} auctions found`}</span>
          </div>
          <div className="auction-grid">
            {auctions.map((auction) => (
              <AuctionCard auction={auction} key={auction.id} />
            ))}
          </div>
        </>
      ) : (
        <div className="market-state">
          <h2>No auctions found</h2>
          <p>Try another status or search term.</p>
        </div>
      )}
    </section>
  );
};
