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
  available: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const data = {
      name: formData.get('name') as string | undefined,
      type: formData.get('type') as string | undefined,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
      description: formData.get('description') as string | undefined,
      available: formData.get('available') ? formData.get('available') === 'true' : undefined,
    };
    const validatedData = updateRoomSchema.parse(data);
    let imageId: string | undefined;

    const file = formData.get('image') as File | null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageId = await uploadImage(buffer, file.name);
      validatedData.imageId = imageId;
    }

    const room = await prisma.room.update({
      where: { id: params.id },
      data: validatedData,
    });
    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await prisma.room.delete({ where: { id: params.id } });
  return NextResponse.json({ message: 'Room deleted' });
}