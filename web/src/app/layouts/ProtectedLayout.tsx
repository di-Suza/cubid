import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '../store/hooks';
import { FullPageLoader } from '../../shared/components/FullPageLoader/FullPageLoader';
import './ProductShell.css';

export const ProtectedLayout = () => {
  const location = useLocation();
  const { bootstrapped, user } = useAppSelector((state) => state.auth);

  if (!bootstrapped) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/sign-in" />;
  }

  return (
    <main className="product-shell product-shell--protected">
      <Outlet />
    </main>
  );
};
