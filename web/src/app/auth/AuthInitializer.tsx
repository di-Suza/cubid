import { useEffect, type ReactNode } from 'react';

import { useAppDispatch } from '../store/hooks';
import { setAuthBootstrapped } from '../../features/auth/state/authSlice';

interface AuthInitializerProps {
  children: ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setAuthBootstrapped());
  }, [dispatch]);

  return <>{children}</>;
};
