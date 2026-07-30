import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Gavel, RadioTower, ShieldCheck, Sparkles, UsersRound, Zap } from 'lucide-react';
import type { CSSProperties } from 'react';

import { useAppSelector } from '../../../../app/store/hooks';
import { useListAuctionsQuery } from '../../../auctions';
import './LandingPage.css';

const heroLots = [
  {
    bids: '18 bids',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=480&q=80',
    price: 'INR 82,500',
    title: 'Chronograph'
  },
  {
    bids: '31 bids',
    image: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=480&q=80',
    price: 'INR 1,24,000',
    title: 'Rangefinder'
  },
  {
    bids: '12 bids',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=480&q=80',
    price: 'INR 38,200',
    title: 'Collector pair'
  }
];

const bidStream = ['INR 82,500 accepted', 'Timer extended', 'Winner locked', 'Payment ready'];

const proofStats = [
  { label: 'Sync', value: 'Live' },
  { label: 'Bids', value: 'Ordered' },
  { label: 'Payments', value: 'Verified' }
];

export const LandingPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useListAuctionsQuery({ limit: 3, status: 'ACTIVE' });

  return (
    <section className="landing-page">
      <section className="landing-hero" aria-labelledby="landingTitle">
        <div className="landing-hero__scene" aria-hidden="true">
          <div className="landing-console">
            <div className="landing-console__topbar">
              <span />
              <span />
              <span />
              <strong>auction engine</strong>
            </div>
            <div className="landing-console__grid">
              <article className="landing-live-lot">
                <img alt="" src={heroLots[0].image} />
                <div>
                  <span>Live lot</span>
                  <strong>{heroLots[0].title}</strong>
                  <p>{heroLots[0].price}</p>
                </div>
              </article>
              <div className="landing-meter">
                <RadioTower size={18} />
                <strong>42</strong>
                <span>watching now</span>
              </div>
              <div className="landing-bid-stream">
                {bidStream.map((item, index) => (
                  <span key={item} style={{ '--delay': `${index * 0.35}s` } as CSSProperties}>
                    <Zap size={14} />
                    {item}
                  </span>
                ))}
              </div>
              <div className="landing-lot-stack">
                {heroLots.slice(1).map((lot) => (
                  <article key={lot.title}>
                    <img alt="" src={lot.image} />
                    <div>
                      <strong>{lot.title}</strong>
                      <span>{lot.bids}</span>
                    </div>
                    <b>{lot.price}</b>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero__content">
          <p className="eyebrow">
            <Sparkles size={15} />
            Cubid
          </p>
          <h1 id="landingTitle">Cubid</h1>
          <p>
            Live auction rooms where bids, timers, winners, payments, and reconnects stay server-owned.
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
          <ul className="landing-proof" aria-label="Cubid proof points">
            {proofStats.map((stat) => (
              <li key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

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

      <section className="landing-flow" aria-label="Auction workflow">
        <article>
          <Gavel size={18} />
          <strong>Create</strong>
          <span>Seller-owned listings with image upload.</span>
        </article>
        <article>
          <Clock3 size={18} />
          <strong>Compete</strong>
          <span>Live rooms sync bids and timers instantly.</span>
        </article>
        <article>
          <ShieldCheck size={18} />
          <strong>Settle</strong>
          <span>Winner payments verify on the server.</span>
        </article>
        <article>
          <UsersRound size={18} />
          <strong>Recover</strong>
          <span>Reconnects receive a fresh room snapshot.</span>
        </article>
      </section>
    </section>
  );
};
