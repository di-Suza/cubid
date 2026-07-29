interface WebEnv {
  apiBaseUrl: string;
  socketUrl: string;
}

const requireEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env: WebEnv = Object.freeze({
  apiBaseUrl: requireEnv(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL'),
  socketUrl: requireEnv(import.meta.env.VITE_SOCKET_URL, 'VITE_SOCKET_URL')
});
