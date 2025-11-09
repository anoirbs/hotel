"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-gray-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold">Hotel Paradise</span>
            </div>
            <p className="text-sm text-gray-400">
              Experience luxury and elegance at our premium hotel.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/rooms" className="text-gray-400 hover:text-white transition-colors">
                  {t("rooms")}
                </Link>
              </li>
              <li>
                <Link href="/weddings" className="text-gray-400 hover:text-white transition-colors">
                  {t("weddings")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t("contactUs")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📞 +1 (555) 123-4567</li>
              <li>✉️ info@hotelparadise.com</li>
              <li>📍 123 Luxury Street, City</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Check-in: 3:00 PM</li>
              <li>Check-out: 11:00 AM</li>
              <li>24/7 Front Desk</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Hotel Paradise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}



