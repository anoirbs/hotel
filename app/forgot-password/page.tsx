'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      forgotPasswordSchema.parse({ email });
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSubmitted(true);
      } else {
        const { error } = await res.json();
        if (Array.isArray(error)) {
          setErrors({ email: error.map((e: any) => e.message).join(', ') });
        } else {
          setErrors({ email: error || 'An error occurred. Please try again.' });
        }
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
        setErrors({ email: 'An error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              If an account with that email exists, we have sent a password reset link to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please check your inbox and click the link to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Link 
                href="/login" 
                className="block w-full btn-primary text-center py-3"
              >
                Back to Login
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="block w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Send another email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">Feudo Nobile</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">Forgot Password</h2>
          <p className="mt-2 text-gray-600">Enter your email to receive a password reset link</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

