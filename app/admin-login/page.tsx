/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          alert('Access denied: Admins only');
          return;
        }
        localStorage.setItem('token', token);
        router.push('/admin/dashboard');
      } else {
        const { error } = await res.json();
        alert(error.map((e: any) => e.message).join(', ') || 'Invalid credentials');
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
      <h1 className="text-3xl font-bold">Admin Login</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`block w-full p-2 border ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`block w-full p-2 border ${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">Login</button>
      </form>
    </main>
  );
}