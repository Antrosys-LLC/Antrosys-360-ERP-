import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Refresh the access token shortly before it expires.
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

// Decodes just the exp claim of an access JWT without verifying it — used only
// to decide when to rotate the token. The token itself is verified by the API.
function decodeJwtExp(token: string): number | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
  } catch {
    // Network error / backend not accepting requests yet (e.g. restart).
    // Keep the current session intact so the next poll can retry — do NOT
    // treat a transient failure as a dead session.
    return token;
  }

  // Only an explicit rejection of the refresh token truly invalidates the
  // session (7-day expiry reached, token revoked, hash replaced).
  if (res.status === 401) {
    const { accessToken: _, refreshToken: __, expiresAt: ___, ...rest } = token;
    return rest as JWT;
  }

  // Any other failure (5xx, malformed body, unexpected status) is transient —
  // keep the existing session and let the next attempt retry.
  if (!res.ok) {
    return token;
  }

  let data: { accessToken?: string; refreshToken?: string };
  try {
    data = await res.json();
  } catch {
    return token;
  }

  if (!data.accessToken) {
    return token;
  }

  return {
    ...token,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? token.refreshToken,
    expiresAt: decodeJwtExp(data.accessToken),
  };
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        console.log('[NextAuth] Using API URL:', apiUrl);

        try {
          // Call our Fastify backend for authentication
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();
          console.log('[NextAuth] API response status:', res.status, 'ok:', res.ok, 'has user:', !!data.user);

          if (res.ok && data.user) {
            // Include token inside the user object so NextAuth can store it in the session
            return {
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }
          console.log('[NextAuth] Auth failed:', data);
          return null;
        } catch (error) {
          console.error('[NextAuth] Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.expiresAt = decodeJwtExp((user as any).accessToken);
        return token;
      }

      // Existing session: rotate the access token once it's close to expiry.
      const expiresAt = typeof token.expiresAt === 'number' ? token.expiresAt : null;
      if (token.accessToken && (!expiresAt || Date.now() >= expiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS)) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        };
        if (token.accessToken) {
          (session as any).accessToken = token.accessToken;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect back to login on error
  },
  session: {
    strategy: 'jwt',
    // 7 days — matches the backend refresh token lifetime
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production',
});

export { handler as GET, handler as POST };
