'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  available: boolean;
  imageId?: string;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    fetch('/api/rooms')
      .then((res) => res.json())
      .then(setRooms);
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Available Rooms</h1>
      {!isAuthenticated && (
        <p className="mt-4">
          Please <Link href="/login" className="text-blue-500">log in</Link> or{' '}
          <Link href="/signup" className="text-blue-500">sign up</Link> to book a room.
        </p>
      )}
      <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <li key={room.id} className="border p-4 rounded">
            {room.imageId && <img src={`/api/rooms/image/${room.imageId}`} alt={room.name} className="w-full h-48 object-cover mb-2" />}
            <h2 className="font-bold">{room.name} - {room.type} (${room.price})</h2>
            <p>{room.description}</p>
            {room.available ? (
              isAuthenticated ? (
                <Link href={`/book/${room.id}`} className="text-blue-500">Book Now</Link>
              ) : (
                <p className="text-gray-500">Log in to book</p>
              )
            ) : (
              <p className="text-red-500">Booked</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}