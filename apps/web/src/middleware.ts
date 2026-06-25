import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/reset-password'];

// API auth routes
const apiAuthPrefix = '/api/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API auth routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Retrieve decrypted next-auth JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production',
  });


  // Handle public routes (e.g. login)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      if (token.role === 'MANAGER' || token.role === 'SUB_MANAGER') {
        return NextResponse.redirect(new URL('/manager', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Guard protected routes (redirect to login if unauthenticated)
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect MANAGER/SUB_MANAGER role requesting root '/' to their dashboard '/manager'
  if ((token.role === 'MANAGER' || token.role === 'SUB_MANAGER') && pathname === '/') {
    return NextResponse.redirect(new URL('/manager', request.url));
  }

  // Restrict access to '/manager' routes to MANAGER/SUB_MANAGER role
  if (pathname.startsWith('/manager') && token.role !== 'MANAGER' && token.role !== 'SUB_MANAGER') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
