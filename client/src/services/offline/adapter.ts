import type { AxiosAdapter } from 'axios';
import { runLocalRequest } from './storage';
export const offlineAdapter: AxiosAdapter = async config => {
  const url = new URL(config.url ?? '/', 'https://offline.local');
  const path = url.pathname.replace(/^\/api(?=\/)/, '');
  const params = { ...Object.fromEntries(url.searchParams), ...config.params };
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {};
  const data = await runLocalRequest((config.method ?? 'GET').toUpperCase(), path, body, params);
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};
