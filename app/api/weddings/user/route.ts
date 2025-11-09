import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Get wedding inquiries for the logged-in user
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  
  if (!token || !payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's email from token
    const userEmail = payload.email;
    
    // Fetch wedding inquiries for this user's email
    const inquiries = await prisma.weddingInquiry.findMany({
      where: {
        email: userEmail,
      },
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


