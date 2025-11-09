'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Deprecated checkout success route visited with params:', { sessionId, roomId, checkIn, checkOut });
    // This page belonged to the old Stripe Checkout flow. We no longer confirm here.
    // Show a simple success screen with navigation options.
    setConfirming(false);
  }, [sessionId, roomId, checkIn, checkOut]);

  if (confirming) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming Your Booking...</h1>
          <p className="text-gray-600">Please wait while we process your reservation</p>
          {/* Debug info */}
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
          <a 
            href="/dashboard" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
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
          Your booking has been confirmed. Check your dashboard for details.
        </p>
        <a 
          href="/dashboard" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Go to Dashboard
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