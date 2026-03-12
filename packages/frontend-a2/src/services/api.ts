import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      return Promise.reject(new Error(error.response.data.error));
    }
    if (error.message) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error('Nepoznata greška'));
  },
);

export default api;
