import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateUserSchema = z.object({
  isAdmin: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin: data.isAdmin },
      select: { id: true, email: true, isAdmin: true, updatedAt: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    if ((error as any).name === 'ZodError') {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








