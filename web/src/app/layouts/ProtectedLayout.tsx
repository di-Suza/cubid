import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '../store/hooks';
import { FullPageLoader } from '../../shared/components/FullPageLoader/FullPageLoader';
import logoUrl from '../../shared/assets/images/logo.png';
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
      <header className="product-nav">
        <Link aria-label="Cubid dashboard" className="product-nav__brand" to="/dashboard">
          <img alt="Cubid" src={logoUrl} />
        </Link>
        <nav aria-label="Primary">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/auctions">Auctions</NavLink>
          <NavLink to="/create-auction">Create</NavLink>
          <NavLink to="/my-auctions">My auctions</NavLink>
          <NavLink to="/my-wins">My wins</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
      </header>
      <div className="product-shell__content">
        <Outlet />
      </div>
    </main>
  );
};
