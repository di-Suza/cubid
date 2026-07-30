import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { Button, LoadingSpinner } from '../../../../shared/ui';
import { getErrorMessage } from '../../../../shared/utils';
import { useListMyWinsQuery } from '../../api/payment.api';
import { useWinnerPayment } from '../hooks/useWinnerPayment';
import './MyWinsPage.css';

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayInstance {
  open(): void;
  on(eventName: 'payment.failed', handler: (response: RazorpayFailureResponse) => void): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const formatMoney = (amountMinor: number, currency: string): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);

export const MyWinsPage = () => {
  const { data, error, isLoading } = useListMyWinsQuery();
  const { createCheckoutOrder, isProcessing, verifyCheckout } = useWinnerPayment();
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRazorpayCheckout = async () => {
    if (window.Razorpay) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (paymentId: string, title: string) => {
    setActionError(null);

    try {
      const checkout = await createCheckoutOrder(paymentId);

      if (checkout.gateway === 'mock') {
        throw new Error('Real payment gateway is not configured');
      }

      if (checkout.gateway === 'stripe' && checkout.checkoutUrl) {
        window.location.assign(checkout.checkoutUrl);
        return;
      }

      if (checkout.gateway !== 'razorpay' || !checkout.keyId) {
        throw new Error('Payment gateway checkout is not configured');
      }

      await loadRazorpayCheckout();

      if (!window.Razorpay) {
        throw new Error('Razorpay checkout could not start');
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amountMinor,
        currency: checkout.currency,
        name: 'Cubid',
        description: title,
        order_id: checkout.gatewayOrderId,
        handler: (response) => {
          void verifyCheckout({
            paymentId,
            gatewayOrderId: response.razorpay_order_id,
            gatewayPaymentId: response.razorpay_payment_id,
            gatewaySignature: response.razorpay_signature
          }).catch((verifyError) => {
            setActionError(getErrorMessage(verifyError, 'Unable to verify payment'));
          });
        },
        theme: {
          color: '#ffa116'
        }
      });

      razorpay.on('payment.failed', (response) => {
        void verifyCheckout({
          paymentId,
          gatewayOrderId: response.error?.metadata?.order_id ?? checkout.gatewayOrderId,
          gatewayPaymentId: response.error?.metadata?.payment_id,
          outcome: 'FAILED'
        }).catch((verifyError) => {
          setActionError(getErrorMessage(verifyError, 'Unable to record failed payment'));
        });
      });
      razorpay.open();
    } catch (checkoutError) {
      setActionError(getErrorMessage(checkoutError, 'Unable to start payment'));
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
                  <small>
                    <ShieldCheck size={14} />
                    {win.payment.gateway === 'mock' ? 'Gateway not configured' : `${win.payment.gateway} secured`}
                  </small>
                </div>
                <div className="wins-list__actions">
                  <Link to={`/auctions/${win.auction.id}`}>Open auction</Link>
                  {canPay ? (
                    <Button
                      disabled={isProcessing}
                      icon={<CreditCard size={16} />}
                      onClick={() => void handleCheckout(win.payment.id, win.auction.title)}
                    >
                      Pay now
                    </Button>
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
