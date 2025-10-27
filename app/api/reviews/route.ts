import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const reviewSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = reviewSchema.parse(await req.json());

    // Check if user has completed a booking for this room
    const completedBooking = await prisma.booking.findFirst({
      where: {
        userId: payload.id,
        roomId: data.roomId,
        checkOut: { lt: new Date() },
      },
    });

    if (!completedBooking) {
      return NextResponse.json({ error: 'You can only review rooms you have stayed in' }, { status: 400 });
    }

    // Check if user has already reviewed this room
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: payload.id,
        roomId: data.roomId,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this room' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        userId: payload.id,
        roomId: data.roomId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
