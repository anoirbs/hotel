import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
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
        { name: 'Room 101', type: 'Single', price: 100, description: 'Cozy single room', available: true, imageId },
        { name: 'Room 102', type: 'Double', price: 150, description: 'Spacious double room', available: true, imageId },
      ],
      skipDuplicates: true,
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();