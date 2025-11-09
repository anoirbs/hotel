"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

// Simple SVG Icons
const ArrowLeft = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
)

const Phone = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
)

const Mail = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
)

const MapPin = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

export default function WeddingContactPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    meetingDate: "",
    guests: "",
    requests: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitted(true)
        setTimeout(() => {
          setFormData({ name: "", email: "", meetingDate: "", guests: "", requests: "" })
          setSubmitted(false)
        }, 3000)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit inquiry' }))
        const errorMessage = Array.isArray(errorData.error) 
          ? errorData.error.map((e: any) => e.message || e).join(', ')
          : errorData.error || errorData.message || 'Failed to submit inquiry. Please try again.'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('Failed to submit inquiry. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/weddings" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8">
          <ArrowLeft size={20} />
          {t("back")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">{t("weddingInquiry")}</h1>
            <p className="text-foreground/70 mb-8">{t("weddingInquiryDesc")}</p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <h3 className="text-xl font-semibold text-green-900 mb-2">{t("weddingConfirmed")}</h3>
                <p className="text-green-800">{t("weddingConfirmedDesc")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">{t("fullName")}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">{t("email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder={t("emailPlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">{t("meetingDate")}</label>
                  <input
                    type="date"
                    name="meetingDate"
                    value={formData.meetingDate}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">{t("numberOfGuests")}</label>
                  <input
                    type="number"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    required
                    min="1"
                    className="input-field"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">{t("specialRequests")}</label>
                  <textarea
                    name="requests"
                    value={formData.requests}
                    onChange={handleChange}
                    rows={4}
                    className="input-field"
                    placeholder={t("messagePlaceholder")}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  {t("submitInquiry")}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-8">{t("contactUs")}</h2>

            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1">{t("phone")}</h3>
                    <p className="text-card-foreground/70">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1">{t("email")}</h3>
                    <p className="text-card-foreground/70">weddings@hotelparadise.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1">{t("address")}</h3>
                    <p className="text-card-foreground/70">123 Luxury Street, City</p>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/20 p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">💍 {t("availableHours")}</h3>
                <p className="text-foreground/70">{t("respondWithin")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

