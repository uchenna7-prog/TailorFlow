import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SETTINGS_KEY = 'tailorbook_settings'

export const DEFAULTS = {
  // ── Appearance ──
  theme: 'light',                   // 'dark' | 'light' | 'system'

  // ── Measurements ──
  measureUnit: 'in',                // 'in' | 'cm' | 'yd'
  measureFormat: 'decimal',         // 'decimal' | 'fraction'

  // ── Brand / Business ──
  brandName: '',                    // e.g. "Stitched by Amara"
  brandColour: '#D4AF37',          // hex — used on coloured invoice templates
  brandLogo: null,                  // base64 data-URL string or null
  brandTagline: '',                 // e.g. "Crafted with love, fitted for you"
  brandPhone: '',
  brandAddress: '',
  brandEmail: '',
  brandWebsite: '',

  // ── Invoice ──
  invoicePrefix: 'INV',
  invoiceCurrency: '₦',
  invoiceTemplate: 'classic',       // 'classic' | 'bold' | 'branded' | 'minimal'
  invoiceTaxRate: 0,                // percentage, e.g. 7.5
  invoiceShowTax: false,
  invoiceFooter: 'Thank you for your patronage 🙏',
  invoiceDueDays: 7,               // default payment due window in days

  // ── Notifications ──
  notifyOverdueTasks: true,
  notifyUpcomingBirthdays: true,
  notifyUnpaidInvoices: true,

  // ── Orders ──
  defaultDepositPercent: 50,        // % deposit collected upfront
  autoArchiveCompletedOrders: false,

  // ── Data ──
  dateFormat: 'DD/MM/YYYY',        // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch { return { ...DEFAULTS } }
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
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.theme])

  useEffect(() => {
    try {
      // Don't serialize the logo into settings key — it can be large
      const { brandLogo, ...rest } = settings
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest))
      // Store logo separately
      if (brandLogo) {
        localStorage.setItem('tailorbook_brand_logo', brandLogo)
      } else {
        localStorage.removeItem('tailorbook_brand_logo')
      }
    } catch { /* ignore quota errors */ }
  }, [settings])

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
