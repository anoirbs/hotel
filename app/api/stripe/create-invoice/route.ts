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
    const { roomId, checkIn, checkOut, amount } = await req.json();

    if (!roomId || !checkIn || !checkOut || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check room availability
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId,
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

    // Create or retrieve Stripe customer
    let customerId: string;
    // Try to find existing customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      // Update customer if phone is available and not set
      if (user.phone && !customers.data[0].phone) {
        await stripe.customers.update(customerId, {
          phone: user.phone,
        });
      }
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : undefined,
        phone: user.phone || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      description: `${room.name} - ${room.type} - Booking from ${checkIn} to ${checkOut}`,
    });

    // Create invoice as draft first
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'charge_automatically',
      auto_advance: false, // Don't auto-finalize yet
      metadata: {
        roomId,
        userId: payload.id,
        checkIn,
        checkOut,
        userName: user.email || user.firstName || user.email,
      },
    });

    // Finalize the invoice (this creates a payment intent but doesn't charge yet)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: false, // Don't auto-charge, user will pay via payment intent
    });

    // Get the payment intent client secret
    let clientSecret: string | null = null;
    if (finalizedInvoice.payment_intent) {
      const paymentIntentId = typeof finalizedInvoice.payment_intent === 'string'
        ? finalizedInvoice.payment_intent
        : finalizedInvoice.payment_intent.id;
      
      if (paymentIntentId) {
        // Fetch payment intent to get client secret
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        clientSecret = paymentIntent.client_secret;
      }
    }
    
    // If invoice is already paid (auto-advance succeeded), we still need the payment intent
    if (!clientSecret && finalizedInvoice.status === 'paid' && finalizedInvoice.payment_intent) {
      const paymentIntentId = typeof finalizedInvoice.payment_intent === 'string'
        ? finalizedInvoice.payment_intent
        : finalizedInvoice.payment_intent.id;
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        clientSecret = paymentIntent.client_secret;
      }
    }

    return NextResponse.json({ 
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url || finalizedInvoice.invoice_pdf,
      clientSecret,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
    
    // Check if it's a Stripe authentication error
    if (errorMessage.includes('Invalid API Key') || errorMessage.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Stripe API key is invalid. Please check your Stripe configuration.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

