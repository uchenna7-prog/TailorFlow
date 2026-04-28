// src/contexts/SettingsContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { saveBrandToFirestore } from '../services/brandService'

const SETTINGS_KEY = 'tailorbook_settings'
// LOGO_KEY is intentionally removed — logo is now a Firebase Storage URL
// stored as a normal string in tailorbook_settings alongside other fields.
// The old tailorbook_brand_logo key in localStorage is ignored on load
// since the URL is now saved in the main settings object under brandLogo.

export const DEFAULTS = {
  // ── Appearance ──
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',

  // ── Measurements ──
  measureUnit: 'in',
  measureFormat: 'decimal',

  // ── Brand / Business ──
  brandName: '',
  brandTagline: '',
  brandColourId: 'classic-deep-gold',  // palette colour ID — used by useBrandTokens
  brandColour:   '#D4AF37',            // kept as hex fallback for legacy invoice templates
  brandLogo: null,                     // Firebase Storage download URL (or null)
  brandPhone: '',
  brandEmail: '',
  brandAddress: '',
  brandWebsite: '',

  // ── Business Info (portfolio personalisation) ──
  brandFoundedYear:      '',
  brandTurnaround:       '',
  brandServiceArea:      '',
  brandAvailability:     'open',
  brandAvailableUntil:   '',
  brandStyleStatement:   '',
  brandFeaturedTechnique:'',
  brandMilestone:        '',
  brandSocials:          [],

  // ── Account / Payment Details ──
  accountBank: '',
  accountNumber: '',
  accountName: '',

  // ── Invoice ──
  invoicePrefix: 'INV',
  invoiceCurrency: '₦',
  invoiceTemplate: 'invoiceTemplate1',
  receiptTemplate: 'receiptTemplate1',
  invoiceDueDays: 7,
  invoiceShowTax: false,
  invoiceTaxRate: 0,
  invoiceFooter: 'Thank you for your patronage 🙏',

  // ── Orders ──
  defaultDepositPercent: 50,
  autoArchiveCompletedOrders: false,

  // ── Notifications ──
  notifyOverdueTasks: true,
  notifyUpcomingBirthdays: true,
  notifyUnpaidInvoices: true,
}

function loadSettings() {
  try {
    const raw  = localStorage.getItem(SETTINGS_KEY)
    const data = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }

    // Migration: if brandLogo in settings is a base64 string (starts with "data:"),
    // strip it — base64 logos are no longer stored; only Firebase Storage URLs kept.
    if (data.brandLogo && data.brandLogo.startsWith('data:')) {
      data.brandLogo = null
    }

    // Migration: ensure brandColourId is always a valid palette ID.
    // If missing, fall back to default (covers users created before palette system).
    if (!data.brandColourId || data.brandColourId.startsWith('#')) {
      data.brandColourId = DEFAULTS.brandColourId
    }

    return data
  } catch {
    return { ...DEFAULTS }
  }
}

const SettingsContext = createContext(null)

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function SettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(loadSettings)

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme === 'system') {
      const mq      = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.theme])

  // Persist to localStorage on every change.
  // brandLogo is now a short URL so it's safe to store in the main settings key.
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      // Clean up the old separate logo key if it still exists
      localStorage.removeItem('tailorbook_brand_logo')
    } catch { /* ignore quota errors */ }
  }, [settings])

  // One-time sync on login
  useEffect(() => {
    if (!user?.uid) return
    saveBrandToFirestore(user.uid, settings).catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // Sync brand fields to Firestore whenever they change (debounced 1.5s)
  useEffect(() => {
    if (!user?.uid) return
    const timer = setTimeout(() => {
      saveBrandToFirestore(user.uid, settings).catch(console.error)
    }, 1500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.uid,
    settings.brandName,
    settings.brandTagline,
    settings.brandColourId,
    settings.brandColour,
    settings.brandLogo,
    settings.brandPhone,
    settings.brandEmail,
    settings.brandAddress,
    settings.brandWebsite,
    settings.brandFoundedYear,
    settings.brandTurnaround,
    settings.brandServiceArea,
    settings.brandAvailability,
    settings.brandAvailableUntil,
    settings.brandStyleStatement,
    settings.brandFeaturedTechnique,
    settings.brandMilestone,
    settings.brandSocials,
  ])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateMany = useCallback((partial) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULTS })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateMany, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
