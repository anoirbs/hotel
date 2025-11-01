'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoomImageCarousel from '@/components/RoomImageCarousel';

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  capacity: number;
  amenities: string[];
  bedType: string;
  size?: string;
  images: string[];
  averageRating: number;
  reviewCount: number;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchRooms();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.id,
          email: payload.email,
          isAdmin: payload.isAdmin
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        console.log("-------------------------rooms:",data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-xl font-bold text-gray-800">Hotel Paradise</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    {getGreeting()}, {user.email.split('@')[0]}
                  </span>
                  <Link 
                    href={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                    className="btn-primary"
                  >
                    {user.isAdmin ? 'Admin Dashboard' : 'My Bookings'}
                  </Link>
                  {user.isAdmin && (
                    <Link 
                      href="/stripe-config"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Stripe Config
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup"
                    className="btn-primary"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Rooms</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our carefully curated selection of luxurious accommodations designed for your comfort and relaxation
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={`loading-${i}`} className="card animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room.id} className="card group hover:shadow-2xl transition-all duration-300">
                <div className="relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  <RoomImageCarousel 
                    images={room.images || []} 
                    roomName={room.name}
                    width={400}
                    height={250}
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                    <span className="text-blue-600 font-bold">${room.price}/night</span>
                  </div>
                  {room.reviewCount > 0 && (
                    <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-full shadow-md flex items-center space-x-1">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-sm font-medium">{room.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {room.name}
                    </h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {room.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>
                  
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>👥 {room.capacity} guests</span>
                      <span>🛏️ {room.bedType}</span>
                    </div>
                    {room.size && (
                      <span>📐 {room.size}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {room.amenities.slice(0, 3).map(amenity => (
                      <span key={amenity} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs text-gray-500">+{room.amenities.length - 3} more</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/rooms/${room.id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      View Details
                    </Link>
                    {user && (
                      <Link 
                        href={`/book/${room.id}`}
                        className="flex-1 bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        Book Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No rooms available</h2>
            <p className="text-gray-500">Please check back later for available accommodations.</p>
          </div>
        )}

        {!user && (
          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready to Book?</h3>
              <p className="text-blue-700 mb-4">
                Create an account or log in to book your perfect room and manage your reservations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/signup"
                  className="btn-primary"
                >
                  Create Account
                </Link>
                <Link 
                  href="/login"
                  className="btn-secondary"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}