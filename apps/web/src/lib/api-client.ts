import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    // In a real app, get the token from the session
    // For now, this is a placeholder
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access-token='))
        ?.split('=')[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 and 403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    // 403 errors are handled by individual components
    return Promise.reject(error);
  },
);

export default apiClient;
