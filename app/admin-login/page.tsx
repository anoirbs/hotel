'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      loginSchema.parse({ email, password });
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (res.ok) {
        const { token, isAdmin } = await res.json();
        if (!isAdmin) {
          alert('Access denied: Admin privileges required');
          return;
        }
        localStorage.setItem('token', token);
        router.push('/admin/dashboard');
      } else {
        const { error } = await res.json();
        if (Array.isArray(error)) {
          alert(error.map((e: any) => e.message).join(', ') || 'Invalid credentials');
        } else {
          alert(error || 'Invalid credentials');
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
        alert('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">Admin Portal</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">Admin Access</h2>
          <p className="mt-2 text-gray-600">Sign in with admin credentials</p>
        </div>

        {/* Admin Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-500">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">Restricted Access</span>
            </div>
            <p className="text-sm text-gray-600">
              This area is restricted to authorized administrators only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
              Regular User Login
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Admin Demo Credentials:</h3>
          <div className="text-sm text-red-700">
            <p><strong>Email:</strong> admin@example.com</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}