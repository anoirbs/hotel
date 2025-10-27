'use client';

import { useEffect, useState } from 'react';

import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const bookingSchema = z.object({
  userName: z.string().min(1, 'Name is required'),
  userEmail: z.string().email('Invalid email address'),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid check-in date' }),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid check-out date' }),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

export default function BookRoom({ params }: { params: { id: string } }) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const stripeKey = typeof window !== 'undefined' ? localStorage.getItem('stripe_publishable_key') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (!stripeKey) {
      router.push('/stripe-config');
    }
  }, [token, stripeKey, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = bookingSchema.parse({ userName, userEmail, checkIn, checkOut });
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: params.id, checkIn, checkOut }),
      });
      if (res.ok) {
        const { sessionId } = await res.json();
        const stripe = await loadStripe(stripeKey!);
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
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
      }
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold">Book Room {params.id}</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className={`block w-full p-2 border ${errors.userName ? 'border-red-500' : ''}`}
          />
          {errors.userName && <p className="text-red-500 text-sm">{errors.userName}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className={`block w-full p-2 border ${errors.userEmail ? 'border-red-500' : ''}`}
          />
          {errors.userEmail && <p className="text-red-500 text-sm">{errors.userEmail}</p>}
        </div>
        <div>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={`block w-full p-2 border ${errors.checkIn ? 'border-red-500' : ''}`}
          />
          {errors.checkIn && <p className="text-red-500 text-sm">{errors.checkIn}</p>}
        </div>
        <div>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={`block w-full p-2 border ${errors.checkOut ? 'border-red-500' : ''}`}
          />
          {errors.checkOut && <p className="text-red-500 text-sm">{errors.checkOut}</p>}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">Proceed to Payment</button>
      </form>
    </main>
  );
}