interface WebEnv {
  apiBaseUrl: string;
  socketUrl: string;
}

export const env: WebEnv = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8081'
});
