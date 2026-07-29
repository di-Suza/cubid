import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthState } from '../model/auth.types';

const initialState: AuthState = {
  accessToken: null,
  user: null,
  bootstrapped: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Pick<AuthState, 'accessToken' | 'user'>>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.bootstrapped = true;
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      state.bootstrapped = true;
    },
    setAuthBootstrapped(state) {
      state.bootstrapped = true;
    }
  }
});

export const { clearCredentials, setAuthBootstrapped, setCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;
