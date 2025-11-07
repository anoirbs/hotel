"use client"

import Link from "next/link"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import LanguageSwitcher from "./language-switcher"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-lg text-gray-800 hidden sm:inline">Hotel Paradise</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("home")}
            </Link>
            <Link href="/rooms" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("rooms")}
            </Link>
            <Link
              href="/weddings"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>{t("weddings")}</span>
              <span className="text-sm">👰💕🤵</span>
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("contact")}
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700" 
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
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("home")}
            </Link>
            <Link href="/rooms" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("rooms")}
            </Link>
            <Link
              href="/weddings"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>{t("weddings")}</span>
              <span className="text-sm">👰💕🤵</span>
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("contact")}
            </Link>
            <div className="pt-2 border-t border-gray-200">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

