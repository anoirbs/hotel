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
  capacity: number;
  amenities: string[];
  bedType: string;
  size?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  room: { name: string; type: string };
  userName: string;
  userEmail: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  createdAt: string;
}

interface Analytics {
  period: string;
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    cancellationRate: number;
  };
  revenue: {
    total: number;
    average: number;
  };
  rooms: {
    total: number;
    available: number;
    occupancyRate: number;
  };
  customers: {
    total: number;
    repeatCustomers: number;
    repeatRate: number;
  };
  topRooms: Array<{
    id: string;
    name: string;
    type: string;
    bookings: number;
    revenue: number;
  }>;
}

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.string().min(1, 'Room type is required'),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  amenities: z.array(z.string()),
  bedType: z.string().min(1, 'Bed type is required'),
  size: z.string().optional(),
});

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: '',
    price: '',
    description: '',
    capacity: '2',
    amenities: [] as string[],
    bedType: 'Queen',
    size: '',
    images: [] as string[],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Room>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showRoomForm, setShowRoomForm] = useState(false);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const availableAmenities = ['WiFi', 'AC', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Parking', 'Room Service'];
  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];
  const bedTypes = ['Single', 'Queen', 'King', 'Twin'];

  useEffect(() => {
    if (!token) {
      router.push('/admin-login');
      return;
    }
    fetchData();
  }, [token, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes, analyticsRes] = await Promise.all([
        fetch('/api/rooms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = roomSchema.parse({
        ...newRoom,
        price: parseFloat(newRoom.price),
        capacity: parseInt(newRoom.capacity),
      });

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Room created successfully');
        setNewRoom({
          name: '',
          type: '',
          price: '',
          description: '',
          capacity: '2',
          amenities: [],
          bedType: 'Queen',
          size: '',
          images: [],
        });
        setShowRoomForm(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating room');
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

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const data = roomSchema.parse(editForm);
      const response = await fetch(`/api/rooms/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Room updated successfully');
        setEditingId(null);
        setEditForm({});
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating room');
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

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Room deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Error deleting room');
    }
  };

  const toggleAmenity = (amenity: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        amenities: prev.amenities?.includes(amenity)
          ? prev.amenities.filter(a => a !== amenity)
          : [...(prev.amenities || []), amenity]
      }));
    } else {
      setNewRoom(prev => ({
        ...prev,
        amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Site
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'rooms', label: 'Room Management' },
            { id: 'bookings', label: 'Bookings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.bookings.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">${analytics.revenue.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.rooms.occupancyRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Customers</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.customers.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Rooms */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Performing Rooms</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topRooms.map((room) => (
                    <tr key={room.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.bookings}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${room.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Room Management</h2>
            <button
              onClick={() => setShowRoomForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add New Room
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white border rounded-lg shadow-md overflow-hidden">
                {room.images && room.images.length > 0 ? (
                  <img src={room.images[0]} alt={room.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{room.name}</h3>
                    <span className="text-lg font-semibold text-blue-600">${room.price}/night</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{room.type} • {room.capacity} guests • {room.bedType}</p>
                  {room.size && <p className="text-gray-500 text-sm mb-2">{room.size} sq ft</p>}
                  
                  <p className="text-gray-700 text-sm mb-3">{room.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.slice(0, 3).map(amenity => (
                      <span key={amenity} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-gray-500 text-xs">+{room.amenities.length - 3} more</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(room.id);
                        setEditForm(room);
                      }}
                      className="flex-1 bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="flex-1 bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Recent Bookings</h2>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <li key={booking.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{booking.room.name}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p>{booking.userName} • {booking.userEmail}</p>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p>
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                        <span className="mx-2">•</span>
                        <p className="font-medium text-gray-900">${booking.totalPrice.toFixed(2)}</p>
                      </div>
                      {booking.specialRequests && (
                        <p className="mt-1 text-sm text-gray-600 italic">"{booking.specialRequests}"</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showRoomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Room</h3>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Name *</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Room Type *</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Type</option>
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price per Night *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRoom.price}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bed Type *</label>
                  <select
                    value={newRoom.bedType}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, bedType: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {bedTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.bedType && <p className="text-red-500 text-sm">{errors.bedType}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Room Size (sq ft)</label>
                <input
                  type="text"
                  value={newRoom.size}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 300 sq ft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border rounded"
                  required
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {availableAmenities.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        newRoom.amenities.includes(amenity)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
                {errors.amenities && <p className="text-red-500 text-sm">{errors.amenities}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowRoomForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Room</h3>
            
            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Room Type *</label>
                  <select
                    value={editForm.type || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Type</option>
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price per Night *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.capacity || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bed Type *</label>
                  <select
                    value={editForm.bedType || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bedType: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {bedTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.bedType && <p className="text-red-500 text-sm">{errors.bedType}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Room Size (sq ft)</label>
                <input
                  type="text"
                  value={editForm.size || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 300 sq ft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border rounded"
                  required
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {availableAmenities.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity, true)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        editForm.amenities?.includes(amenity)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
                {errors.amenities && <p className="text-red-500 text-sm">{errors.amenities}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Update Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditForm({});
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}