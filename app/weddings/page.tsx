"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

// Simple SVG Icons
const ArrowRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const Heart = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

export default function WeddingsPage() {
  const { t } = useLanguage()

  const weddingPhotos = [
    {
      id: 1,
      title: "Elegant Ceremony",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    },
    {
      id: 2,
      title: "Reception Hall",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    },
    {
      id: 3,
      title: "Bride & Groom",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    },
    {
      id: 4,
      title: "Dinner Setup",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    },
    {
      id: 5,
      title: "Dance Floor",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    },
    {
      id: 6,
      title: "Cake Moment",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    },
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Heart className="absolute top-10 left-10 w-32 h-32 text-primary" />
          <Heart className="absolute bottom-10 right-10 w-24 h-24 text-accent" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl font-bold text-foreground mb-6">{t("weddingServices")}</h1>
          <p className="text-2xl text-foreground/80 mb-8">{t("perfectVenueForYourSpecialDay")}</p>
          <Link
            href="/weddings/contact"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            {t("planYourWedding")}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Wedding Gallery */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4 text-foreground">{t("weddingGallery")}</h2>
          <p className="text-center text-foreground/70 mb-16">{t("viewWeddingGallery")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {weddingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <img
                  src={photo.image || "/placeholder.svg"}
                  alt={photo.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                  <p className="text-white text-lg font-semibold">{photo.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <Heart size={64} className="text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-bold mb-6">{t("planYourWedding")}</h2>
          <p className="text-lg mb-8 opacity-90">{t("weddingInquiryDesc")}</p>
          <Link
            href="/weddings/contact"
            className="inline-block bg-primary-foreground text-primary px-8 py-4 rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors"
          >
            {t("submitInquiry")}
          </Link>
        </div>
      </section>
    </main>
  )
}

