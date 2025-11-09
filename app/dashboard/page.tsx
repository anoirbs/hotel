'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InvoicesList from '@/components/InvoicesList';

interface Booking {
  id: string;
  room: { 
    name: string; 
    type: string; 
    price: number;
    images: string[];
  };
  userName: string;
  userEmail: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  createdAt: string;
}

interface WeddingInquiry {
  id: string;
  name: string;
  email: string;
  meetingDate: string;
  guests: string;
  requests?: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function UserDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weddingInquiries, setWeddingInquiries] = useState<WeddingInquiry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [modifyForm, setModifyForm] = useState({
    checkIn: '',
    checkOut: '',
    specialRequests: '',
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.isAdmin) {
        router.push('/admin/dashboard');
        return;
      }
      setUser({
        id: payload.id,
        email: payload.email,
        isAdmin: payload.isAdmin
      });
      fetchBookings();
      fetchWeddingInquiries();
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-change'));
      router.push('/login');
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error('Error fetching bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeddingInquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/weddings/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWeddingInquiries(data);
      } else {
        console.error('Error fetching wedding inquiries:', response.status);
      }
    } catch (error) {
      console.error('Error fetching wedding inquiries:', error);
    }
  };

  const handleModifyBooking = async () => {
    if (!selectedBooking) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modifyForm),
      });

      if (response.ok) {
        alert('Booking updated successfully');
        setShowModifyForm(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Booking cancelled successfully');
        fetchBookings();
      } else {
        const error = await response.json();
        alert(error.error || 'Error cancelling booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    }
  };

  const openModifyForm = (booking: Booking) => {
    setSelectedBooking(booking);
    setModifyForm({
      checkIn: booking.checkIn.split('T')[0],
      checkOut: booking.checkOut.split('T')[0],
      specialRequests: booking.specialRequests || '',
    });
    setShowModifyForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canModifyOrCancel = (booking: Booking) => {
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilCheckIn >= 24 && booking.status === 'confirmed';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={`loading-${i}`} className="card animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
            <p className="text-gray-600">Manage your hotel reservations and bookings</p>
          </div>
          <Link 
            href="/rooms" 
            className="btn-primary"
          >
            Book New Room
          </Link>
        </div>

        {bookings.length === 0 && weddingInquiries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-8xl mb-6">🏨</div>
            <h2 className="text-3xl font-bold text-gray-600 mb-4">No bookings yet</h2>
            <p className="text-gray-500 mb-8 text-lg">Start your journey by booking a beautiful room</p>
            <Link 
              href="/rooms" 
              className="btn-primary text-lg px-8 py-4"
            >
              Browse Available Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Room Bookings Section */}
            {bookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Room Bookings</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {bookings.map((booking) => (
              <div key={booking.id} className="card group hover:shadow-2xl transition-all duration-300">
                <div className="relative overflow-hidden">
                  {booking.room.images && booking.room.images.length > 0 ? (
                    <Image
                      src={booking.room.images[0]} 
                      alt={booking.room.name} 
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-lg">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                    <span className={`text-sm font-semibold ${getStatusColor(booking.status).split(' ')[1]}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {booking.room.name}
                    </h2>
                    <span className="text-lg font-semibold text-blue-600">${booking.totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{booking.room.type}</p>
                  
                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex justify-between">
                      <span className="font-medium">Check-in:</span>
                      <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Check-out:</span>
                      <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nights:</span>
                      <span>{Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Booked on:</span>
                      <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Special Requests:</p>
                      <p className="text-sm text-blue-700 italic">"{booking.specialRequests}"</p>
                    </div>
                  )}

                  {canModifyOrCancel(booking) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => openModifyForm(booking)}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Modify Booking
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}

                  {!canModifyOrCancel(booking) && booking.status === 'confirmed' && (
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ Cannot modify or cancel within 24 hours of check-in
                      </p>
                    </div>
                  )}

                  {booking.status === 'cancelled' && (
                    <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">
                        This booking has been cancelled
                      </p>
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        ✅ Stay completed successfully
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
                </div>
              </div>
            )}

            {/* Wedding Inquiries Section */}
            {weddingInquiries.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Wedding Inquiries</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {weddingInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="card group hover:shadow-2xl transition-all duration-300">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                            💍 Wedding Inquiry
                          </h2>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            inquiry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            inquiry.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="space-y-3 text-sm text-gray-600 mb-4">
                          <div className="flex justify-between">
                            <span className="font-medium">Name:</span>
                            <span>{inquiry.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Email:</span>
                            <span>{inquiry.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Meeting Date:</span>
                            <span>{new Date(inquiry.meetingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Number of Guests:</span>
                            <span>{inquiry.guests}</span>
                          </div>
                          {inquiry.requests && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="font-medium block mb-1">Special Requests:</span>
                              <span className="text-gray-700">{inquiry.requests}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                            <span>Submitted:</span>
                            <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modify Booking Modal */}
      {showModifyForm && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Modify Booking</h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="modify-checkin" className="block text-sm font-medium mb-2 text-gray-700">Check-in Date</label>
                <input
                  id="modify-checkin"
                  type="date"
                  value={modifyForm.checkIn}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="modify-checkout" className="block text-sm font-medium mb-2 text-gray-700">Check-out Date</label>
                <input
                  id="modify-checkout"
                  type="date"
                  value={modifyForm.checkOut}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  min={modifyForm.checkIn || new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="modify-requests" className="block text-sm font-medium mb-2 text-gray-700">Special Requests</label>
                <textarea
                  id="modify-requests"
                  value={modifyForm.specialRequests}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={3}
                  className="input-field"
                  placeholder="Any special requests or preferences..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleModifyBooking}
                className="flex-1 btn-primary"
              >
                Update Booking
              </button>
              <button
                onClick={() => setShowModifyForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Invoices Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">My Invoices</h2>
              <p className="text-gray-600">View and download your booking invoices</p>
            </div>
          </div>
          <InvoicesList 
            token={typeof window !== 'undefined' ? localStorage.getItem('token') : null} 
            isAdmin={false}
          />
        </div>
    </div>
  );
}