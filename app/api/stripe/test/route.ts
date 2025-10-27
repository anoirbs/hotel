import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const payload = token ? verifyToken(token) : null;
    
    if (!token || !payload?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publishableKey, secretKey } = await req.json();

    if (!publishableKey || !secretKey) {
      return NextResponse.json({ error: 'Both keys are required' }, { status: 400 });
    }

    // Test the Stripe keys by creating a test customer
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    try {
      // Test the secret key by making a simple API call
      await stripe.customers.list({ limit: 1 });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Stripe keys are valid and working' 
      });
    } catch (stripeError: any) {
      return NextResponse.json({ 
        error: `Stripe API error: ${stripeError.message}` 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error testing Stripe config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
