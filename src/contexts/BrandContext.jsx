import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSettings } from './SettingsContext'

// ─────────────────────────────────────────────────────────────
// Personal info loader (mirrors Profile.jsx)
// ─────────────────────────────────────────────────────────────

const PERSONAL_KEY = 'tailorbook_personal'

function loadPersonal() {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const BrandContext = createContext(null)

export function BrandProvider({ children }) {
  const { settings } = useSettings()
  const [personal, setPersonal] = useState(loadPersonal)

  // Re-read personal info whenever the window gains focus
  // (user may have saved it from the Profile page)
  useEffect(() => {
    const refresh = () => setPersonal(loadPersonal())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  // Manually refresh — call this after saving personal info
  const refreshPersonal = useCallback(() => setPersonal(loadPersonal()), [])

  // ── Derived brand object used by invoice templates ──
  const brand = {
    // From SettingsContext
    name:       settings.brandName     || '',
    tagline:    settings.brandTagline  || '',
    colour:     settings.brandColour   || '#D4AF37',
    logo:       settings.brandLogo     || null,
    phone:      settings.brandPhone    || '',
    email:      settings.brandEmail    || '',
    address:    settings.brandAddress  || '',
    website:    settings.brandWebsite  || '',
    // Invoice settings
    currency:   settings.invoiceCurrency || '₦',
    prefix:     settings.invoicePrefix   || 'INV',
    dueDays:    settings.invoiceDueDays  || 7,
    showTax:    settings.invoiceShowTax  || false,
    taxRate:    settings.invoiceTaxRate  || 0,
    footer:     settings.invoiceFooter   || 'Thank you for your patronage 🙏',
    template:   settings.invoiceTemplate || 'editable',
    // From personal info (fallback for solo tailors without a brand name)
    ownerName:  personal.fullName  || '',
    ownerEmail: personal.email     || '',
    ownerPhone: personal.phone     || '',
  }

  return (
    <BrandContext.Provider value={{ brand, personal, refreshPersonal }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used inside BrandProvider')
  return ctx
}
