// src/components/BrandColourPicker/BrandColourPicker.jsx
// ─────────────────────────────────────────────────────────────
// Replaces the raw <input type="color"> in BrandModal.
// Style tabs across top → colour swatches below.
// Selected colour gets a checkmark. No live preview — user picks
// and saves, then sees it on their portfolio.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { STYLE_GROUPS, getColoursByStyle, getColourById, DEFAULT_COLOUR_ID } from '../../config/brandPalette'
import styles from './BrandColourPicker.module.css'

export default function BrandColourPicker({ value, onChange }) {
  // value = colourId string e.g. "classic-deep-gold"
  const selected     = getColourById(value) || getColourById(DEFAULT_COLOUR_ID)
  const [activeStyle, setActiveStyle] = useState(selected?.style || 'Classic')
  const swatches     = getColoursByStyle(activeStyle)

  return (
    <div className={styles.picker}>

      {/* ── Style tabs ── */}
      <div className={styles.tabs}>
        {STYLE_GROUPS.map(style => (
          <button
            key={style}
            type="button"
            className={`${styles.tab} ${activeStyle === style ? styles.tabActive : ''}`}
            onClick={() => setActiveStyle(style)}
          >
            {style}
          </button>
        ))}
      </div>

      {/* ── Colour swatches ── */}
      <div className={styles.swatches}>
        {swatches.map(colour => {
          const isSelected = value === colour.id
          return (
            <button
              key={colour.id}
              type="button"
              className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ''}`}
              onClick={() => onChange(colour.id)}
              aria-label={colour.label}
              title={colour.label}
            >
              {/* Colour circle */}
              <span
                className={styles.swatchCircle}
                style={{ background: colour.tokens.primary }}
              >
                {isSelected && (
                  <span className={styles.swatchCheck}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={colour.tokens.onPrimary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </span>
              {/* Label */}
              <span className={`${styles.swatchLabel} ${isSelected ? styles.swatchLabelSelected : ''}`}>
                {colour.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Selected colour summary ── */}
      {selected && (
        <div className={styles.selectedBar}>
          <span
            className={styles.selectedDot}
            style={{ background: selected.tokens.primary }}
          />
          <span className={styles.selectedName}>
            {selected.style} · {selected.label}
          </span>
          <span className={styles.selectedHex}>
            {selected.tokens.primary}
          </span>
        </div>
      )}
    </div>
  )
}
