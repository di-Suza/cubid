import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';

import { baseQuery } from './baseQuery';

const refreshMutex = new Mutex();

export const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await refreshMutex.waitForUnlock();

  const result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  if (!refreshMutex.isLocked()) {
    const release = await refreshMutex.acquire();

    try {
      await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
    } finally {
      release();
    }
  } else {
    await refreshMutex.waitForUnlock();
  }

  return baseQuery(args, api, extraOptions);
};
