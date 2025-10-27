import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const bookingUpdateSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  specialRequests: z.string().optional(),
});

const bookingCancelSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = bookingUpdateSchema.parse(await req.json());
    
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== payload.id && !payload.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to modify this booking' }, { status: 403 });
    }

    // Check if booking can be modified (not within 24 hours of check-in)
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilCheckIn < 24) {
      return NextResponse.json({ error: 'Booking cannot be modified within 24 hours of check-in' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.checkIn) updateData.checkIn = new Date(data.checkIn);
    if (data.checkOut) updateData.checkOut = new Date(data.checkOut);
    if (data.specialRequests) updateData.specialRequests = data.specialRequests;

    const updatedBooking = await prisma.booking.update({
      where: { id: data.bookingId },
      data: updateData,
      include: { room: true },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = bookingCancelSchema.parse(await req.json());
    
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== payload.id && !payload.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
    }

    // Check if booking can be cancelled (not within 24 hours of check-in)
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilCheckIn < 24) {
      return NextResponse.json({ error: 'Booking cannot be cancelled within 24 hours of check-in' }, { status: 400 });
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id: data.bookingId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json(cancelledBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

