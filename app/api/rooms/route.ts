import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';
import { uploadImage } from '@/lib/gridfs';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.string().min(1, 'Room type is required'),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required'),
  available: z.boolean().optional().default(true),
});

export async function GET() {
  const rooms = await prisma.room.findMany();
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
    };
    const validatedData = roomSchema.parse(data);
    let imageId: string | undefined;

    const file = formData.get('image') as File | null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageId = await uploadImage(buffer, file.name);
    }

    const room = await prisma.room.create({
      data: { ...validatedData, imageId },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}