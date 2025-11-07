"use client"

import { createContext, useContext } from "react"
import type { Language } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Return a default context if not within provider
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    }
  }
  return context
}

