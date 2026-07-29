import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithAuth } from './baseQueryWithAuth';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Auth', 'User', 'Auction', 'Bid', 'Timeline', 'Payment', 'Chat'],
  endpoints: () => ({})
});
