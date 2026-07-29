import { Link } from 'react-router-dom';

import './NotFound.css';

export const NotFound = () => (
  <main className="not-found">
    <h1>Page not found</h1>
    <Link to="/">Go home</Link>
  </main>
);
