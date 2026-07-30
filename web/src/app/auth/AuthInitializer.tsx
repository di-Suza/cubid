import type { ReactNode } from 'react';

import { useAppSelector } from '../store/hooks';
import { useRestoreSessionQuery } from '../../features/auth';
import { FullPageLoader } from '../../shared/components/FullPageLoader/FullPageLoader';

interface AuthInitializerProps {
  children: ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const bootstrapped = useAppSelector((state) => state.auth.bootstrapped);
  const { isLoading, isFetching } = useRestoreSessionQuery();

  if (!bootstrapped && (isLoading || isFetching)) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
};
