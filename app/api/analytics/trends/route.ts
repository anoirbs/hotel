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

    // Room type performance - Use separate query on bookings grouped by roomId
    const bookingsByRoom = await prisma.booking.groupBy({
      by: ['roomId'],
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
    });

    // Get room types for the bookings
    const roomIds = bookingsByRoom.map(b => b.roomId);
    const rooms = await prisma.room.findMany({
      where: { id: { in: roomIds } },
      select: { id: true, type: true },
    });

    const roomTypeMap = new Map(rooms.map(r => [r.id, r.type]));
    
    // Aggregate by room type
    const roomTypePerformanceMap = new Map<string, { bookings: number; revenue: number }>();
    bookingsByRoom.forEach(booking => {
      const roomType = roomTypeMap.get(booking.roomId);
      if (roomType) {
        const existing = roomTypePerformanceMap.get(roomType) || { bookings: 0, revenue: 0 };
        roomTypePerformanceMap.set(roomType, {
          bookings: existing.bookings + booking._count.id,
          revenue: existing.revenue + (booking._sum.totalPrice || 0),
        });
      }
    });

    const roomTypePerformance = Array.from(roomTypePerformanceMap.entries()).map(([type, data]) => ({
      type,
      bookings: data.bookings,
      revenue: data.revenue,
    }));

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
      roomTypePerformance,
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