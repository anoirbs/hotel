import Stripe from 'stripe';

const getStripeKey = (): string => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  if (!key.startsWith('sk_')) {
    throw new Error(`Invalid Stripe secret key format. Must start with sk_. Got: ${key.substring(0, 10)}...`);
  }
  return key;
};

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export const getStripe = (): Stripe => {
  if (globalForStripe.stripe) {
    return globalForStripe.stripe;
  }

  try {
    const key = getStripeKey();
    const stripe = new Stripe(key, {
      apiVersion: '2023-10-16', // Updated to newer version
      typescript: true,
    });
    globalForStripe.stripe = stripe;
    return stripe;
  } catch (error) {
    console.error('Stripe initialization error:', error);
    throw error;
  }
};