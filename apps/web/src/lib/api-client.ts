import axios from 'axios';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retried?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token cache to avoid hitting session endpoint on every request
let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

// Single-flight re-fetch of the session token after a 401. The NextAuth
// session endpoint refreshes an expired access token server-side, so this
// returns a rotated token without the browser ever seeing the refresh token.
let refreshSessionPromise: Promise<string | null> | null = null;

function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access-token='));
  return match ? match.split('=')[1] : null;
}

function setTokenCookie(token: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `access-token=${token}; path=/; SameSite=Lax`;
  }
}

function clearTokenCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'access-token=; path=/; Max-Age=0';
  }
}

async function getTokenFromSession(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/session');
    const session = await res.json();
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    cachedToken = cookieToken;
    return cookieToken;
  }

  if (cachedToken) return cachedToken;

  if (!tokenFetchPromise) {
    tokenFetchPromise = getTokenFromSession().then((token) => {
      cachedToken = token;
      tokenFetchPromise = null;

      if (token) {
        setTokenCookie(token);
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

async function refreshSessionTokenOnce(): Promise<string | null> {
  if (!refreshSessionPromise) {
    refreshSessionPromise = getTokenFromSession().then((token) => {
      refreshSessionPromise = null;
      cachedToken = token;
      if (token) {
        setTokenCookie(token);
      }
      return token;
    });
  }
  return refreshSessionPromise;
}

function forceSignOut() {
  // Lazy import to keep this module usable in non-browser environments.
  import('next-auth/react').then(({ signOut }) => {
    void signOut({ redirect: false });
  });
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
  async (error) => {
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Clear the stale cookie so the next token lookup can't replay it.
    clearTokenCookie();
    clearTokenCache();

    // A 401 with _retried already set means the retry also failed — the
    // session is dead (refresh token expired/invalidated), so sign out
    // cleanly instead of staying stuck in a half-logged-in state.
    if (error.config?._retried) {
      forceSignOut();
      return Promise.reject(error);
    }

    // Single-flight session re-fetch: the NextAuth jwt callback rotates the
    // expired access token server-side before this resolves.
    const freshToken = await refreshSessionTokenOnce();
    if (freshToken) {
      error.config._retried = true;
      return apiClient.request(error.config);
    }

    // No token could be obtained — the session is invalid.
    forceSignOut();
    return Promise.reject(error);
  },
);

export default apiClient;
