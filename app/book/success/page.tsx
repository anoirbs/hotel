'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { useEffect } from 'react';

export default function BookingSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      const confirmBooking = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        try {
          const res = await fetch('/api/stripe/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          });
          if (!res.ok) {
            alert('Error confirming booking');
          }
        } catch (error) {
          alert('Error confirming booking');
        }
      };
      confirmBooking();
    }
  }, [sessionId, router]);

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold">Booking Successful!</h1>
      <p className="mt-4">Your booking has been confirmed. Check your dashboard for details.</p>
      <a href="/dashboard" className="text-blue-500 mt-4 block">Go to Dashboard</a>
    </main>
  );
}