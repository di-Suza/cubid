import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { env } from '../config/env';

export const baseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');
    return headers;
  }
});
