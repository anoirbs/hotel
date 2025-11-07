'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoomImageCarousel from '@/components/RoomImageCarousel';
import { useLanguage } from '@/lib/language-context';
import { ArrowRight } from 'lucide-react';

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
  const { t } = useLanguage();

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

  const amenities = [
    { icon: "🏊", label: t("outdoorPool") },
    { icon: "🅿️", label: t("freeParking") },
    { icon: "📶", label: t("freeWiFi") },
    { icon: "🚐", label: t("airportShuttle") },
    { icon: "🚭", label: t("nonSmokingRooms") },
    { icon: "🍽️", label: t("restaurant") },
    { icon: "🛎️", label: t("roomService") },
    { icon: "☕", label: t("teaKettleInRooms") },
    { icon: "🍸", label: t("bar") },
    { icon: "🥐", label: t("breakfast") },
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section with Video/Image */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
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

        <div className="relative z-10 text-center">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            {t("bookNow")}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">{t("hotelAmenities")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="text-5xl mb-4">{amenity.icon}</div>
                <p className="font-semibold text-gray-800">{amenity.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}