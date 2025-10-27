'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StripeConfig() {
  const [publishableKey, setPublishableKey] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
      setError('Invalid Stripe publishable key');
      return;
    }
    localStorage.setItem('stripe_publishable_key', publishableKey);
    router.push('/rooms');
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold">Configure Stripe</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Stripe Publishable Key (pk_test_...)"
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            className={`block w-full p-2 border ${error ? 'border-red-500' : ''}`}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">Save and Continue</button>
      </form>
    </main>
  );
}