'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setConfirming(false);
      return;
    }

    confirmBooking();
  }, [sessionId]);

  const confirmBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to complete your booking');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      console.log('Confirming booking with session:', sessionId);

      const response = await fetch('/api/stripe/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Booking confirmation failed:', data);
        
        // Handle the case where room is no longer available
        if (response.status === 409 && data.shouldRefund) {
          setError(data.error);
          // Redirect to rooms page after showing error
          setTimeout(() => router.push('/rooms'), 5000);
          return;
        }
        
        throw new Error(data.error || 'Failed to confirm booking');
      }

      console.log('Booking confirmed successfully:', data);
      setBookingId(data.id);
      setConfirming(false);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming Your Booking...</h1>
          <p className="text-gray-600">Please wait while we process your reservation</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Session: {sessionId?.substring(0, 20)}...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <a 
              href="/dashboard" 
              className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
            <a 
              href="/rooms" 
              className="block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Browse Rooms
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Booking Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed and your booking is confirmed.
        </p>
        {bookingId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Booking ID:</strong> {bookingId}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to your dashboard in 3 seconds...
        </p>
        <a 
          href="/dashboard" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Go to Dashboard Now
        </a>
      </div>
    </main>
  );
}

export default function BookingSuccess() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h1>
            <p className="text-gray-600">Please wait</p>
          </div>
        </main>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}