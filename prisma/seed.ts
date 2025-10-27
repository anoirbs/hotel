import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadImage } from '@/lib/gridfs';

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedAdminPassword,
        isAdmin: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        password: hashedUserPassword,
        isAdmin: false,
      },
    });

    // Sample image upload
    let imageId: string | undefined;
    try {
      const imagePath = path.join(__dirname, 'sample-room.jpg');
      const imageBuffer = await fs.readFile(imagePath);
      imageId = await uploadImage(imageBuffer, 'sample-room.jpg');
    } catch (error) {
      console.warn('Sample image not found, skipping image upload:', error);
    }

    await prisma.room.createMany({
      data: [
        { 
          name: 'Room 101', 
          type: 'Standard', 
          price: 100, 
          description: 'Cozy single room with modern amenities', 
          imageId,
          capacity: 1,
          amenities: ['WiFi', 'AC', 'TV'],
          bedType: 'Single',
          size: '200 sq ft',
          images: []
        },
        { 
          name: 'Room 102', 
          type: 'Deluxe', 
          price: 150, 
          description: 'Spacious double room with premium features', 
          imageId,
          capacity: 2,
          amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
          bedType: 'Queen',
          size: '300 sq ft',
          images: []
        },
        { 
          name: 'Room 103', 
          type: 'Suite', 
          price: 250, 
          description: 'Luxury suite with separate living area', 
          imageId,
          capacity: 4,
          amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony'],
          bedType: 'King',
          size: '500 sq ft',
          images: []
        },
      ],
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

await main();