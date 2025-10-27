import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  userName: z.string().min(1, 'Name is required'),
  userEmail: z.string().email('Invalid email address'),
  checkIn: z.string().refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid check-in date' }),
  checkOut: z.string().refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid check-out date' }),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = token ? verifyToken(token) : null;
  if (!token || !payload?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: { room: { select: { name: true, type: true } } },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = token ? verifyToken(token) : null;
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = bookingSchema.parse(await req.json());
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId: data.roomId,
        OR: [
          {
            checkIn: { lte: checkOut },
            checkOut: { gte: checkIn },
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      return NextResponse.json({ error: 'Room is already booked for the selected dates' }, { status: 400 });
    }

    // Calculate total price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    const booking = await prisma.booking.create({
      data: {
        roomId: data.roomId,
        userId: payload.id,
        userName: data.userName,
        userEmail: data.userEmail,
        checkIn,
        checkOut,
        totalPrice,
      },
    });

    // Don't set room as unavailable permanently - check availability dynamically
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}