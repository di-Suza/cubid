import { createBrowserRouter } from 'react-router-dom';

import { ProtectedLayout } from './layouts/ProtectedLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { NotFound } from '../shared/components/NotFound/NotFound';

const HomePlaceholder = () => (
  <section className="route-placeholder">
    <p className="eyebrow">Cubid BidArena</p>
    <h1>Real-time auction workspace ready.</h1>
  </section>
);

const DashboardPlaceholder = () => (
  <section className="route-placeholder">
    <p className="eyebrow">Protected</p>
    <h1>Dashboard shell ready.</h1>
  </section>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePlaceholder />
      }
    ]
  },
  {
    path: '/dashboard',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <DashboardPlaceholder />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
