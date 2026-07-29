import { useEffect, type ReactNode } from 'react';

import { socketClient } from '../../../shared/services/socket';

interface SocketLifecycleProps {
  children: ReactNode;
}

export const SocketLifecycle = ({ children }: SocketLifecycleProps) => {
  useEffect(() => {
    socketClient.connect();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return <>{children}</>;
};
