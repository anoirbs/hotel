import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const weddingInquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  meetingDate: z.string().min(1, 'Meeting date is required'),
  guests: z.string().min(1, 'Number of guests is required'),
  requests: z.string().optional(),
});

// GET - Get all wedding inquiries (admin only)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inquiries = await prisma.weddingInquiry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Error fetching wedding inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

// POST - Create a new wedding inquiry
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const validatedData = weddingInquirySchema.parse(data);

    // Save to database using Prisma
    const inquiry = await prisma.weddingInquiry.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        meetingDate: validatedData.meetingDate,
        guests: validatedData.guests,
        requests: validatedData.requests || null,
        status: 'pending',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Inquiry submitted successfully',
      inquiry 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating wedding inquiry:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}

