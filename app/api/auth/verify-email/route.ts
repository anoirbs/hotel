import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    // Check if token has expired
    if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
      return NextResponse.redirect(new URL('/login?error=token_expired', req.url));
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Generate token and redirect
    const jwtToken = generateToken(user);
    return NextResponse.redirect(
      new URL(`/login?verified=true&token=${jwtToken}`, req.url)
    );
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url));
  }
}

