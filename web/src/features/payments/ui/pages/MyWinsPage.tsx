import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button, LoadingSpinner } from '../../../../shared/ui';
import { getErrorMessage } from '../../../../shared/utils';
import { useListMyWinsQuery } from '../../api/payment.api';
import { useWinnerPayment } from '../hooks/useWinnerPayment';
import './MyWinsPage.css';

const formatMoney = (amountMinor: number, currency: string): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);

export const MyWinsPage = () => {
  const { data, error, isLoading } = useListMyWinsQuery();
  const { completePayment, isProcessing } = useWinnerPayment();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCheckout = async (paymentId: string, outcome: 'SUCCESSFUL' | 'FAILED') => {
    setActionError(null);

    try {
      await completePayment({
        paymentId,
        outcome
      });
    } catch (checkoutError) {
      setActionError(getErrorMessage(checkoutError, 'Unable to update payment'));
    }
  };

  return (
    <section className="wins-page">
      <header className="wins-page__header">
        <div>
          <p className="eyebrow">Winner</p>
          <h1>My wins</h1>
        </div>
      </header>

      {actionError ? <p className="wins-page__error">{actionError}</p> : null}

      {isLoading ? (
        <div className="wins-state">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="wins-state wins-state--error">
          <p>{getErrorMessage(error, 'Unable to load wins')}</p>
        </div>
      ) : data?.length ? (
        <div className="wins-list">
          {data.map((win) => {
            const canPay = ['PENDING', 'FAILED'].includes(win.payment.status);

            return (
              <article key={win.payment.id}>
                <img alt={win.auction.title} src={win.auction.imageUrl} />
                <div className="wins-list__body">
                  <span className={`payment-pill payment-pill--${win.payment.status}`}>{win.payment.status}</span>
                  <h2>{win.auction.title}</h2>
                  <p>Seller: {win.auction.seller.name}</p>
                  <strong>{formatMoney(win.payment.amountMinor, win.payment.currency)}</strong>
                </div>
                <div className="wins-list__actions">
                  <Link to={`/auctions/${win.auction.id}`}>Open auction</Link>
                  {canPay ? (
                    <>
                      <Button
                        disabled={isProcessing}
                        icon={<CheckCircle2 size={16} />}
                        onClick={() => void handleCheckout(win.payment.id, 'SUCCESSFUL')}
                      >
                        Pay now
                      </Button>
                      <Button
                        disabled={isProcessing}
                        icon={<XCircle size={16} />}
                        onClick={() => void handleCheckout(win.payment.id, 'FAILED')}
                        variant="secondary"
                      >
                        Mark failed
                      </Button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="wins-state">
          <h2>No wins yet</h2>
          <p>Completed auctions you win will appear here with payment status.</p>
        </div>
      )}
    </section>
  );
};
