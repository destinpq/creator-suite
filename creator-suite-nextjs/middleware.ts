import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // requests per window
};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return false;
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return true;
  }

  userLimit.count++;
  return false;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  return request.ip || 'unknown';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(clientIP)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900', // 15 minutes in seconds
          },
        }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();

  // Set security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://video-api.destinpq.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Authentication logic
  const token = request.cookies.get('token')?.value;
  const isAuthPage = pathname.startsWith('/user/login');
  const isPublicPage = pathname === '/' || pathname === '/landing' || pathname === '/tutorial';

  // Allow RSC/data-prefetch requests and Next.js router prefetch requests to pass through without redirects.
  const hasRscHeader = request.headers.has('rsc') || request.headers.has('RSC');
  const hasRouterState = request.headers.has('next-router-state-tree') || request.headers.has('Next-Router-State-Tree');
  if (hasRscHeader || hasRouterState) {
    return response;
  }

  // If the user is not authenticated and is requesting a guarded page, send them to the login page
  // and preserve the original destination as a `next` query parameter for post-login redirect.
  if (!token && !isAuthPage && !isPublicPage) {
    const loginUrl = new URL('/user/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is authenticated and tries to access the login page, send them to the home dashboard.
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
