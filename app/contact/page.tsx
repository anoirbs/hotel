// Save as: app/contact/page.tsx
'use client'

import { ContactForm } from '@/components/contact-form'
import { ContactInfo } from '@/components/contact-info'
import { useLanguage } from '@/lib/language-context'

// Simple Map Icon
const MapIcon = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

export default function ContactPage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t('getInTouch')}
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl">
            {t('contactPageSubtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Contact Info Cards */}
          <ContactInfo 
            title={t('phone')}
            icon="phone"
            details={[
              '+1 (555) 123-4567',
              '+1 (555) 123-4568'
            ]}
          />
          <ContactInfo 
            title={t('email')}
            icon="mail"
            details={[
              'info@feudonobile.com',
              'reservations@feudonobile.com'
            ]}
          />
          <ContactInfo 
            title={t('address')}
            icon="mapPin"
            details={[
              '123 Luxury Lane',
              'Paradise City, PC 12345'
            ]}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-foreground">{t('sendUsMessage')}</h2>
            <ContactForm />
          </div>

          {/* Hotel Info & Hours */}
          <div>
            <div className="bg-card rounded-lg p-8 mb-8 border border-border">
              <h2 className="text-3xl font-bold mb-6 text-card-foreground">{t('businessHours')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b border-border">
                  <span className="font-medium text-card-foreground">{t('mondayFriday')}</span>
                  <span className="text-card-foreground/70">24/7</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-border">
                  <span className="font-medium text-card-foreground">{t('saturday')}</span>
                  <span className="text-card-foreground/70">24/7</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-border">
                  <span className="font-medium text-card-foreground">{t('sunday')}</span>
                  <span className="text-card-foreground/70">24/7</span>
                </div>
                <div className="flex justify-between pt-4">
                  <span className="font-medium text-card-foreground">{t('frontDesk')}</span>
                  <span className="text-card-foreground/70">{t('alwaysAvailable')}</span>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-secondary/20 rounded-lg h-80 flex items-center justify-center border border-border">
              <div className="text-center">
                <MapIcon size={64} />
                <p className="text-foreground/70 mt-4">{t('mapComingSoon')}</p>
                <p className="text-sm text-foreground/60 mt-2">123 Luxury Lane, Paradise City</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}