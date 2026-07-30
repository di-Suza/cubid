import { useEffect, type ReactNode } from 'react';

import { useAppSelector } from '../../store/hooks';
import { socketClient } from '../../../shared/services/socket';

interface SocketLifecycleProps {
  children: ReactNode;
}

export const SocketLifecycle = ({ children }: SocketLifecycleProps) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    socketClient.disconnect();
    socketClient.connect(accessToken ?? undefined);

    return () => {
      socketClient.disconnect();
    };
  }, [accessToken]);

  return <>{children}</>;
};
