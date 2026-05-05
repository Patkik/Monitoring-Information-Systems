import axios from 'axios';
import { dispatchAccountDeactivated } from '../constants/accountStatus';

// Support tests that run outside of Vite by allowing a test polyfill `importMetaEnv`.
declare const importMetaEnv: any;

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env?.VITE_API_URL) ||
  'http://localhost:4000/api'
).replace(/\/+$|\/+?(?=\?)/g, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    if (error?.response?.status === 403 && error?.response?.data?.error === 'ACCOUNT_DEACTIVATED') {
      dispatchAccountDeactivated(error?.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

export type ApiClient = typeof apiClient;
