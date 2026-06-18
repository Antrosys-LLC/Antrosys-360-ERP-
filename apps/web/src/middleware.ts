import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/reset-password'];

// API auth routes
const apiAuthPrefix = '/api/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API auth routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // If authenticated and accessing login, redirect to dashboard
    const token = request.cookies.get('next-auth.session-token')?.value 
      || request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Check for session token for protected routes
  const token = request.cookies.get('next-auth.session-token')?.value 
    || request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
