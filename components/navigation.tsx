"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import LanguageSwitcher from "./language-switcher"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const { t } = useLanguage()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      setIsLoggedIn(!!token)
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setIsAdmin(payload.isAdmin || false)
          setUserEmail(payload.email || '')
        } catch (error) {
          setIsAdmin(false)
          setUserEmail('')
        }
      } else {
        setIsAdmin(false)
        setUserEmail('')
      }
    }
    
    // Check on mount
    checkAuth()
    
    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuth()
    }
    
    // Listen for custom auth events (when user logs in/out in same tab)
    const handleAuthChange = () => {
      checkAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleAuthChange)
    
    // Check periodically to catch any changes
    const interval = setInterval(checkAuth, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleAuthChange)
      clearInterval(interval)
    }
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isProfileOpen && !target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }
    
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">Feudo Nobile</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              {t("home")}
            </Link>
            <Link href="/rooms" className="text-foreground hover:text-primary transition-colors">
              {t("rooms")}
            </Link>
            <Link
              href="/weddings"
              className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>{t("weddings")}</span>
              <span className="text-sm">👰💕🤵</span>
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition-colors">
              {t("contact")}
            </Link>
            {isLoggedIn ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold text-sm">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:inline">
                    {userEmail ? userEmail.split('@')[0] : 'User'}
                  </span>
                  <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border z-50">
                    <div className="p-4 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAdmin ? 'Administrator' : 'User'}
                      </p>
                    </div>
                    <div className="p-2">
                      {isAdmin ? (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Bookings
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          localStorage.removeItem('token')
                          window.dispatchEvent(new Event('auth-change'))
                          setIsProfileOpen(false)
                          window.location.href = '/'
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm">
                Login
              </Link>
            )}
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-foreground" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-4">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              {t("home")}
            </Link>
            <Link href="/rooms" className="text-foreground hover:text-primary transition-colors">
              {t("rooms")}
            </Link>
            <Link
              href="/weddings"
              className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>{t("weddings")}</span>
              <span className="text-sm">👰💕🤵</span>
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition-colors">
              {t("contact")}
            </Link>
            <div className="pt-2 border-t border-border">
              {isLoggedIn ? (
                <div className="space-y-2">
                  <div className="px-2 py-1 text-sm">
                    <p className="font-semibold text-foreground">{userEmail}</p>
                    <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'User'}</p>
                  </div>
                  {isAdmin ? (
                    <Link href="/admin/dashboard" className="btn-primary text-sm block text-center">
                      Dashboard
                    </Link>
                  ) : (
                    <Link href="/dashboard" className="btn-primary text-sm block text-center">
                      My Bookings
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      localStorage.removeItem('token')
                      window.dispatchEvent(new Event('auth-change'))
                      window.location.href = '/'
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm block text-center mt-2">
                  Login
                </Link>
              )}
              <div className="mt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

