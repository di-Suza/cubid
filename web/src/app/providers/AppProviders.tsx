import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { AuthInitializer } from '../auth/AuthInitializer';
import { store } from '../store/store';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary/ErrorBoundary';
import { SocketLifecycle } from './socket/SocketLifecycle';
import { ToastProvider } from './toast/ToastProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => (
  <Provider store={store}>
    <ErrorBoundary>
      <ToastProvider>
        <AuthInitializer>
          <SocketLifecycle>{children}</SocketLifecycle>
        </AuthInitializer>
      </ToastProvider>
    </ErrorBoundary>
  </Provider>
);
