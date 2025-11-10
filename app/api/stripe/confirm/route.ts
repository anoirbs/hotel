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
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    console.log('Confirm session request:', { sessionId, userId: payload.id });

    // **CHECK IF BOOKING ALREADY EXISTS FOR THIS SESSION**
    const existingBooking = await prisma.booking.findUnique({
      where: { paymentId: sessionId },
    });

    if (existingBooking) {
      console.log('Booking already exists for this session:', existingBooking.id);
      return NextResponse.json(existingBooking, { status: 200 });
    }
    
    // Retrieve and verify checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session retrieved:', { 
      id: session.id, 
      status: session.status, 
      payment_status: session.payment_status,
      metadata: session.metadata 
    });
    
    // Check if payment was completed
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        error: `Payment not completed. Current status: ${session.payment_status}. Please complete payment first.` 
      }, { status: 400 });
    }

    // Verify the session belongs to the user
    if (session.metadata?.userId !== payload.id) {
      return NextResponse.json({ 
        error: `Session does not belong to user` 
      }, { status: 403 });
    }

    // Extract booking data from session metadata
    const roomId = session.metadata?.roomId;
    const checkIn = session.metadata?.checkIn;
    const checkOut = session.metadata?.checkOut;
    const userName = session.metadata?.userName || payload.email.split('@')[0];
    const specialRequests = session.metadata?.specialRequests;

    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing booking information in session' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // CRITICAL: Check room availability one final time AFTER payment verification
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: roomId,
        status: 'confirmed',
        OR: [
          {
            AND: [
              { checkIn: { lte: checkOutDate } },
              { checkOut: { gte: checkInDate } },
            ],
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      // Payment was successful but room is no longer available
      console.error('Room no longer available after payment:', {
        roomId,
        checkIn,
        checkOut,
        conflictingBookings: conflictingBookings.length,
        sessionId: session.id
      });
      
      return NextResponse.json(
        { 
          error: 'This room was just booked by another guest. Your payment will be refunded within 5-10 business days. Please choose another room or different dates.',
          shouldRefund: true,
          sessionId: session.id
        },
        { status: 409 } // 409 Conflict status code
      );
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    // Get payment intent ID from session
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id || null;

    // Create booking only after confirming availability
    console.log('Creating booking with data:', {
      roomId,
      userId: payload.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      sessionId,
      paymentIntentId,
    });
    
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId: payload.id,
        userName,
        userEmail: user.email,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        paymentId: sessionId, // Use sessionId as unique identifier
        status: 'confirmed',
        specialRequests: specialRequests || null,
      },
    });

    console.log('Booking created successfully:', booking.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error confirming booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Check if it's a unique constraint error
    if (errorMessage.includes('Unique constraint') && errorMessage.includes('paymentId')) {
      // Booking already exists, fetch and return it
      const { sessionId } = await req.json();
      const existingBooking = await prisma.booking.findUnique({
        where: { paymentId: sessionId },
      });
      
      if (existingBooking) {
        console.log('Returning existing booking after constraint error:', existingBooking.id);
        return NextResponse.json(existingBooking, { status: 200 });
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}