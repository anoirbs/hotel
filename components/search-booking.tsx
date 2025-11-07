"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"

// Simple SVG Icons
const Search = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

const Calendar = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
)

const Users = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const MapPin = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

const AlertCircle = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)

interface Room {
  id: string
  name: string
  type: string
  price: number
  description: string
  capacity: number
  amenities: string[]
  images: string[]
}

export default function SearchBooking() {
  const { t } = useLanguage()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("2")
  const [searchResults, setSearchResults] = useState<Room[]>([])
  const [showResults, setShowResults] = useState(false)
  const [capacityError, setCapacityError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCapacityError(null)

    if (!checkIn || !checkOut) {
      alert(t("checkInDate") + " " + t("checkOutDate") + " required")
      return
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkOutDate <= checkInDate) {
      alert(t("checkOutDate") + " must be after " + t("checkInDate"))
      return
    }

    const guestCount = parseInt(guests)
    
    try {
      // Check availability
      const availabilityResponse = await fetch('/api/rooms/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          checkOut,
        }),
      })

      if (availabilityResponse.ok) {
        const availableRooms = await availabilityResponse.json()
        // Filter by capacity
        const filteredRooms = availableRooms.filter((room: Room) => room.capacity >= guestCount)
        setSearchResults(filteredRooms)
        setShowResults(true)
      } else {
        // Fallback: fetch all rooms and filter
        const response = await fetch('/api/rooms')
        if (response.ok) {
          const allRooms = await response.json()
          const filteredRooms = allRooms.filter((room: Room) => room.capacity >= guestCount)
          setSearchResults(filteredRooms)
          setShowResults(true)
        }
      }
    } catch (error) {
      console.error('Error searching rooms:', error)
      // Fallback: fetch all rooms
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const allRooms = await response.json()
        const filteredRooms = allRooms.filter((room: Room) => room.capacity >= guestCount)
        setSearchResults(filteredRooms)
        setShowResults(true)
      }
    }
  }

  return (
    <>
      {/* Search Section */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t("findYourPerfectRoom")}</h2>
            <p className="text-foreground/70">{t("searchAndBookDirectly")}</p>
          </div>

          <form onSubmit={handleSearch} className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  <Calendar className="inline mr-2" size={16} />
                  {t("checkIn")}
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  <Calendar className="inline mr-2" size={16} />
                  {t("checkOut")}
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  <Users className="inline mr-2" size={16} />
                  {t("guests")}
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1">1 {t("guest")}</option>
                  <option value="2">2 {t("guests")}</option>
                  <option value="3">3 {t("guests")}</option>
                  <option value="4">4 {t("guests")}</option>
                  <option value="5">5 {t("guests")}</option>
                  <option value="6">6 {t("guests")}</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  {t("search")}
                </button>
              </div>
            </div>
          </form>

          {/* Search Results */}
          {showResults && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                {t("availableRooms")} ({searchResults.length})
              </h3>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((room) => (
                    <div
                      key={room.id}
                      className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow"
                    >
                      {/* Room Image */}
                      <div className="relative h-48 bg-secondary/20 overflow-hidden">
                        <img
                          src={room.images?.[0] || "/placeholder.svg"}
                          alt={room.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Room Info */}
                      <div className="p-4">
                        <h4 className="text-lg font-bold text-card-foreground mb-2">{room.name}</h4>
                        <p className="text-sm text-card-foreground/70 mb-3 line-clamp-2">{room.description}</p>

                        {/* Amenities */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {room.amenities?.slice(0, 3).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-secondary/30 text-card-foreground px-2 py-1 rounded"
                              >
                                {amenity}
                              </span>
                            ))}
                            {room.amenities && room.amenities.length > 3 && (
                              <span className="text-xs text-card-foreground/60">
                                +{room.amenities.length - 3} {t("more")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price and Capacity */}
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-sm text-card-foreground/70">{t("pricePerNight")}</p>
                            <p className="text-2xl font-bold text-primary">${room.price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-card-foreground/70">{t("capacity")}</p>
                            <p className="text-lg font-semibold text-card-foreground flex items-center gap-1">
                              <Users size={16} />
                              {room.capacity}
                            </p>
                          </div>
                        </div>

                        {/* Capacity Error */}
                        {capacityError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{capacityError}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link
                            href={`/rooms/${room.id}`}
                            className="flex-1 px-3 py-2 rounded-lg font-semibold transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 text-center text-sm"
                          >
                            {t("details") || "Details"}
                          </Link>
                          <Link
                            href={`/book/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}`}
                            className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm text-center"
                          >
                            {t("bookNow")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg p-8 text-center border border-border">
                  <MapPin className="w-12 h-12 text-card-foreground/40 mx-auto mb-4" />
                  <p className="text-card-foreground/70">{t("noRoomsAvailable")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

