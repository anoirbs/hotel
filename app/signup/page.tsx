'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      signupSchema.parse(formData);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('token', token);
        router.push('/dashboard');
      } else {
        const { error } = await res.json();
        if (Array.isArray(error)) {
          alert(error.map((e: any) => e.message).join(', ') || 'Error creating account');
        } else {
          alert(error || 'Error creating account');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">Hotel Paradise</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">Create Your Account</h2>
          <p className="mt-2 text-gray-600">Join us for an amazing stay experience</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Why create an account?</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Book and manage your reservations</li>
            <li>• Save your preferences and special requests</li>
            <li>• Access exclusive member rates</li>
            <li>• Write reviews and rate your stay</li>
          </ul>
        </div>
      </div>
    </div>
  );
}