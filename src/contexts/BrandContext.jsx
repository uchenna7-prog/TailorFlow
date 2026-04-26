// src/contexts/BrandContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSettings } from './SettingsContext'
import { DEFAULT_COLOUR_ID } from '../config/brandPalette'

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
  useEffect(() => {
    const refresh = () => setPersonal(loadPersonal())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const refreshPersonal = useCallback(() => setPersonal(loadPersonal()), [])

  // ── Derived brand object used by invoice templates & portfolio ──
  const brand = {
    // ── Core brand (from SettingsContext) ──
    name:       settings.brandName     || '',
    tagline:    settings.brandTagline  || '',
    colourId:   settings.brandColourId || DEFAULT_COLOUR_ID,  // ← palette ID for useBrandTokens
    colour:     settings.brandColour   || '#D4AF37',          // ← hex fallback for legacy templates
    logo:       settings.brandLogo     || null,
    phone:      settings.brandPhone    || '',
    email:      settings.brandEmail    || '',
    address:    settings.brandAddress  || '',
    website:    settings.brandWebsite  || '',

    // ── Business info ──
    foundedYear:       settings.brandFoundedYear       || '',
    turnaround:        settings.brandTurnaround        || '',
    serviceArea:       settings.brandServiceArea       || '',
    availability:      settings.brandAvailability      || 'open',
    availableUntil:    settings.brandAvailableUntil    || '',
    styleStatement:    settings.brandStyleStatement    || '',
    featuredTechnique: settings.brandFeaturedTechnique || '',
    milestone:         settings.brandMilestone         || '',
    socials:           settings.brandSocials           || [],

    // ── Invoice settings ──
    currency:   settings.invoiceCurrency || '₦',
    prefix:     settings.invoicePrefix   || 'INV',
    dueDays:    settings.invoiceDueDays  || 7,
    showTax:    settings.invoiceShowTax  || false,
    taxRate:    settings.invoiceTaxRate  || 0,
    footer:     settings.invoiceFooter   || 'Thank you for your patronage 🙏',
    template:   settings.invoiceTemplate || 'invoiceTemplate1',

    // ── Account / payment details ──
    accountBank:   settings.accountBank   || '',
    accountNumber: settings.accountNumber || '',
    accountName:   settings.accountName   || '',

    // ── Personal info fallback ──
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
