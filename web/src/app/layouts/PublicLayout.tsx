import { Outlet } from 'react-router-dom';

import './ProductShell.css';

export const PublicLayout = () => (
  <main className="product-shell product-shell--public">
    <Outlet />
  </main>
);
