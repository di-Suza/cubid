import { RouterProvider } from 'react-router-dom';

import { router } from './app/router';
import { AppProviders } from './app/providers/AppProviders';

export const App = () => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
);
