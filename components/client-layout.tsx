"use client"

import type React from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { LanguageProvider } from "@/components/language-provider"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Navigation />
      {children}
      <Footer />
    </LanguageProvider>
  )
}



