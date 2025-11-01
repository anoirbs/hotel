import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const { searchParams } = new URL(req.url);
    const isAdmin = payload.isAdmin;
    
    if (isAdmin) {
      // Admin: Get all invoices from Stripe
      const limit = parseInt(searchParams.get('limit') || '100');
      const startingAfter = searchParams.get('starting_after');
      
      const params: any = {
        limit,
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const invoices = await stripe.invoices.list(params);
      
      // Get booking details for each invoice
      const invoicesWithBookings = await Promise.all(
        invoices.data.map(async (invoice) => {
          const booking = invoice.metadata?.roomId
            ? await prisma.booking.findFirst({
                where: {
                  invoiceId: invoice.id,
                  OR: [
                    { invoiceId: invoice.id },
                    { paymentId: typeof invoice.payment_intent === 'string' 
                        ? invoice.payment_intent 
                        : invoice.payment_intent?.id || null }
                  ],
                },
              })
            : null;

          return {
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency,
            created: invoice.created,
            paid: invoice.status === 'paid',
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            customerEmail: invoice.customer_email,
            customerName: invoice.customer_name,
            booking: booking ? {
              id: booking.id,
              roomId: booking.roomId,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              userName: booking.userName,
              userEmail: booking.userEmail,
            } : null,
          };
        })
      );

      return NextResponse.json({
        invoices: invoicesWithBookings,
        hasMore: invoices.has_more,
      });
    } else {
      // User: Get only their invoices
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get customer ID from Stripe
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return NextResponse.json({ invoices: [] });
      }

      const customerId = customers.data[0].id;
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });

      // Get booking details
      const invoicesWithBookings = await Promise.all(
        invoices.data.map(async (invoice) => {
          const booking = await prisma.booking.findFirst({
            where: {
              userId: payload.id,
              invoiceId: invoice.id,
            },
            include: {
              room: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          });

          return {
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            created: invoice.created,
            paid: invoice.status === 'paid',
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            booking: booking ? {
              id: booking.id,
              room: booking.room,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
            } : null,
          };
        })
      );

      return NextResponse.json({ invoices: invoicesWithBookings });
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Check for Stripe authentication errors
    if (errorMessage.includes('Invalid API Key') || 
        errorMessage.includes('Authentication') ||
        errorMessage.includes('STRIPE_SECRET_KEY') ||
        (error instanceof Error && 'type' in error && (error as any).type === 'StripeAuthenticationError')) {
      return NextResponse.json(
        { 
          error: 'Stripe API key is invalid or not configured. Please check your STRIPE_SECRET_KEY environment variable.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

