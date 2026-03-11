import axios, { AxiosError, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// ── Response interceptor ───────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; errors?: string[] }>) => {
    // Network greška
    if (!error.response) {
      return Promise.reject(
        new Error('Serverska greška — provjeri konekciju'),
      );
    }

    // API greška sa porukom
    const apiMessage = error.response.data?.message;
    const apiErrors  = error.response.data?.errors;

    if (apiErrors && apiErrors.length > 0) {
      return Promise.reject(new Error(apiErrors.join('; ')));
    }

    if (apiMessage) {
      return Promise.reject(new Error(apiMessage));
    }

    return Promise.reject(
      new Error(`HTTP ${error.response.status}: ${error.response.statusText}`),
    );
  },
);
