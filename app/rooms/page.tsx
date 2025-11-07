'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const { t } = useLanguage();

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
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            {t("ourRooms")}
          </h1>
          <p className="text-xl text-foreground/70">
            {t("discoverOurCollection")}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={`loading-${i}`} className="bg-card rounded-lg overflow-hidden border border-border animate-pulse">
                <div className="h-64 bg-secondary/20"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-secondary/20 rounded"></div>
                  <div className="h-4 bg-secondary/20 rounded w-3/4"></div>
                  <div className="h-4 bg-secondary/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room.id} className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={room.images?.[0] || "/placeholder.svg"}
                    alt={room.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-card-foreground mb-2">{room.name}</h3>
                  <p className="text-card-foreground/70 mb-4 text-sm line-clamp-2">{room.description}</p>

                  <div className="mb-4">
                    <p className="text-sm text-card-foreground/60 mb-2">{t("amenities")}:</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities && room.amenities.length > 3 && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          +{room.amenities.length - 3} {t("more")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-card-foreground/60">{t("from")}</p>
                      <p className="text-3xl font-bold text-primary">${room.price}</p>
                      <p className="text-xs text-card-foreground/60">{t("perNight")}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/rooms/${room.id}`}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 text-center"
                    >
                      {t("details") || "Details"}
                    </Link>
                    {user && (
                      <Link
                        href={`/book/${room.id}`}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 text-center"
                      >
                        {t("bookNow")}
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
            <div className="text-foreground/40 text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-semibold text-foreground/70 mb-2">No rooms available</h2>
            <p className="text-foreground/60">{t("noRoomsAvailable")}</p>
          </div>
        )}
      </div>
    </main>
  );
}