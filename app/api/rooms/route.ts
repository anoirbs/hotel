import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/gridfs';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.string().min(1, 'Room type is required'),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  amenities: z.array(z.string()),
  bedType: z.string().min(1, 'Bed type is required'),
  size: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  available: z.boolean().optional().default(true),
});

export async function GET() {
  const rooms = await prisma.room.findMany();
  const imageExtensions = /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.avif|\.svg)$/i;
  const sanitized = rooms.map((r) => ({
    ...r,
    images: Array.isArray(r.images) ? r.images.filter((url) => imageExtensions.test(url)) : [],
  }));
  return NextResponse.json(sanitized);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const validatedData = roomSchema.parse(data);

    const room = await prisma.room.create({
      data: validatedData,
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}