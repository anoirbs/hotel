import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';
import { uploadImage } from '@/lib/gridfs';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').optional(),
  type: z.string().min(1, 'Room type is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  amenities: z.array(z.string()).optional(),
  bedType: z.string().min(1, 'Bed type is required').optional(),
  size: z.string().optional(),
  images: z.array(z.string()).optional(),
  available: z.boolean().optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          where: {
            status: { not: 'cancelled' },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const imageExtensions = /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.avif|\.svg)$/i;
    const sanitizedImages = Array.isArray(room.images) ? room.images.filter((url) => imageExtensions.test(url)) : [];

    // Calculate average rating
    const averageRating = room.reviews.length > 0
      ? room.reviews.reduce((sum, review) => sum + review.rating, 0) / room.reviews.length
      : 0;

    const roomWithStats = {
      ...room,
      images: sanitizedImages,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: room.reviews.length,
    };

    return NextResponse.json(roomWithStats);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const validatedData = updateRoomSchema.parse(data);

    const { id } = await ctx.params;
    const room = await prisma.room.update({
      where: { id },
      data: validatedData,
    });
    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ message: 'Room deleted' });
}