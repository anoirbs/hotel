'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { z } from 'zod';

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  available: boolean;
  imageId?: string;
}

interface Booking {
  id: string;
  room: { name: string; type: string };
  userName: string;
  userEmail: string;
  checkIn: string;
  checkOut: string;
}

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.string().min(1, 'Room type is required'),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required'),
});

const stripeConfigSchema = z.object({
  publishableKey: z.string().startsWith('pk_', 'Invalid publishable key'),
  secretKey: z.string().startsWith('sk_', 'Invalid secret key'),
});

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newRoom, setNewRoom] = useState({ name: '', type: '', price: '', description: '', image: null as File | null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Room & { image: File | null }>>({});
  const [stripeConfig, setStripeConfig] = useState({ publishableKey: '', secretKey: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/admin-login');
      return;
    }
    // Fetch rooms
    fetch('/api/rooms')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch rooms');
        return res.json();
      })
      .then(setRooms)
      .catch((err) => setErrors({ fetch: err.message }));
    // Fetch bookings
    fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
      })
      .then(setBookings)
      .catch((err) => setErrors({ fetch: err.message }));
    // Load Stripe keys
    const pk = localStorage.getItem('stripe_publishable_key') || '';
    const sk = localStorage.getItem('stripe_secret_key') || '';
    setStripeConfig({ publishableKey: pk, secretKey: sk });
  }, [token, router]);

  const handleAdd = async () => {
    try {
      const data = roomSchema.parse({ ...newRoom, price: parseFloat(newRoom.price) });
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, value.toString()));
      if (newRoom.image) formData.append('image', newRoom.image);

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const room = await res.json();
        setRooms([...rooms, room]);
        setNewRoom({ name: '', type: '', price: '', description: '', image: null });
        setErrors({});
      } else {
        const { error } = await res.json();
        alert(error.map((e: any) => e.message).join(', ') || 'Error adding room');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    const res = await fetch(`/api/rooms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setRooms(rooms.filter((r) => r.id !== id));
    } else {
      alert('Error deleting room');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const data = roomSchema.parse(editForm);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, value.toString()));
      if (editForm.image) formData.append('image', editForm.image);

      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        setRooms(rooms.map((r) => (r.id === id ? updated : r)));
        setEditingId(null);
        setEditForm({});
        setErrors({});
      } else {
        const { error } = await res.json();
        alert(error.map((e: any) => e.message).join(', ') || 'Error updating room');
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

  const handleStripeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      stripeConfigSchema.parse(stripeConfig);
      localStorage.setItem('stripe_publishable_key', stripeConfig.publishableKey);
      localStorage.setItem('stripe_secret_key', stripeConfig.secretKey);
      alert('Stripe keys saved');
      setErrors({});
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

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setEditForm({ ...room, image: null });
  };

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {errors.fetch && <p className="text-red-500 mb-4">{errors.fetch}</p>}

      {/* Stripe Configuration */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Configure Stripe Keys</h2>
        <form onSubmit={handleStripeConfig} className="space-y-4 max-w-md">
          <div>
            <input
              type="text"
              placeholder="Stripe Publishable Key (pk_...)"
              value={stripeConfig.publishableKey}
              onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
              className={`block w-full p-2 border ${errors.publishableKey ? 'border-red-500' : ''}`}
            />
            {errors.publishableKey && <p className="text-red-500 text-sm">{errors.publishableKey}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Stripe Secret Key (sk_...)"
              value={stripeConfig.secretKey}
              onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
              className={`block w-full p-2 border ${errors.secretKey ? 'border-red-500' : ''}`}
            />
            {errors.secretKey && <p className="text-red-500 text-sm">{errors.secretKey}</p>}
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 w-full">Save Stripe Keys</button>
        </form>
      </section>

      {/* Add New Room */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Add New Room</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <input
              type="text"
              placeholder="Name"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              className={`block w-full p-2 border ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Type"
              value={newRoom.type}
              onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
              className={`block w-full p-2 border ${errors.type ? 'border-red-500' : ''}`}
            />
            {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
          </div>
          <div>
            <input
              type="number"
              placeholder="Price"
              value={newRoom.price}
              onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
              className={`block w-full p-2 border ${errors.price ? 'border-red-500' : ''}`}
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>
          <div>
            <textarea
              placeholder="Description"
              value={newRoom.description}
              onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              className={`block w-full p-2 border ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewRoom({ ...newRoom, image: e.target.files?.[0] || null })}
              className="block w-full p-2 border"
            />
          </div>
          <button onClick={handleAdd} className="bg-green-500 text-white p-2 w-full">Add Room</button>
        </div>
      </section>

      {/* Rooms List */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Manage Rooms</h2>
        {rooms.length === 0 ? (
          <p>No rooms available.</p>
        ) : (
          <ul className="space-y-4">
            {rooms.map((room) => (
              <li key={room.id} className="border p-4 rounded">
                {editingId === room.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`block w-full p-2 border ${errors.name ? 'border-red-500' : ''}`}
                    />
                    <input
                      type="text"
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className={`block w-full p-2 border ${errors.type ? 'border-red-500' : ''}`}
                    />
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className={`block w-full p-2 border ${errors.price ? 'border-red-500' : ''}`}
                    />
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className={`block w-full p-2 border ${errors.description ? 'border-red-500' : ''}`}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.files?.[0] || null })}
                      className="block w-full p-2 border"
                    />
                    <div className="flex space-x-2">
                      <button onClick={() => handleUpdate(room.id)} className="bg-blue-500 text-white px-4 py-2">Save</button>
                      <button onClick={() => { setEditingId(null); setEditForm({}); setErrors({}); }} className="bg-gray-500 text-white px-4 py-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {room.imageId ? (
                      <img src={`/api/rooms/image/${room.imageId}`} alt={room.name} className="w-32 h-32 object-cover mb-2" onError={() => console.error(`Failed to load image for ${room.name}`)} />
                    ) : (
                      <p className="text-gray-500 mb-2">No image</p>
                    )}
                    <h3 className="font-bold">{room.name} - {room.type} (${room.price})</h3>
                    <p>{room.description}</p>
                    <p className={room.available ? 'text-green-500' : 'text-red-500'}>{room.available ? 'Available' : 'Booked'}</p>
                    <div className="flex space-x-2 mt-2">
                      <button onClick={() => startEdit(room)} className="bg-yellow-500 text-white px-4 py-2">Edit</button>
                      <button onClick={() => handleDelete(room.id)} className="bg-red-500 text-white px-4 py-2">Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bookings List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Bookings</h2>
        {bookings.length === 0 ? (
          <p>No bookings available.</p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking.id} className="border p-4 rounded">
                <h3 className="font-bold">{booking.room.name} - {booking.room.type}</h3>
                <p>Name: {booking.userName}</p>
                <p>Email: {booking.userEmail}</p>
                <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}