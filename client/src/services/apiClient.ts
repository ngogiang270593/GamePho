import axios, { type AxiosError } from 'axios';

import { offlineGame, onlineGame } from './gameMode';
import { offlineAdapter } from './offline/adapter';
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  withCredentials: onlineGame,
  ...(offlineGame ? { adapter: offlineAdapter } : {}),
});

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    if (onlineGame && status === 401) window.dispatchEvent(new Event('xnl-session-expired'));
    const message = status === 401
      ? 'Bạn cần đăng nhập để tiếp tục.'
      : status === 404
        ? 'Không tìm thấy dữ liệu yêu cầu.'
        : status === 500
          ? 'Máy chủ gặp sự cố. Vui lòng thử lại sau.'
          : error.response?.data?.message ?? error.message ?? 'Không thể kết nối máy chủ.';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
