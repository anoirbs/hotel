import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';

import { join } from 'node:path';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const payload = verifyToken(token || '');
  if (!token || !payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Generate deterministic safe filename
    const timestamp = Date.now();
    const namePart = (file.name?.split('.')?.slice(0, -1)?.join('.') || 'upload')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'upload';

    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
      'image/svg+xml': 'svg',
    };
    const originalExt = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
    const guessedExt = mimeToExt[file.type] || originalExt || 'jpg';
    const fileName = `room-${namePart}-${timestamp}.${guessedExt}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to public/uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);

    // Ensure upload directory exists before writing
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    // Build responses
    const imageUrl = `/uploads/${fileName}`;
    const base64 = buffer.toString('base64');
    const mime = file.type || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64}`;
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      dataUrl,
      fileName 
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
