// src/hooks/useBrandTokens.js
// ─────────────────────────────────────────────────────────────
// Looks up a colour ID from the palette, then injects its full
// token set as CSS custom properties onto a target element.
//
// Usage:
//   useBrandTokens(colourId)               → injects onto document.documentElement
//   useBrandTokens(colourId, elementRef)   → injects onto a specific element
//
// Both Portfolio.jsx and Invoice.jsx call this once at the top.
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { getColourById, DEFAULT_COLOUR_ID } from '../config/brandPalette'

/**
 * Maps our internal token keys to CSS variable names used across
 * Portfolio.module.css and Invoice templates.
 */
const TOKEN_TO_CSS_VAR = {
  primary:      '--brand-primary',
  primaryLight: '--brand-primary-light',
  primaryDark:  '--brand-primary-dark',
  onPrimary:    '--brand-on-primary',
  gradient:     '--brand-gradient',
  gradientCard: '--brand-gradient-card',
  surface:      '--brand-surface',
  surfaceDark:  '--brand-surface-dark',
  muted:        '--brand-muted',
  glow:         '--brand-glow',
}

export function useBrandTokens(colourId, ref = null) {
  useEffect(() => {
    const entry = getColourById(colourId) || getColourById(DEFAULT_COLOUR_ID)
    if (!entry) return

    const el = ref?.current ?? document.documentElement

    Object.entries(TOKEN_TO_CSS_VAR).forEach(([key, cssVar]) => {
      el.style.setProperty(cssVar, entry.tokens[key])
    })

    // Clean up when component unmounts or colourId changes
    return () => {
      // Only clean up if injecting on a specific element, not :root
      // (Portfolio / Invoice clean themselves; root persists for app-wide use)
      if (ref?.current) {
        Object.values(TOKEN_TO_CSS_VAR).forEach(cssVar => {
          ref.current.style.removeProperty(cssVar)
        })
      }
    }
  }, [colourId, ref])
}

/**
 * Imperative version — returns the token object directly.
 * Useful for server-side rendering or PDF generation in invoices.
 *
 * @param {string} colourId
 * @returns {{ [cssVar: string]: string }}
 */
export function getBrandTokens(colourId) {
  const entry = getColourById(colourId) || getColourById(DEFAULT_COLOUR_ID)
  if (!entry) return {}
  return Object.fromEntries(
    Object.entries(TOKEN_TO_CSS_VAR).map(([key, cssVar]) => [cssVar, entry.tokens[key]])
  )
}
