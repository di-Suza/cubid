import type { ReactNode } from 'react';

interface AuthInitializerProps {
  children: ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => <>{children}</>;
