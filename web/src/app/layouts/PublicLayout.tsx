import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAppSelector } from '../store/hooks';
import logoUrl from '../../shared/assets/images/logo.png';
import './ProductShell.css';

export const PublicLayout = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <main className="product-shell product-shell--public">
      <header className="product-nav">
        <Link aria-label="Cubid home" className="product-nav__brand" to="/">
          <img alt="Cubid" src={logoUrl} />
        </Link>
        <nav aria-label="Primary">
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/auctions">Auctions</NavLink>
              <NavLink to="/create-auction">Create</NavLink>
              <NavLink to="/my-auctions">My auctions</NavLink>
              <NavLink to="/my-wins">My wins</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/auctions">Auctions</NavLink>
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
