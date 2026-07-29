import { Outlet } from 'react-router-dom';

import './ProductShell.css';

export const ProtectedLayout = () => (
  <main className="product-shell product-shell--protected">
    <Outlet />
  </main>
);
