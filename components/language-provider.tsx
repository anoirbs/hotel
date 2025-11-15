"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Language } from "@/lib/i18n"
import { getTranslation } from "@/lib/i18n"
import { LanguageContext } from "@/lib/language-context"
import type { translations } from "@/lib/i18n"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get language from localStorage or browser preference
    const savedLanguage = localStorage.getItem("language") as Language | null
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "it")) {
      setLanguage(savedLanguage)
    } else {
      const browserLang = navigator.language.startsWith("it") ? "it" : "en"
      setLanguage(browserLang)
    }
    setMounted(true)
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return getTranslation(language, key as keyof typeof translations.en)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}







