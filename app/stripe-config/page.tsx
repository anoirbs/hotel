'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function StripeConfig() {
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    // Load existing keys from localStorage
    setPublishableKey(localStorage.getItem('stripe_publishable_key') || '');
    setSecretKey(localStorage.getItem('stripe_secret_key') || '');
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        alert('Access denied: Admin privileges required');
        router.push('/');
        return;
      }
      setUser({
        id: payload.id,
        email: payload.email,
        isAdmin: payload.isAdmin
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token');
      router.push('/admin-login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate keys
    if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
      setError('Invalid Stripe publishable key format');
      setLoading(false);
      return;
    }

    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      setError('Invalid Stripe secret key format');
      setLoading(false);
      return;
    }

    try {
      // Save keys to localStorage (in production, these should be stored securely on the server)
      localStorage.setItem('stripe_publishable_key', publishableKey);
      localStorage.setItem('stripe_secret_key', secretKey);
      
      // Test the keys by making a simple API call
      const response = await fetch('/api/stripe/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          publishableKey,
          secretKey,
        }),
      });

      if (response.ok) {
        alert('Stripe configuration saved successfully!');
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to validate Stripe keys');
      }
    } catch (error) {
      console.error('Error saving Stripe config:', error);
      setError('An error occurred while saving the configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-gray-800">Admin Portal</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.email}</span>
              <Link 
                href="/admin/dashboard"
                className="btn-primary"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Stripe Configuration</h1>
          <p className="text-gray-600">Configure your Stripe payment settings for processing bookings</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">Security Notice</span>
            </div>
            <p className="text-sm text-gray-600">
              These keys are stored locally for demo purposes. In production, store them securely on your server.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="publishableKey" className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Publishable Key
              </label>
              <input
                id="publishableKey"
                type="text"
                placeholder="pk_test_..."
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Your publishable key starts with pk_test_ (test) or pk_live_ (live)
              </p>
            </div>

            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Secret Key
              </label>
              <input
                id="secretKey"
                type="password"
                placeholder="sk_test_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Your secret key starts with sk_test_ (test) or sk_live_ (live)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
              <Link 
                href="/admin/dashboard"
                className="flex-1 btn-secondary text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Getting Your Stripe Keys</h3>
            <ol className="text-sm text-blue-700 space-y-2">
              <li>1. Sign up for a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a></li>
              <li>2. Go to your Stripe Dashboard</li>
              <li>3. Navigate to Developers → API Keys</li>
              <li>4. Copy your Publishable key and Secret key</li>
              <li>5. Use test keys (pk_test_ and sk_test_) for development</li>
              <li>6. Use live keys (pk_live_ and sk_live_) for production</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}