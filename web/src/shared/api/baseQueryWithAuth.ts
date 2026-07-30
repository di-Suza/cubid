import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';

import { baseQuery } from './baseQuery';

const refreshMutex = new Mutex();

const isRefreshRequest = (args: string | FetchArgs): boolean => {
  if (typeof args === 'string') {
    return args === '/auth/refresh';
  }

  return args.url === '/auth/refresh';
};

const isAuthRefreshResponse = (
  value: unknown
): value is { success: true; data: { accessToken: string; user: unknown } } => {
  if (!value || typeof value !== 'object' || !('success' in value) || !('data' in value)) {
    return false;
  }

  const response = value as { success?: unknown; data?: unknown };
  const data = response.data;

  return (
    response.success === true &&
    data !== null &&
    data !== undefined &&
    typeof data === 'object' &&
    'accessToken' in data &&
    typeof (data as { accessToken?: unknown }).accessToken === 'string'
  );
};

export const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await refreshMutex.waitForUnlock();

  const result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || isRefreshRequest(args)) {
    return result;
  }

  if (!refreshMutex.isLocked()) {
    const release = await refreshMutex.acquire();

    try {
      const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);

      if (isAuthRefreshResponse(refreshResult.data)) {
        api.dispatch({
          type: 'auth/setCredentials',
          payload: refreshResult.data.data
        });
      } else {
        api.dispatch({
          type: 'auth/clearCredentials'
        });
        return result;
      }
    } finally {
      release();
    }
  } else {
    await refreshMutex.waitForUnlock();
  }

  return baseQuery(args, api, extraOptions);
};
