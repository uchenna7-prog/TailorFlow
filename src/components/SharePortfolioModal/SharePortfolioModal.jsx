// src/components/SharePortfolioModal/SharePortfolioModal.jsx
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  savePortfolioSettings,
  subscribeToPortfolioSettings,
} from '../../services/portfolioSettingsService'
import styles from './SharePortfolioModal.module.css'

const SHARE_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
    getUrl: (link, name) =>
      `https://wa.me/?text=${encodeURIComponent(`Check out ${name}'s portfolio: ${link}`)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    ),
    color: '#34AADC',
    getUrl: (link, name) =>
      `sms:?body=${encodeURIComponent(`Check out ${name}'s portfolio: ${link}`)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    ),
    color: '#EA4335',
    getUrl: (link, name) =>
      `mailto:?subject=${encodeURIComponent(`${name}'s Portfolio`)}&body=${encodeURIComponent(`Hi,\n\nCheck out this tailor's portfolio:\n${link}`)}`,
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    getUrl: (link, name) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${name}'s tailor portfolio!`)}&url=${encodeURIComponent(link)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: '#E1306C',
    getUrl: (link) => {
      navigator.clipboard?.writeText(link)
      return null // Instagram doesn't support direct share links; we copy instead
    },
  },
]

// ── IMAGE DROPDOWN ──────────────────────────────────────────────

function ImageDropdown({ label, photos, value, onChange }) {
  const [query,  setQuery]  = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return photos
    return photos.filter(p =>
      (p.caption || '').toLowerCase().includes(q) ||
      (p.clothingTypeLabel || '').toLowerCase().includes(q)
    )
  }, [photos, query])

  const selected = photos.find(p => p.id === value) || null

  const handleSelect = (photo) => {
    onChange(photo.id)
    setIsOpen(false)
    setQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(null)
    setQuery('')
  }

  return (
    <div className={styles.imgDropWrap}>
      <p className={styles.imgDropLabel}>{label}</p>

      {/* Trigger */}
      <button
        type="button"
        className={`${styles.imgDropTrigger} ${isOpen ? styles.imgDropTriggerOpen : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        {selected ? (
          <div className={styles.imgDropSelected}>
            <img
              src={selected.src || selected.storageUrl}
              alt={selected.caption}
              className={styles.imgDropThumb}
            />
            <span className={styles.imgDropSelectedName}>{selected.caption || 'Untitled'}</span>
            <button type="button" className={styles.imgDropClear} onClick={handleClear}>
              <span className="mi" style={{ fontSize: '1rem' }}>close</span>
            </button>
          </div>
        ) : (
          <span className={styles.imgDropPlaceholder}>
            <span className="mi" style={{ fontSize: '1rem', opacity: 0.45 }}>image_search</span>
            Choose an image…
          </span>
        )}
        <span className={`mi ${styles.imgDropChevron} ${isOpen ? styles.imgDropChevronOpen : ''}`}>
          expand_more
        </span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={styles.imgDropPanel}>
          <div className={styles.imgDropSearch}>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>search</span>
            <input
              type="text"
              className={styles.imgDropSearchInput}
              placeholder="Search by name or type…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button type="button" className={styles.imgDropSearchClear} onClick={() => setQuery('')}>
                <span className="mi" style={{ fontSize: '0.9rem' }}>close</span>
              </button>
            )}
          </div>

          <div className={styles.imgDropList}>
            {filtered.length === 0 ? (
              <div className={styles.imgDropEmpty}>No images found</div>
            ) : filtered.map(photo => (
              <button
                type="button"
                key={photo.id}
                className={`${styles.imgDropOption} ${value === photo.id ? styles.imgDropOptionActive : ''}`}
                onClick={() => handleSelect(photo)}
              >
                <img
                  src={photo.src || photo.storageUrl}
                  alt={photo.caption}
                  className={styles.imgDropOptionThumb}
                />
                <div className={styles.imgDropOptionInfo}>
                  <span className={styles.imgDropOptionName}>{photo.caption || 'Untitled'}</span>
                  {photo.clothingTypeLabel && (
                    <span className={styles.imgDropOptionMeta}>{photo.clothingTypeLabel}</span>
                  )}
                </div>
                {value === photo.id && (
                  <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)', flexShrink: 0 }}>
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN MODAL ──────────────────────────────────────────────────

export default function SharePortfolioModal({ isOpen, onClose, brandName, completedWorksPhotos = [] }) {
  const { user } = useAuth()
  const [copied,          setCopied]          = useState(false)
  const [instagramCopied, setInstagramCopied] = useState(false)
  const [visible,         setVisible]         = useState(false)
  const [heroImageId,     setHeroImageId]     = useState(null)
  const [footerImageId,   setFooterImageId]   = useState(null)
  // Track whether we've loaded existing settings so we don't overwrite with null on mount
  const [settingsLoaded,  setSettingsLoaded]  = useState(false)

  const portfolioLink = user
    ? `${window.location.origin}/portfolio/${user.uid}`
    : ''

  // Animate overlay in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [isOpen])

  // Load existing saved settings when modal opens
  useEffect(() => {
    if (!isOpen || !user) return
    const unsub = subscribeToPortfolioSettings(
      user.uid,
      ({ heroImageId: h, footerImageId: f }) => {
        setHeroImageId(h)
        setFooterImageId(f)
        setSettingsLoaded(true)
      }
    )
    return () => unsub()
  }, [isOpen, user])

  // Auto-save to Firestore whenever a selection changes (after initial load)
  useEffect(() => {
    if (!settingsLoaded || !user) return
    savePortfolioSettings(user.uid, { heroImageId, footerImageId }).catch(console.error)
  }, [heroImageId, footerImageId, settingsLoaded, user])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portfolioLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = portfolioLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = (option) => {
    const url = option.getUrl(portfolioLink, brandName || 'My')
    if (option.id === 'instagram') {
      setInstagramCopied(true)
      setTimeout(() => setInstagramCopied(false), 2000)
      return
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>
              <span className="mi">link</span>
            </span>
            <div>
              <p className={styles.headerTitle}>Share Portfolio</p>
              <p className={styles.headerSub}>Send your tailor page to clients</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="mi">close</span>
          </button>
        </div>

        {/* Link row */}
        <div className={styles.linkSection}>
          <p className={styles.linkLabel}>Your portfolio link</p>
          <div className={styles.linkRow}>
            <div className={styles.linkBox}>
              <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)', flexShrink: 0 }}>language</span>
              <span className={styles.linkText}>{portfolioLink}</span>
            </div>
            <button
              className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
              onClick={handleCopy}
            >
              <span className="mi" style={{ fontSize: '1rem' }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Hero & Footer image pickers */}
        <div className={styles.imageSection}>
          <p className={styles.imageLabel}>Portfolio images</p>
          {completedWorksPhotos.length === 0 ? (
            <p className={styles.imageEmptyHint}>
              <span className="mi" style={{ fontSize: '0.9rem' }}>info</span>
              Add photos to Completed Works to choose hero and footer images.
            </p>
          ) : (
            <>
              <ImageDropdown
                label="Hero Image"
                photos={completedWorksPhotos}
                value={heroImageId}
                onChange={setHeroImageId}
              />
              <ImageDropdown
                label="Footer Image"
                photos={completedWorksPhotos}
                value={footerImageId}
                onChange={setFooterImageId}
              />
            </>
          )}
        </div>

        {/* Share via */}
        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Share via</p>
          <div className={styles.shareGrid}>
            {SHARE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={styles.shareOption}
                onClick={() => handleShare(opt)}
              >
                <div className={styles.shareIconWrap} style={{ background: opt.color + '18', color: opt.color }}>
                  {opt.icon}
                </div>
                <span className={styles.shareOptionLabel}>
                  {opt.id === 'instagram' && instagramCopied ? 'Link Copied!' : opt.label}
                </span>
              </button>
            ))}
          </div>
          {instagramCopied && (
            <p className={styles.igHint}>Link copied — paste it in your Instagram story or bio!</p>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.footerNote}>
            <span className="mi" style={{ fontSize: '0.85rem' }}>info</span>
            Clients can view your work and book orders without logging in
          </p>
        </div>
      </div>
    </div>
  )
}
