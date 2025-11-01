import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  isAdmin: z.boolean().default(false),
  skipEmailVerification: z.boolean().default(false), // Admin can skip verification
});

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = createUserSchema.parse(await req.json());
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const userData: any = {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      isAdmin: data.isAdmin,
    };

    // If admin skips verification, mark as verified
    if (data.skipEmailVerification) {
      userData.emailVerified = true;
    } else {
      // Generate verification token for regular users
      const verificationToken = require('crypto').randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);
      
      userData.emailVerified = false;
      userData.verificationToken = verificationToken;
      userData.verificationTokenExpires = verificationTokenExpires;
    }

    const user = await prisma.user.create({
      data: userData,
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

