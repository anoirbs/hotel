import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

// Input validation schemas
const auditLogSchema = z.object({
  action: z.enum(['login', 'logout', 'booking_create', 'booking_update', 'booking_cancel', 'room_create', 'room_update', 'room_delete']),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
});

// Audit logging
async function logAuditEvent(
  userId: string,
  action: string,
  resourceId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        timestamp: new Date(),
        ipAddress: 'unknown', // Would be passed from request
        userAgent: 'unknown', // Would be passed from request
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Security middleware
function validateRequest(req: NextRequest): { isValid: boolean; error?: string } {
  // Check for suspicious patterns
  const userAgent = req.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return { isValid: false, error: 'Suspicious user agent detected' };
  }

  // Check content length
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return { isValid: false, error: 'Request too large' };
  }

  return { isValid: true };
}

// Error handling wrapper
function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Validate request
      const validation = validateRequest(req);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorMessage = isDevelopment 
        ? (error as Error).message 
        : 'Internal server error';

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
}

// Audit log endpoints
export const GET = withErrorHandling(async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  const where: any = {};
  if (action) where.action = action;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const validatedData = auditLogSchema.parse(body);

  // Log the audit event
  await logAuditEvent(
    payload.id,
    validatedData.action,
    validatedData.resourceId,
    validatedData.details
  );

  return NextResponse.json({ message: 'Audit log created' }, { status: 201 });
});

// Security report endpoint
export const PUT = withErrorHandling(async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reportType = searchParams.get('type');

  switch (reportType) {
    case 'security':
      // Generate security report
      const suspiciousLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { action: 'login' },
            { action: 'logout' },
          ],
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      const failedLogins = suspiciousLogs.filter(log => 
        log.details && JSON.parse(log.details).success === false
      );

      return NextResponse.json({
        reportType: 'security',
        generatedAt: new Date().toISOString(),
        summary: {
          totalLogins: suspiciousLogs.length,
          failedLogins: failedLogins.length,
          suspiciousActivity: failedLogins.length > 10,
        },
        details: {
          recentLogins: suspiciousLogs.slice(0, 10),
          failedAttempts: failedLogins.slice(0, 5),
        },
      });

    case 'activity':
      // Generate activity report
      const activityLogs = await prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          id: true,
        },
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      });

      return NextResponse.json({
        reportType: 'activity',
        generatedAt: new Date().toISOString(),
        summary: {
          totalActions: activityLogs.reduce((sum, log) => sum + log._count.id, 0),
          actionBreakdown: activityLogs,
        },
      });

    default:
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  }
});

