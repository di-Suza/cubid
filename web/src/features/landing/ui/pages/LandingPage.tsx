import { Link } from 'react-router-dom';
import { ArrowRight, Gavel } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks';
import { useListAuctionsQuery } from '../../../auctions';
import './LandingPage.css';

export const LandingPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useListAuctionsQuery({ limit: 3, status: 'ACTIVE' });

  return (
    <section className="landing-page">
      <div className="landing-hero">
        <img
          alt="Auctioneer presenting a collection room"
          src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80"
        />
        <div className="landing-hero__content">
          <p className="eyebrow">Cubid BidArena</p>
          <h1>Live auctions, server-owned bidding.</h1>
          <p>
            Create listings, discover active rooms, watch as a guest, and let the auction engine own bids,
            timers, winners, and payment state.
          </p>
          <div>
            <Link to="/auctions">
              Browse auctions
              <ArrowRight size={16} />
            </Link>
            <Link to={user ? '/create-auction' : '/sign-up'}>
              <Gavel size={16} />
              {user ? 'Create auction' : 'Start selling'}
            </Link>
          </div>
        </div>
      </div>

      <section className="landing-preview" aria-label="Active auction preview">
        {data?.items.length ? (
          data.items.map((auction) => (
            <Link key={auction.id} to={`/auctions/${auction.id}`}>
              <img alt={auction.title} src={auction.imageUrl} />
              <span>{auction.title}</span>
              <strong>{auction.status}</strong>
            </Link>
          ))
        ) : (
          <Link to="/auctions">
            <span>Explore the marketplace</span>
            <strong>Discovery</strong>
          </Link>
        )}
      </section>
    </section>
  );
};
