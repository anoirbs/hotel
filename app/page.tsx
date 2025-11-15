// app/page.tsx - Updated homepage with story sections
"use client"

import Link from "next/link"
import SearchBooking from "@/components/search-booking"
import { useLanguage } from "@/lib/language-context"

const ArrowRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

export default function Home() {
  const { t } = useLanguage()

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
      {/* Hero Section with Video */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/e2783671-12c3-4040-8d07-355706debb75-shmFH79yZnwU70XZx0ystvGx8ojELW.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            {t("bookNow")}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <div id="search">
        <SearchBooking />
      </div>

      {/* Story Section 1 - Image Right, Text Left */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl font-bold text-foreground mb-6">{t("storyTitle1")}</h2>
              <p className="text-lg text-foreground/80 mb-6 leading-relaxed">
                {t("storyContent1")}
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                {t("storyContent2")}
              </p>
            </div>
            
            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                  alt="Feudo Nobile Estate"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section 2 - Image Left, Text Right */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div>
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80"
                  alt="Sicilian Countryside"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">{t("ourStory")}</h2>
              <div className="space-y-6">
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Every corner of Feudo Nobile tells a story of tradition, authenticity, and timeless beauty. 
                  From the ancient olive groves to the elegant reception halls, each element has been carefully 
                  preserved to offer our guests an authentic Sicilian experience.
                </p>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Whether you're celebrating a special occasion or seeking a peaceful retreat, 
                  Feudo Nobile welcomes you with the warmth and hospitality that Sicily is famous for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">{t("hotelAmenities")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="text-5xl mb-4">{amenity.icon}</div>
                <p className="font-semibold text-foreground">{amenity.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}