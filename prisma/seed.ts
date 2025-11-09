import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding database...');

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);

    // Delete existing demo users if they exist
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@example.com', 'user@example.com'],
        },
      },
    });
    console.log('✓ Cleared existing demo users');

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedAdminPassword,
        isAdmin: true,
        emailVerified: true,
        verificationToken: 'admin-verified-token',
      },
    });
    console.log('✓ Admin user created:', admin.email);

    // Create regular user
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: hashedUserPassword,
        isAdmin: false,
        emailVerified: true,
        verificationToken: 'user-verified-token',
      },
    });
    console.log('✓ Regular user created:', user.email);

    // Sample image upload - skip for now
    let imageId: string | undefined;

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