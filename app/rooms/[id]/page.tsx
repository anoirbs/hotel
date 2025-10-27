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

interface Review {
  id: string;
  rating: number;
  comment?: string;
  user: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function RoomDetails({ params }: { readonly params: { id: string } }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    userName: '',
    userEmail: '',
    specialRequests: '',
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchRoomDetails();
    fetchReviews();
  }, [params.id]);

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
        setBookingForm(prev => ({
          ...prev,
          userEmail: payload.email,
          userName: payload.email.split('@')[0]
        }));
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}`);
      if (response.ok) {
        const roomData = await response.json();
        setRoom(roomData);
      } else {
        router.push('/rooms');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      router.push('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?roomId=${params.id}`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to submit a review');
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: params.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });

      if (response.ok) {
        alert('Review submitted successfully');
        setShowReviewForm(false);
        setReviewForm({ rating: 5, comment: '' });
        fetchReviews();
        fetchRoomDetails();
      } else {
        const error = await response.json();
        alert(error.error || 'Error submitting review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to book a room');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: params.id,
          userName: bookingForm.userName,
          userEmail: bookingForm.userEmail,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          specialRequests: bookingForm.specialRequests,
        }),
      });

      if (response.ok) {
        const booking = await response.json();
        alert('Booking created successfully! Redirecting to payment...');
        router.push(`/book/${booking.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking');
    }
  };

  const calculateTotalPrice = () => {
    if (!room || !bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return room.price * nights;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Room not found</h1>
          <Link
            href="/rooms"
            className="btn-primary"
          >
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

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
              <Link href="/rooms" className="text-gray-700 hover:text-blue-600 font-medium">
                All Rooms
              </Link>
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{user.email.split('@')[0]}</span>
                  <Link 
                    href={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                    className="btn-primary"
                  >
                    {user.isAdmin ? 'Admin' : 'My Bookings'}
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      router.push('/');
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/rooms" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Rooms
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Room Images */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl">
              {room.images && room.images.length > 0 ? (
                <Image 
                  src={room.images[0]} 
                  alt={room.name} 
                  width={600}
                  height={400}
                  className="w-full h-96 object-cover" 
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500 text-lg">No Image Available</span>
                </div>
              )}
            </div>
            
            {room.images && room.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {room.images.slice(1, 5).map((image) => (
                  <div key={`${room.id}-image-${image}`} className="relative overflow-hidden rounded-lg">
                    <Image
                      src={image} 
                      alt={`${room.name} additional view`} 
                      width={150}
                      height={100}
                      className="w-full h-20 object-cover cursor-pointer hover:opacity-75 transition-opacity" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{room.name}</h1>
              <p className="text-xl text-gray-600 mb-4">{room.type}</p>
              
              {room.reviewCount > 0 && (
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={`star-${i}`} className={i < Math.round(room.averageRating) ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{room.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600 ml-2">({room.reviewCount} reviews)</span>
                </div>
              )}
              
              <div className="text-4xl font-bold text-blue-600 mb-4">${room.price}/night</div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Room Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">👥</span>
                    <span className="font-medium">{room.capacity} guests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">🛏️</span>
                    <span className="font-medium">{room.bedType}</span>
                  </div>
                  {room.size && (
                    <div className="col-span-2 flex items-center space-x-2">
                      <span className="text-gray-500">📐</span>
                      <span className="font-medium">{room.size} sq ft</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map(amenity => (
                    <span key={amenity} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Description</h3>
                <p className="text-gray-700 leading-relaxed">{room.description}</p>
              </div>
            </div>

            <div className="card p-6">
              {user ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full btn-primary text-lg py-4"
                >
                  Book This Room
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Please log in to book this room</p>
                  <Link 
                    href="/login"
                    className="btn-primary"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Reviews ({room.reviewCount})</h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary"
              >
                Write Review
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No reviews yet</h3>
              <p className="text-gray-500">Be the first to review this room!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {review.user.firstName && review.user.lastName 
                          ? `${review.user.firstName} ${review.user.lastName}`
                          : 'Anonymous User'
                        }
                      </h4>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={`review-star-${i}`} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Book This Room</h3>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkin-date" className="block text-sm font-medium mb-2 text-gray-700">Check-in Date</label>
                  <input
                    id="checkin-date"
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="checkout-date" className="block text-sm font-medium mb-2 text-gray-700">Check-out Date</label>
                  <input
                    id="checkout-date"
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                  <input
                    id="user-name"
                    type="text"
                    value={bookingForm.userName}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, userName: e.target.value }))}
                    className="input-field"
                    required
                  />
              </div>
              
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    value={bookingForm.userEmail}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, userEmail: e.target.value }))}
                    className="input-field"
                    required
                  />
              </div>
              
              <div>
                <label htmlFor="special-requests" className="block text-sm font-medium mb-2 text-gray-700">Special Requests (Optional)</label>
                  <textarea
                    id="special-requests"
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="Any special requests or preferences..."
                  />
              </div>

              {bookingForm.checkIn && bookingForm.checkOut && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Total Price:</span>
                    <span className="text-2xl font-bold text-blue-600">${calculateTotalPrice()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights × ${room.price}/night
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Proceed to Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Write a Review</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label htmlFor="review-rating" className="block text-sm font-medium mb-2 text-gray-700">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl transition-colors ${
                        star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium mb-2 text-gray-700">Comment (Optional)</label>
                  <textarea
                    id="review-comment"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="input-field"
                    placeholder="Share your experience..."
                  />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}