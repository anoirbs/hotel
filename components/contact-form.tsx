// Save as: components/contact-form.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useLanguage } from '@/lib/language-context'

export function ContactForm() {
  const { t } = useLanguage()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          e.currentTarget.reset()
        }, 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || t('errorSendingMessage'))
      }
    } catch (err) {
      setError(t('errorSendingMessage'))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-green-600">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{t('thankYou')}</h3>
        <p className="text-foreground/70">{t('messageReceived')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            {t('fullName')}
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder={t('fullNamePlaceholder')}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={t('emailPlaceholder')}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
          {t('subject')}
        </label>
        <input
          id="subject"
          name="subject"
          required
          placeholder={t('subjectPlaceholder')}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
          {t('message')}
        </label>
        <textarea
          id="message"
          name="message"
          required
          placeholder={t('messagePlaceholder')}
          rows={5}
          className="input-field resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('sending') : t('sendMessage')}
      </button>
    </form>
  )
}