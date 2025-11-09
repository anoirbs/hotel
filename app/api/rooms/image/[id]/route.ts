import { NextRequest, NextResponse } from 'next/server';

import { ObjectId } from 'mongodb';
import { getImage } from '@/lib/gridfs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Validate ObjectId
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }
    const stream = await getImage(id);
    const chunks: Buffer[] = [];
    return new Promise<NextResponse>((resolve) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000',
            },
          })
        );
      });
      stream.on('error', (err) => {
        console.error('Image retrieval error:', err);
        resolve(NextResponse.json({ error: 'Image not found' }, { status: 404 }));
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}