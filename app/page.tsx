'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
    checkAuth();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.slice(0, 6)); // Show only first 6 rooms on home page
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode token to get user info (simplified - in production use proper JWT verification)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              <Link href="/rooms" className="text-gray-700 hover:text-blue-600 font-medium">
                Rooms
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    {getGreeting()}, {user.email.split('@')[0]}
                  </span>
                  <Link 
                    href={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
      {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
        <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="Luxury Hotel Interior"
          fill
          className="object-cover"
          priority
        />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
          
          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Welcome to Hotel Paradise
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Experience luxury, comfort, and exceptional service in the heart of the city
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/rooms"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Explore Rooms
              </Link>
              <Link 
                href="/rooms"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all"
              >
            Book Now
          </Link>
            </div>
        </div>
      </section>

      {/* Features Section */}
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Hotel Paradise?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide exceptional service and amenities to make your stay unforgettable
            </p>
          </div>
          
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative overflow-hidden rounded-xl mb-6">
            <Image
                  src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Luxury Rooms"
              width={400}
              height={300}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Luxury Accommodations</h3>
              <p className="text-gray-600 leading-relaxed">
                Spacious, elegantly designed rooms with modern amenities and breathtaking views
              </p>
          </div>
            
            <div className="text-center group">
              <div className="relative overflow-hidden rounded-xl mb-6">
            <Image
                  src="https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Fine Dining"
              width={400}
              height={300}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Fine Dining Experience</h3>
              <p className="text-gray-600 leading-relaxed">
                Award-winning restaurants serving exquisite cuisine prepared by world-class chefs
              </p>
          </div>
            
            <div className="text-center group">
              <div className="relative overflow-hidden rounded-xl mb-6">
            <Image
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Spa & Wellness"
              width={400}
              height={300}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Spa & Wellness</h3>
              <p className="text-gray-600 leading-relaxed">
                Rejuvenate your mind and body with our state-of-the-art spa and wellness facilities
              </p>
            </div>
          </div>
        </section>

        {/* Featured Rooms Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Featured Rooms</h2>
              <p className="text-xl text-gray-600">
                Discover our most popular accommodations
              </p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={`loading-${i}`} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 group">
                    <div className="relative overflow-hidden">
                      {room.images && room.images.length > 0 ? (
                        <Image
                          src={room.images[0]}
                          alt={room.name}
                          width={400}
                          height={250}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-500 text-lg">No Image Available</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                        <span className="text-blue-600 font-bold">${room.price}/night</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                        <span className="text-sm text-gray-500">{room.type}</span>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">👥 {room.capacity} guests</span>
                          <span className="text-sm text-gray-500">🛏️ {room.bedType}</span>
                        </div>
                        {room.reviewCount > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm font-medium">{room.averageRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({room.reviewCount})</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {room.amenities.slice(0, 3).map(amenity => (
                          <span key={amenity} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">+{room.amenities.length - 3} more</span>
                        )}
                      </div>
                      
                      <Link 
                        href={`/rooms/${room.id}`}
                        className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-center mt-12">
              <Link 
                href="/rooms"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                View All Rooms
              </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto text-center text-white px-4">
            <h2 className="text-4xl font-bold mb-6">Ready for Your Perfect Stay?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Book your room today and experience luxury like never before
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/rooms"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Rooms
          </Link>
              {!user && (
                <Link 
                  href="/signup"
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Create Account
          </Link>
              )}
            </div>
        </div>
      </section>
    </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-xl font-bold">Hotel Paradise</span>
              </div>
              <p className="text-gray-400">
                Your gateway to luxury and comfort in the heart of the city.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/rooms" className="text-gray-400 hover:text-white">Rooms</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Room Service</li>
                <li className="text-gray-400">Spa & Wellness</li>
                <li className="text-gray-400">Fine Dining</li>
                <li className="text-gray-400">Concierge</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">📞 +1 (555) 123-4567</li>
                <li className="text-gray-400">✉️ info@hotelparadise.com</li>
                <li className="text-gray-400">📍 123 Luxury Street, City</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Hotel Paradise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}