import { api } from '../../../shared/api/api';
import type { ApiSuccessResponse } from '../../../shared/contracts';
import { clearCredentials, setCredentials } from '../state/authSlice';
import type { AuthCredentials, AuthResponse, RegisterPayload } from '../model/auth.types';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterPayload>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body
      }),
      transformResponse: (response: ApiSuccessResponse<AuthResponse>) => response.data,
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
      invalidatesTags: ['Auth', 'User']
    }),
    login: builder.mutation<AuthResponse, AuthCredentials>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body
      }),
      transformResponse: (response: ApiSuccessResponse<AuthResponse>) => response.data,
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
      invalidatesTags: ['Auth', 'User']
    }),
    restoreSession: builder.query<AuthResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST'
      }),
      transformResponse: (response: ApiSuccessResponse<AuthResponse>) => response.data,
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          dispatch(clearCredentials());
        }
      },
      providesTags: ['Auth', 'User']
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(api.util.resetApiState());
        }
      },
      invalidatesTags: ['Auth', 'User']
    })
  })
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useRestoreSessionQuery
} = authApi;
