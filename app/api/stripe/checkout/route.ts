import { NextRequest, NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const { roomId, checkIn, checkOut, specialRequests } = await req.json();
    
    console.log('Creating checkout for:', { roomId, checkIn, checkOut, userId: payload.id });
    
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    console.log('Creating Stripe session - Room:', room.name, 'Nights:', nights, 'Total:', totalPrice);

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${room.name} - ${room.type}`,
              description: `Booking from ${checkIn} to ${checkOut} (${nights} night${nights > 1 ? 's' : ''})`,
            },
            unit_amount: Math.round(totalPrice * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}&roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`,
      cancel_url: `${origin}/book/${roomId}`,
      customer_email: payload.email,
      metadata: {
        roomId,
        userId: payload.id,
        checkIn,
        checkOut,
        userName: payload.email,
        specialRequests: specialRequests || '',
      },
    });

    console.log('Stripe session created successfully:', {
      sessionId: session.id,
      url: session.url,
      hasUrl: !!session.url
    });

    // The url should always be present for checkout sessions
    if (!session.url) {
      console.error('CRITICAL: Session created without URL', { sessionId: session.id });
      return NextResponse.json({ 
        error: 'Checkout session created but redirect URL is missing. Please contact support.',
        sessionId: session.id 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof Error) {
      // Log the full error for debugging
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Check for specific Stripe errors
      if (error.message.includes('Invalid API Key') || error.message.includes('Authentication')) {
        return NextResponse.json(
          { error: 'Stripe API key is invalid. Please check your Stripe configuration.' },
          { status: 500 }
        );
      }

      if (error.message.includes('STRIPE_SECRET_KEY')) {
        return NextResponse.json(
          { error: 'Stripe is not configured. Please contact the administrator.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}