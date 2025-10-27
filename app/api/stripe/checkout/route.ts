import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { roomId, checkIn, checkOut } = await req.json();
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${room.name} - ${room.type}`,
              description: `Booking from ${checkIn} to ${checkOut}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/book/${roomId}`,
      metadata: {
        roomId,
        userId: payload.id,
        checkIn,
        checkOut,
        userName: payload.email,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

