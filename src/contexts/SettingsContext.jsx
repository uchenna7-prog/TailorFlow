// src/contexts/SettingsContext.jsx

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { saveBrandToFirestore } from '../services/brandService'

// ─────────────────────────────────────────────────────────────
// STORAGE KEY
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tailorbook_settings'

// ─────────────────────────────────────────────────────────────
// DEFAULT SETTINGS
// ─────────────────────────────────────────────────────────────

export const DEFAULTS = {
  // Appearance
  theme:      'light',
  dateFormat: 'DD/MM/YYYY',

  // Measurements
  measureUnit:   'in',
  measureFormat: 'decimal',

  // Brand / Business
  brandName:      '',
  brandTagline:   '',
  brandColourId:  'classic-deep-gold',
  brandColour:    '#D4AF37',
  brandLogo:      null,   // Firebase Storage URL or null
  brandPhone:     '',
  brandEmail:     '',
  brandAddress:   '',
  brandWebsite:   '',

  // Portfolio / Business info
  brandFoundedYear:       '',
  brandTurnaround:        '',
  brandServiceArea:       '',
  brandAvailability:      'open',
  brandAvailableUntil:    '',
  brandStyleStatement:    '',
  brandFeaturedTechnique: '',
  brandMilestone:         '',
  brandSocials:           [],

  // Payment / Bank details
  accountBank:   '',
  accountNumber: '',
  accountName:   '',

  // Invoices
  invoicePrefix:    'INV',
  invoiceCurrency:  '₦',
  invoiceTemplate:  'invoiceTemplate1',
  receiptTemplate:  'receiptTemplate1',
  invoiceDueDays:   7,
  invoiceShowTax:   false,
  invoiceTaxRate:   0,
  invoiceFooter:    'Thank you for your patronage 🙏',

  // Orders
  defaultDepositPercent:       50,
  autoArchiveCompletedOrders:  false,

  // Notifications
  notifyOverdueTasks:       true,
  notifyUpcomingBirthdays:  true,
  notifyUnpaidInvoices:     true,
}

// ─────────────────────────────────────────────────────────────
// LOAD FROM LOCALSTORAGE
// Merges saved data with defaults so new fields always exist.
// Also runs any one-time data migrations.
// ─────────────────────────────────────────────────────────────

function loadSettings() {
  let saved = {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch {
    // Corrupted storage — start fresh
  }

  const settings = { ...DEFAULTS, ...saved }

  // Migration: base64 logos are no longer supported, only Firebase URLs
  if (settings.brandLogo?.startsWith('data:')) {
    settings.brandLogo = null
  }

  // Migration: brandColourId must be a palette ID, not a raw hex
  if (!settings.brandColourId || settings.brandColourId.startsWith('#')) {
    settings.brandColourId = DEFAULTS.brandColourId
  }

  return settings
}

// ─────────────────────────────────────────────────────────────
// THEME HELPER
// ─────────────────────────────────────────────────────────────

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved    = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  document.documentElement.setAttribute('data-theme', resolved)
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(loadSettings)

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(settings.theme)

    // If "system" mode, keep in sync when the OS switches dark/light
    if (settings.theme !== 'system') return
    const mq      = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      localStorage.removeItem('tailorbook_brand_logo') // clean up old key
    } catch {
      // Ignore storage quota errors
    }
  }, [settings])

  // Sync brand fields to Firestore, debounced by 1.5s to avoid hammering on every keystroke
  useEffect(() => {
    if (!user?.uid) return

    const timer = setTimeout(() => {
      saveBrandToFirestore(user.uid, settings).catch(console.error)
    }, 1500)

    return () => clearTimeout(timer)
  }, [user?.uid, settings])

  // Update a single setting by key
  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Update multiple settings at once
  function updateMany(partial) {
    setSettings(prev => ({ ...prev, ...partial }))
  }

  // Reset everything back to defaults
  function resetSettings() {
    setSettings({ ...DEFAULTS })
  }

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
