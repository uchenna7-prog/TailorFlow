import { useEffect } from 'react'
import { getPaletteById, DEFAULT_COLOUR_ID } from '../config/brandPalette'


const TOKEN_TO_CSS_VARIABLES = {
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

    const entry = getPaletteById(colourId) || getPaletteById(DEFAULT_COLOUR_ID)

    if (!entry) return

    const element = ref?.current ?? document.documentElement

    Object.entries(TOKEN_TO_CSS_VARIABLES).forEach(([key, cssVariable]) => {
      element.style.setProperty(cssVariable, entry.tokens[key])
    })

    return () => {

      if (ref?.current) {
        Object.values(TOKEN_TO_CSS_VARIABLES).forEach(cssVariable => {
          ref.current.style.removeProperty(cssVariable)
        })
      }
    }
  }, [colourId, ref])
}


export function getBrandTokens(colourId) {

  const entry = getColourById(colourId) || getColourById(DEFAULT_COLOUR_ID)

  if (!entry) return {}

  return Object.fromEntries(
    Object.entries(TOKEN_TO_CSS_VARIABLES).map(([key, cssVariable]) => [cssVariable, entry.tokens[key]])
  )
}
