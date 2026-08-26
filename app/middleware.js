import { NextResponse } from 'next/server';

// Basic in-memory rate limiter for Edge Runtime
// Note: In a multi-region deployment this state is per-isolate, but it's sufficient for basic abuse prevention.
const rateLimitMap = new Map();

export function middleware(request) {
  // Extract IP from standard headers or request object
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  const limit = 30; // 30 requests per window
  const windowMs = 60 * 1000; // 1 minute window

  let data = rateLimitMap.get(ip);
  const now = Date.now();

  if (!data) {
    data = { count: 1, lastReset: now };
  } else {
    if (now - data.lastReset > windowMs) {
      // Reset window
      data.count = 1;
      data.lastReset = now;
    } else {
      data.count += 1;
      if (data.count > limit) {
        return new NextResponse(
          JSON.stringify({ 
            status: 'error', 
            message: 'Too Many Requests - Rate limit exceeded' 
          }), 
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'Retry-After': Math.ceil((windowMs - (now - data.lastReset)) / 1000).toString()
            },
          }
        );
      }
    }
  }
  
  rateLimitMap.set(ip, data);

  const response = NextResponse.next();
  
  // Set helpful rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - data.count).toString());

  return response;
}

export const config = {
  // Apply this middleware only to /api routes
  matcher: '/api/:path*',
};
