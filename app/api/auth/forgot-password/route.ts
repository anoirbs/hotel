import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

function generateResetToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const data = forgotPasswordSchema.parse(await req.json());
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Always return success message (security best practice - don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiry

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Send password reset email
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    await sendPasswordResetEmail(user.email, resetToken, origin);

    return NextResponse.json({ 
      message: 'If an account with that email exists, we have sent a password reset link.' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

