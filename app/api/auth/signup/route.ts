import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

function generateVerificationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

async function sendVerificationEmail(email: string, token: string, origin: string) {
  // In production, use a service like SendGrid, Nodemailer, etc.
  // For now, we'll log it and return the verification URL
  const verificationUrl = `${origin}/api/auth/verify-email?token=${token}`;
  
  console.log('Verification email would be sent to:', email);
  console.log('Verification URL:', verificationUrl);
  
  // TODO: Implement actual email sending
  // Example with nodemailer or SendGrid would go here
  return verificationUrl;
}

export async function POST(req: NextRequest) {
  try {
    const data = signupSchema.parse(await req.json());
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hours expiry

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        isAdmin: false,
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
      },
    });

    // Send verification email
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const verificationUrl = await sendVerificationEmail(user.email, verificationToken, origin);

    return NextResponse.json({ 
      message: 'Please check your email to verify your account.',
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined, // Only in dev
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}