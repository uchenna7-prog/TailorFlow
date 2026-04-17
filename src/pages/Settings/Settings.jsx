import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SETTINGS_KEY = 'tailorbook_settings'
const LOGO_KEY     = 'tailorbook_brand_logo'

export const DEFAULTS = {
  // ── Appearance ──
  theme: 'light',                    // 'dark' | 'light' | 'system'
  dateFormat: 'DD/MM/YYYY',          // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

  // ── Measurements ──
  measureUnit: 'in',                 // 'in' | 'cm' | 'yd'
  measureFormat: 'decimal',          // 'decimal' | 'fraction'

  // ── Brand / Business ──
  brandName: '',
  brandTagline: '',
  brandColour: '#D4AF37',
  brandLogo: null,                   // base64 data-URL or null (stored separately)
  brandPhone: '',
  brandEmail: '',
  brandAddress: '',
  brandWebsite: '',

  // ── Account / Payment Details (shown on invoices) ──
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

function loadSettings() {
  try {
    const raw  = localStorage.getItem(SETTINGS_KEY)
    const data = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
    // Logo lives in its own key to avoid quota issues with large base64 strings
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

  // Persist on every change (logo stored separately)
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

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Update multiple keys at once — used by sub-modals on Save
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
