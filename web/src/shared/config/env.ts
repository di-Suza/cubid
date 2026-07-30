interface WebEnv {
  apiBaseUrl: string;
  socketUrl: string;
}

const defaultOrigin = typeof window === 'undefined' ? '' : window.location.origin;

export const env: WebEnv = Object.freeze({
  apiBaseUrl: import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_BASE_URL || '/api',
  socketUrl: import.meta.env.PROD ? defaultOrigin : import.meta.env.VITE_SOCKET_URL || defaultOrigin
});
