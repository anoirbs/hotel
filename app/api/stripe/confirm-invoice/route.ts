import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const confirmSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  userName: z.string().min(1, 'User name is required'),
  userEmail: z.string().email('Invalid email'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  specialRequests: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const data = confirmSchema.parse(await req.json());
    
    console.log('Confirm invoice request:', { invoiceId: data.invoiceId, userId: payload.id });
    
    // Retrieve and verify invoice
    const invoice = await stripe.invoices.retrieve(data.invoiceId);
    console.log('Invoice retrieved:', { id: invoice.id, status: invoice.status, metadata: invoice.metadata });
    
    // Check if invoice is paid or has a successful payment intent
    let isPaid = invoice.status === 'paid';
    
    // If not marked as paid, check payment intent status
    if (!isPaid && invoice.payment_intent) {
      const paymentIntentId = typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent.id;
      
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        isPaid = paymentIntent.status === 'succeeded';
        
        // If payment succeeded but invoice not marked paid, pay the invoice
        if (isPaid && invoice.status !== 'paid') {
          try {
            await stripe.invoices.pay(invoice.id);
          } catch (err) {
            console.warn('Could not mark invoice as paid:', err);
            // Continue anyway since payment succeeded
          }
        }
      }
    }
    
    if (!isPaid) {
      return NextResponse.json({ 
        error: `Invoice is not paid. Current status: ${invoice.status}. Please complete payment first.` 
      }, { status: 400 });
    }

    // Verify the invoice belongs to the user
    console.log('Checking invoice ownership:', { 
      invoiceUserId: invoice.metadata?.userId, 
      payloadId: payload.id,
      match: invoice.metadata?.userId === payload.id 
    });
    
    if (invoice.metadata?.userId !== payload.id) {
      console.error('Invoice ownership mismatch:', {
        invoiceUserId: invoice.metadata?.userId,
        payloadId: payload.id,
        invoiceMetadata: invoice.metadata
      });
      return NextResponse.json({ 
        error: `Invoice does not belong to user. Invoice userId: ${invoice.metadata?.userId}, Payload userId: ${payload.id}` 
      }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check room availability one more time
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: data.roomId,
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
      return NextResponse.json(
        { error: 'Room not available for selected dates' },
        { status: 400 }
      );
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    // Refresh invoice to get PDF URL (it may not be immediately available)
    let invoiceUrl: string | null = null;
    try {
      const refreshedInvoice = await stripe.invoices.retrieve(data.invoiceId);
      invoiceUrl = refreshedInvoice.invoice_pdf || refreshedInvoice.hosted_invoice_url || null;
    } catch (err) {
      console.warn('Could not fetch invoice PDF URL:', err);
      invoiceUrl = invoice.invoice_pdf || invoice.hosted_invoice_url || null;
    }

    // Create booking
    console.log('Creating booking with data:', {
      roomId: data.roomId,
      userId: payload.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      invoiceId: data.invoiceId,
    });
    
    const booking = await prisma.booking.create({
      data: {
        roomId: data.roomId,
        userId: payload.id,
        userName: data.userName,
        userEmail: data.userEmail,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        paymentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || null,
        invoiceId: data.invoiceId,
        invoiceUrl,
        status: 'confirmed',
        specialRequests: data.specialRequests || null,
      },
    });

    console.log('Booking created successfully:', booking.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error confirming invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}

