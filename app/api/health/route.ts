import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

function rateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Input sanitization
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Security headers middleware
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
  );
  
  return response;
}

// Error logging (in production, use proper logging service)
function logError(error: any, context: string) {
  console.error(`[${new Date().toISOString()}] ${context}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
}

// Health check endpoint
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'degraded';
    }

    const response = NextResponse.json(health);
    return addSecurityHeaders(response);
  } catch (error) {
    logError(error, 'Health check');
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

// System metrics endpoint (admin only)
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        // System metrics
        const metrics = {
          timestamp: new Date().toISOString(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          cpu: process.cpuUsage(),
          rateLimitStore: rateLimitStore.size,
        };
        
        const response = NextResponse.json(metrics);
        return addSecurityHeaders(response);

      case 'cleanup':
        // Cleanup expired rate limit entries
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
          if (now > value.resetTime) {
            rateLimitStore.delete(key);
          }
        }
        
        return NextResponse.json({ 
          message: 'Cleanup completed',
          remainingEntries: rateLimitStore.size 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logError(error, 'System metrics');
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

