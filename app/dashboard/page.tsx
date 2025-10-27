'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  room: { name: string; type: string; price: number };
  userName: string;
  userEmail: string;
  checkIn: string;
  checkOut: string;
}

export default function UserDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/bookings/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setBookings)
      .catch(() => alert('Error fetching bookings'));
  }, [token, router]);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Your Bookings</h1>
      {bookings.length === 0 ? (
        <p className="mt-4">No bookings yet. <a href="/rooms" className="text-blue-500">Book a room</a>.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="border p-4 rounded">
              <h2 className="font-bold">{booking.room.name} - {booking.room.type}</h2>
              <p>Price per night: ${booking.room.price}</p>
              <p>Name: {booking.userName}</p>
              <p>Email: {booking.userEmail}</p>
              <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
              <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}