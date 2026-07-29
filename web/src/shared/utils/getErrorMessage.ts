export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { error?: { message?: string } } }).data;
    return data?.error?.message ?? fallback;
  }

  return fallback;
};
