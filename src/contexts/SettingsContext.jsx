// src/contexts/SettingsContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { saveBrandToFirestore } from '../services/brandService'

const SETTINGS_KEY = 'tailorbook_settings'
const LOGO_KEY     = 'tailorbook_brand_logo'

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
  brandColour: '#D4AF37',
  brandLogo: null,
  brandPhone: '',
  brandEmail: '',
  brandAddress: '',
  brandWebsite: '',

  // ── Account / Payment Details ──
  accountBank: '',
  accountNumber: '',
  accountName: '',

  // ── Invoice ──
  invoicePrefix: 'INV',
  invoiceCurrency: '₦',
  invoiceTemplate: 'editable',
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

// Brand-related keys — changes to these trigger a Firestore sync
const BRAND_KEYS = new Set([
  'brandName', 'brandTagline', 'brandColour', 'brandLogo',
  'brandPhone', 'brandEmail', 'brandAddress', 'brandWebsite',
])

function loadSettings() {
  try {
    const raw  = localStorage.getItem(SETTINGS_KEY)
    const data = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
    const logo = localStorage.getItem(LOGO_KEY)
    if (logo) data.brandLogo = logo
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

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      const { brandLogo, ...rest } = settings
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest))
      if (brandLogo) {
        localStorage.setItem(LOGO_KEY, brandLogo)
      } else {
        localStorage.removeItem(LOGO_KEY)
      }
    } catch { /* ignore quota errors */ }
  }, [settings])

  // Sync brand fields to Firestore whenever they change and user is logged in.
  // Debounced 1.5 s to avoid hammering Firestore on rapid typing.
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
    settings.brandColour,
    settings.brandLogo,
    settings.brandPhone,
    settings.brandEmail,
    settings.brandAddress,
    settings.brandWebsite,
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
