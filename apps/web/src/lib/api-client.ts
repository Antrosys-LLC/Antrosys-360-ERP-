import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token cache to avoid hitting session endpoint on every request
let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access-token='));
  return match ? match.split('=')[1] : null;
}

async function getTokenFromSession(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/session');
    const session = await res.json();
    return session?.accessToken || null;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  // 1. Try cookie first (fastest)
  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    cachedToken = cookieToken;
    return cookieToken;
  }

  // 2. Use cached token if we have one
  if (cachedToken) return cachedToken;

  // 3. Fetch from NextAuth session (deduplicated)
  if (!tokenFetchPromise) {
    tokenFetchPromise = getTokenFromSession().then((token) => {
      cachedToken = token;
      tokenFetchPromise = null;

      // Also set the cookie for future requests
      if (token && typeof document !== 'undefined') {
        document.cookie = `access-token=${token}; path=/; SameSite=Lax`;
      }
      return token;
    });
  }

  return tokenFetchPromise;
}

// Allow external code to clear the token cache (e.g. on logout)
export function clearTokenCache() {
  cachedToken = null;
  tokenFetchPromise = null;
}

// Request interceptor: attach Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle errors
// NOTE: Do NOT auto-redirect on 401 here. The middleware already handles
// routing authenticated/unauthenticated users.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear cached token so next request fetches a fresh one
      clearTokenCache();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
