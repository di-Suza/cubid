import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAppSelector } from '../store/hooks';
import './ProductShell.css';

export const PublicLayout = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <main className="product-shell product-shell--public">
      <header className="product-nav">
        <Link className="product-nav__brand" to="/">BidArena</Link>
        <nav aria-label="Primary">
          <NavLink to="/auctions">Auctions</NavLink>
          {user ? (
            <NavLink to="/dashboard">Dashboard</NavLink>
          ) : (
            <>
              <NavLink to="/sign-in">Sign in</NavLink>
              <NavLink to="/sign-up">Sign up</NavLink>
            </>
          )}
        </nav>
      </header>
      <div className="product-shell__content">
        <Outlet />
      </div>
    </main>
  );
};
