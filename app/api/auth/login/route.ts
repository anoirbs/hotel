import { NextRequest, NextResponse } from 'next/server';
import { generateToken, validateUser } from '@/lib/auth';

import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await req.json());
    const user = await validateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if email is verified (only for non-admin users)
    if (!user.isAdmin && !user.emailVerified) {
      return NextResponse.json({ 
        error: 'Please verify your email before logging in. Check your inbox for the verification link.' 
      }, { status: 403 });
    }

    const token = generateToken(user);
    return NextResponse.json({ token, isAdmin: user.isAdmin });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}