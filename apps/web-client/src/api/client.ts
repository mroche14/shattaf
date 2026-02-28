import { createApiClient } from '@shattaf/api-client';
import { useAuthStore } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  },
});

export default apiClient;
