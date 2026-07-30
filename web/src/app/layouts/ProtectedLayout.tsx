import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { useAppSelector } from '../store/hooks';
import { FullPageLoader } from '../../shared/components/FullPageLoader/FullPageLoader';
import { useLogoutMutation } from '../../features/auth';
import { Button } from '../../shared/ui';
import './ProductShell.css';

export const ProtectedLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bootstrapped, user } = useAppSelector((state) => state.auth);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    await logout().unwrap().catch(() => undefined);
    navigate('/', { replace: true });
  };

  if (!bootstrapped) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/sign-in" />;
  }

  return (
    <main className="product-shell product-shell--protected">
      <header className="product-nav">
        <Link className="product-nav__brand" to="/dashboard">BidArena</Link>
        <nav aria-label="Primary">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/auctions">Auctions</NavLink>
          <NavLink to="/create-auction">Create</NavLink>
          <NavLink to="/my-auctions">My auctions</NavLink>
          <NavLink to="/my-wins">My wins</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <Button disabled={isLoggingOut} icon={<LogOut size={16} />} onClick={() => void handleLogout()} variant="secondary">
          Sign out
        </Button>
      </header>
      <div className="product-shell__content">
        <Outlet />
      </div>
    </main>
  );
};
