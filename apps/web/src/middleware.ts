import { NextRequest, NextResponse } from 'next/server';

/**
 * Protected routes: any path not in PUBLIC_PATHS requires a session cookie.
 * The `bf-session` cookie is set by the client on login/register and cleared on logout.
 * Actual security is enforced by JWT validation on the API.
 */
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const hasSession = Boolean(request.cookies.get('bf-session')?.value);

  // Redirect unauthenticated users away from protected routes
  if (!isPublic && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isPublic && pathname !== '/' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
