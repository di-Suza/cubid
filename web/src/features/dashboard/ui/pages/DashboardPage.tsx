import { Link } from 'react-router-dom';
import { CircleDollarSign, Gavel, Trophy } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks';
import { useListMyAuctionsQuery } from '../../../auctions';
import { useListMyWinsQuery } from '../../../payments';
import { LoadingSpinner } from '../../../../shared/ui';
import './DashboardPage.css';

export const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const myAuctions = useListMyAuctionsQuery({ limit: 6 });
  const myWins = useListMyWinsQuery();
  const activeAuctions = myAuctions.data?.items.filter((auction) => auction.status === 'ACTIVE').length ?? 0;
  const pendingPayments = myWins.data?.filter((win) => ['PENDING', 'FAILED'].includes(win.payment.status)).length ?? 0;

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>{user ? `${user.name}'s dashboard` : 'Dashboard'}</h1>
        </div>
        <Link to="/create-auction">Create auction</Link>
      </header>

      <div className="dashboard-stats">
        <article>
          <Gavel size={20} />
          <span>Created auctions</span>
          <strong>{myAuctions.data?.meta.total ?? 0}</strong>
        </article>
        <article>
          <Trophy size={20} />
          <span>Active listings</span>
          <strong>{activeAuctions}</strong>
        </article>
        <article>
          <CircleDollarSign size={20} />
          <span>Payments due</span>
          <strong>{pendingPayments}</strong>
        </article>
      </div>

      <div className="dashboard-panels">
        <section>
          <div className="dashboard-panel__header">
            <h2>Recent auctions</h2>
            <Link to="/my-auctions">View all</Link>
          </div>
          {myAuctions.isLoading ? (
            <LoadingSpinner />
          ) : myAuctions.data?.items.length ? (
            <div className="dashboard-list">
              {myAuctions.data.items.slice(0, 4).map((auction) => (
                <Link key={auction.id} to={`/auctions/${auction.id}`}>
                  <span>{auction.title}</span>
                  <strong>{auction.status}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">No auctions created yet.</p>
          )}
        </section>

        <section>
          <div className="dashboard-panel__header">
            <h2>Winner payments</h2>
            <Link to="/my-wins">View wins</Link>
          </div>
          {myWins.isLoading ? (
            <LoadingSpinner />
          ) : myWins.data?.length ? (
            <div className="dashboard-list">
              {myWins.data.slice(0, 4).map((win) => (
                <Link key={win.payment.id} to="/my-wins">
                  <span>{win.auction.title}</span>
                  <strong>{win.payment.status}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">No wins yet.</p>
          )}
        </section>
      </div>
    </section>
  );
};
