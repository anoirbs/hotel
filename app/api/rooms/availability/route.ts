import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const availabilitySchema = z.object({
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid check-in date' }),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid check-out date' }),
  roomType: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  amenities: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = availabilitySchema.parse(await req.json());
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);

    // Build filter conditions
    const whereConditions: any = {};

    if (data.roomType) {
      whereConditions.type = data.roomType;
    }

    if (data.minPrice || data.maxPrice) {
      whereConditions.price = {};
      if (data.minPrice) whereConditions.price.gte = data.minPrice;
      if (data.maxPrice) whereConditions.price.lte = data.maxPrice;
    }

    if (data.amenities && data.amenities.length > 0) {
      whereConditions.amenities = {
        hasSome: data.amenities,
      };
    }

    // Find rooms that don't have conflicting bookings
    const rooms = await prisma.room.findMany({
      where: {
        ...whereConditions,
        bookings: {
          none: {
            OR: [
              {
                checkIn: { lte: checkOut },
                checkOut: { gte: checkIn },
                status: { not: 'cancelled' },
              },
            ],
          },
        },
      },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate average ratings
    const roomsWithRatings = rooms.map(room => ({
      ...room,
      averageRating: room.reviews.length > 0 
        ? room.reviews.reduce((sum, review) => sum + review.rating, 0) / room.reviews.length 
        : 0,
      reviewCount: room.reviews.length,
    }));

    return NextResponse.json(roomsWithRatings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

