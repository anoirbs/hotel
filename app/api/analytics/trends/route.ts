import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Daily booking trends
    const dailyBookings = await prisma.booking.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
    });

    // Revenue trends by day
    const dailyRevenue = await prisma.booking.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' },
      },
      _sum: {
        totalPrice: true,
      },
    });

    // Room type performance
    const roomTypePerformance = await prisma.room.groupBy({
      by: ['type'],
      _count: {
        bookings: {
          where: {
            createdAt: { gte: startDate },
            status: { not: 'cancelled' },
          },
        },
      },
      _sum: {
        bookings: {
          where: {
            createdAt: { gte: startDate },
            status: { not: 'cancelled' },
          },
          _sum: {
            totalPrice: true,
          },
        },
      },
    });

    // Customer acquisition trends
    const customerAcquisition = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        isAdmin: false,
      },
      _count: {
        id: true,
      },
    });

    // Booking status distribution
    const statusDistribution = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    const trends = {
      period: `${period} days`,
      dailyBookings: dailyBookings.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count.id,
        revenue: item._sum.totalPrice || 0,
      })),
      dailyRevenue: dailyRevenue.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        revenue: item._sum.totalPrice || 0,
      })),
      roomTypePerformance: roomTypePerformance.map(item => ({
        type: item.type,
        bookings: item._count.bookings,
        revenue: item._sum.bookings || 0,
      })),
      customerAcquisition: customerAcquisition.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        newCustomers: item._count.id,
      })),
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
    };

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

