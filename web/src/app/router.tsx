import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { ProtectedLayout } from './layouts/ProtectedLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { FullPageLoader } from '../shared/components/FullPageLoader/FullPageLoader';
import { NotFound } from '../shared/components/NotFound/NotFound';

const LandingPage = lazy(() => import('../pages/landing'));
const AuctionDiscoveryPage = lazy(() => import('../pages/auctions'));
const AuctionRoomPage = lazy(() => import('../pages/auction-room'));
const CreateAuctionPage = lazy(() => import('../pages/create-auction'));
const MyAuctionsPage = lazy(() => import('../pages/my-auctions'));
const MyWinsPage = lazy(() => import('../pages/my-wins'));
const DashboardPage = lazy(() => import('../pages/dashboard'));
const ProfilePage = lazy(() => import('../pages/profile'));
const SignInPage = lazy(() => import('../pages/sign-in'));
const SignUpPage = lazy(() => import('../pages/sign-up'));

const withSuspense = (element: ReactElement) => <Suspense fallback={<FullPageLoader />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<LandingPage />)
      },
      {
        path: 'auctions',
        element: withSuspense(<AuctionDiscoveryPage />)
      },
      {
        path: 'auctions/:auctionId',
        element: withSuspense(<AuctionRoomPage />)
      },
      {
        path: 'sign-in',
        element: withSuspense(<SignInPage />)
      },
      {
        path: 'sign-up',
        element: withSuspense(<SignUpPage />)
      }
    ]
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: 'dashboard',
        element: withSuspense(<DashboardPage />)
      },
      {
        path: 'create-auction',
        element: withSuspense(<CreateAuctionPage />)
      },
      {
        path: 'my-auctions',
        element: withSuspense(<MyAuctionsPage />)
      },
      {
        path: 'my-wins',
        element: withSuspense(<MyWinsPage />)
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />)
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
