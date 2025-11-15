'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

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

export default function RoomDetails() {
  const [room, setRoom] = useState<Room | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
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
  const params = useParams() as { id: string };
  const { t } = useLanguage();

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
        // Ensure images array exists and has valid values
        if (!roomData.images || !Array.isArray(roomData.images)) {
          roomData.images = [];
        }
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

    setIsProcessingBooking(true);

    try {
      // Check room availability first
      const availabilityResponse = await fetch('/api/rooms/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          roomId: params.id,
        }),
      });

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.json();
        alert(errorData.error || 'Room not available for selected dates');
        setIsProcessingBooking(false);
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: params.id,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          specialRequests: bookingForm.specialRequests || undefined,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        
        if (!url) {
          alert('Failed to create checkout session. Please try again.');
          setIsProcessingBooking(false);
          return;
        }

        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        const { error } = await response.json();
        alert(error || 'Error initiating payment');
        setIsProcessingBooking(false);
      }
    } catch (error) {
      console.error('Error processing booking:', error);
      alert('Error processing booking. Please try again.');
      setIsProcessingBooking(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!room || !bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const nights = Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24));
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
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{t("roomNotFound")}</h1>
          <Link
            href="/rooms"
            className="text-primary hover:underline"
          >
            {t("backToRooms")}
          </Link>
        </div>
      </main>
    );
  }

  // Simple SVG Icon
  const ChevronLeft = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
        >
          <ChevronLeft size={20} />
          {t("backToRooms")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden mb-4 bg-secondary/20">
              <img
                src={room.images?.[selectedImage] || room.images?.[0] || "/placeholder.svg"}
                alt={room.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800';
                }}
              />
            </div>

            {/* Thumbnail Gallery */}
            {room.images && room.images.length > 1 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {room.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${room.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-border p-6 sticky top-24">
              <h3 className="text-lg font-bold text-foreground mb-4">{t("quickInfo")}</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm text-foreground/60">{t("roomType")}</p>
                  <p className="font-semibold text-foreground">{room.name}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{t("capacity")}</p>
                  <p className="font-semibold text-foreground">
                    {room.capacity} {room.capacity === 1 ? t("guest") : t("guests")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{t("pricePerNight")}</p>
                  <p className="font-semibold text-foreground text-lg">${room.price}</p>
                </div>
              </div>
              {user ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  {t("bookNow")}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-foreground/70 mb-4 text-sm">Please log in to book this room</p>
                  <Link 
                    href="/login"
                    className="w-full block bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Room Description and Amenities */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("description")}</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">{room.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("amenities")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.amenities && room.amenities.length > 0 ? (
                  room.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-card-foreground">{amenity}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-foreground/60 text-sm">No amenities listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 bg-card rounded-lg border border-border p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-card-foreground">Reviews ({room.reviewCount || 0})</h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Write Review
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-foreground/40 text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-foreground/70 mb-2">No reviews yet</h3>
              <p className="text-foreground/60">Be the first to review this room!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow bg-background">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {review.user.firstName && review.user.lastName 
                          ? `${review.user.firstName} ${review.user.lastName}`
                          : 'Anonymous User'
                        }
                      </h4>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={`review-star-${i}`} className={i < review.rating ? 'text-yellow-400' : 'text-foreground/30'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-foreground/60">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-foreground/80">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
            <h3 className="text-2xl font-bold mb-6 text-card-foreground">{t("reservationDetails")}</h3>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkin-date" className="block text-sm font-medium mb-2 text-card-foreground">{t("checkInDate")}</label>
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
                  <label htmlFor="checkout-date" className="block text-sm font-medium mb-2 text-card-foreground">{t("checkOutDate")}</label>
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
                <label htmlFor="user-name" className="block text-sm font-medium mb-2 text-card-foreground">{t("fullName")}</label>
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
                <label htmlFor="user-email" className="block text-sm font-medium mb-2 text-card-foreground">{t("email")}</label>
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
                <label htmlFor="special-requests" className="block text-sm font-medium mb-2 text-card-foreground">{t("specialRequests")} (Optional)</label>
                  <textarea
                    id="special-requests"
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder={t("messagePlaceholder")}
                  />
              </div>

              {bookingForm.checkIn && bookingForm.checkOut && room && (
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-card-foreground">{t("totalPrice")}:</span>
                    <span className="text-2xl font-bold text-primary">${calculateTotalPrice()}</span>
                  </div>
                  <p className="text-sm text-card-foreground/70 mt-1">
                    {Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights × ${room.price}/{t("perNight")}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isProcessingBooking}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingBooking ? t("processing") || "Processing..." : t("proceedToPayment")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  disabled={isProcessingBooking}
                  className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-8 w-full max-w-md border border-border">
            <h3 className="text-2xl font-bold mb-6 text-card-foreground">Write a Review</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label htmlFor="review-rating" className="block text-sm font-medium mb-2 text-card-foreground">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl transition-colors ${
                        star <= reviewForm.rating ? 'text-yellow-400' : 'text-foreground/30'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium mb-2 text-card-foreground">Comment (Optional)</label>
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
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}