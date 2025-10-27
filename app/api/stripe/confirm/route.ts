import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const confirmSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId } = confirmSchema.parse(await req.json());
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { roomId, userId, checkIn, checkOut, userName } = session.metadata!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        userName,
        userEmail: user.email,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        paymentId: session.payment_intent as string,
      },
    });

    // Don't set room as unavailable permanently - check availability dynamically
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
