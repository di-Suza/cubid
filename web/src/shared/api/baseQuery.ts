import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { env } from '../config/env';

export const baseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { auth?: { accessToken?: string | null } };
    const accessToken = state.auth?.accessToken;

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    headers.set('Accept', 'application/json');
    return headers;
  }
});
