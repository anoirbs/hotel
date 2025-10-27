import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Booking Analytics
    const totalBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const confirmedBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: startDate },
        status: 'confirmed',
      },
    });

    const cancelledBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: startDate },
        status: 'cancelled',
      },
    });

    // Revenue Analytics
    const totalRevenue = await prisma.booking.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const averageBookingValue = totalRevenue._sum.totalPrice 
      ? totalRevenue._sum.totalPrice / confirmedBookings 
      : 0;

    // Room Analytics
    const totalRooms = await prisma.room.count();
    const availableRooms = await prisma.room.count({
      where: { available: true },
    });

    // Occupancy Rate Calculation
    const bookingsInPeriod = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' },
      },
      select: {
        checkIn: true,
        checkOut: true,
        roomId: true,
      },
    });

    // Calculate occupancy rate
    const totalRoomNights = totalRooms * parseInt(period);
    const bookedRoomNights = bookingsInPeriod.reduce((total, booking) => {
      const nights = Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      return total + nights;
    }, 0);

    const occupancyRate = totalRoomNights > 0 ? (bookedRoomNights / totalRoomNights) * 100 : 0;

    // Customer Analytics
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
        isAdmin: false,
      },
    });

    const repeatCustomers = await prisma.user.count({
      where: {
        bookings: {
          some: {
            createdAt: { gte: startDate },
          },
        },
        _count: {
          bookings: {
            where: {
              createdAt: { gte: startDate },
            },
          },
        },
      },
    });

    // Top Performing Rooms
    const topRooms = await prisma.room.findMany({
      include: {
        bookings: {
          where: {
            createdAt: { gte: startDate },
            status: { not: 'cancelled' },
          },
        },
        _count: {
          select: {
            bookings: {
              where: {
                createdAt: { gte: startDate },
                status: { not: 'cancelled' },
              },
            },
          },
        },
      },
      orderBy: {
        bookings: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const analytics = {
      period: `${period} days`,
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      },
      revenue: {
        total: totalRevenue._sum.totalPrice || 0,
        average: averageBookingValue,
      },
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      },
      customers: {
        total: totalUsers,
        repeatCustomers,
        repeatRate: totalUsers > 0 ? (repeatCustomers / totalUsers) * 100 : 0,
      },
      topRooms: topRooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        bookings: room._count.bookings,
        revenue: room.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

