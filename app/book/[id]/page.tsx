'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';

const bookingSchema = z.object({
  userName: z.string().min(1, 'Name is required'),
  userEmail: z.string().email('Invalid email address'),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid check-in date' }),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid check-out date' }),
  specialRequests: z.string().optional(),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  capacity: number;
  amenities: string[];
  bedType: string;
  size?: string;
  images: string[];
}

export default function BookRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams() as { id: string };
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      fetchRoom();
    }
  }, [token, router]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}`);
      if (response.ok) {
        const roomData = await response.json();
        setRoom(roomData);
      } else {
        alert('Room not found');
        router.push('/rooms');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      alert('Error loading room details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!room || !checkIn || !checkOut) return 0;
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return room.price * nights;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const data = bookingSchema.parse({ 
        userName, 
        userEmail, 
        checkIn, 
        checkOut, 
        specialRequests 
      });

      // Check room availability first
      const availabilityResponse = await fetch('/api/rooms/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          checkOut,
          roomId: params.id,
        }),
      });

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.json();
        throw new Error(errorData.error || 'Room not available for selected dates');
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          roomId: params.id, 
          checkIn, 
          checkOut,
          specialRequests: specialRequests || undefined,
        }),
      });

      if (res.ok) {
        const { url } = await res.json();
        
        if (!url) {
          alert('Failed to create checkout session. Please try again.');
          return;
        }

        // Redirect directly to the Stripe checkout URL
        window.location.href = url;
      } else {
        const { error } = await res.json();
        alert(error || 'Error initiating payment');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap = error.flatten().fieldErrors;
        setErrors(
          Object.keys(errorMap).reduce((acc, key) => {
            acc[key] = errorMap[key]?.[0] || '';
            return acc;
          }, {} as { [key: string]: string })
        );
      } else {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Room not found</h1>
          <button
            onClick={() => router.push('/rooms')}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Back to Rooms
          </button>
        </div>
      </main>
    );
  }

  const totalPrice = calculateTotalPrice();
  const nights = checkIn && checkOut ? 
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Book {room.name}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {room.images && room.images.length > 0 ? (
              <img src={room.images[0]} alt={room.name} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Image Available</span>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{room.name}</h2>
                <span className="text-2xl font-semibold text-blue-600">${room.price}/night</span>
              </div>
              
              <p className="text-gray-600 mb-2">{room.type} • {room.capacity} guests • {room.bedType} bed</p>
              {room.size && <p className="text-gray-500 mb-3">{room.size} sq ft</p>}
              
              <p className="text-gray-700 mb-4">{room.description}</p>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Amenities:</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map(amenity => (
                    <span key={amenity} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Booking Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`w-full p-3 border rounded-lg ${errors.userName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.userName && <p className="text-red-500 text-sm mt-1">{errors.userName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className={`w-full p-3 border rounded-lg ${errors.userEmail ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.userEmail && <p className="text-red-500 text-sm mt-1">{errors.userEmail}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in Date *</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full p-3 border rounded-lg ${errors.checkIn ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.checkIn && <p className="text-red-500 text-sm mt-1">{errors.checkIn}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Check-out Date *</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className={`w-full p-3 border rounded-lg ${errors.checkOut ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.checkOut && <p className="text-red-500 text-sm mt-1">{errors.checkOut}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Special Requests</label>
              <textarea
                placeholder="Any special requests or notes..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Price Summary */}
            {nights > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Price Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>${room.price} × {nights} nights</span>
                    <span>${(room.price * nights).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}