// src/pages/Portfolio/Portfolio.jsx
// Public-facing tailor landing page — no auth required
// Route: /portfolio/:uid

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, query, orderBy, onSnapshot, doc
} from 'firebase/firestore'
import { db } from '../../firebase'
import { getBrandFromFirestore } from '../../services/brandService'
import styles from './Portfolio.module.css'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function BookingSheet({ isOpen, onClose, brandName, brandEmail, brandPhone }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return
    const msg = `Hi ${brandName}, I'd like to book an order.%0AName: ${name}%0APhone: ${phone}%0AMessage: ${message}`
    if (brandPhone) {
      const clean = brandPhone.replace(/\D/g, '')
      window.open(`https://wa.me/${clean}?text=${msg}`, '_blank', 'noopener,noreferrer')
    } else if (brandEmail) {
      window.open(`mailto:${brandEmail}?subject=Order Booking&body=${decodeURIComponent(msg.replace(/%0A/g, '\n'))}`)
    }
    setSent(true)
    setTimeout(() => { setSent(false); onClose(); setName(''); setPhone(''); setMessage('') }, 2200)
  }

  return (
    <div
      className={`${styles.sheetOverlay} ${visible ? styles.sheetOverlayVisible : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${styles.bookingSheet} ${visible ? styles.bookingSheetVisible : ''}`}>
        <div className={styles.sheetHandle} />
        {sent ? (
          <div className={styles.sentState}>
            <div className={styles.sentIcon}>✓</div>
            <p className={styles.sentTitle}>Request Sent!</p>
            <p className={styles.sentSub}>We'll be in touch shortly</p>
          </div>
        ) : (
          <>
            <div className={styles.sheetHead}>
              <p className={styles.sheetTitle}>Book an Order</p>
              <button className={styles.sheetClose} onClick={onClose}>✕</button>
            </div>
            <div className={styles.sheetBody}>
              <label className={styles.fieldLabel}>Your Name *</label>
              <input className={styles.fieldInput} placeholder="e.g. Amaka Johnson" value={name} onChange={e => setName(e.target.value)} />
              <label className={styles.fieldLabel}>Phone Number *</label>
              <input className={styles.fieldInput} placeholder="e.g. 0812 345 6789" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
              <label className={styles.fieldLabel}>What do you need?</label>
              <textarea className={styles.fieldTextarea} placeholder="Describe what you want sewn, your style preferences, occasion…" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            </div>
            <div className={styles.sheetFooter}>
              <button className={styles.bookBtn} onClick={handleSubmit} disabled={!name.trim() || !phone.trim()}>
                Send Booking Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Lightbox({ photo, photos, onClose }) {
  const [idx, setIdx] = useState(() => photos.findIndex(p => p.id === photo.id))
  const current = photos[idx] || photo

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [photos, onClose])

  return (
    <div className={styles.lbOverlay} onClick={onClose}>
      <div className={styles.lbInner} onClick={e => e.stopPropagation()}>
        <button className={styles.lbClose} onClick={onClose}>✕</button>
        <img src={current.src || current.storageUrl} alt={current.caption} className={styles.lbImg} />
        {photos.length > 1 && (
          <>
            {idx > 0 && <button className={`${styles.lbNav} ${styles.lbNavLeft}`} onClick={() => setIdx(i => i - 1)}>‹</button>}
            {idx < photos.length - 1 && <button className={`${styles.lbNav} ${styles.lbNavRight}`} onClick={() => setIdx(i => i + 1)}>›</button>}
          </>
        )}
        {current.caption && <p className={styles.lbCaption}>{current.caption}</p>}
      </div>
    </div>
  )
}

export default function Portfolio() {
  const { uid } = useParams()
  const [brand, setBrand] = useState(null)
  const [photos, setPhotos] = useState([])
  const [dressTypes, setDressTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)

  useEffect(() => {
    if (!uid) { setNotFound(true); setLoading(false); return }
    getBrandFromFirestore(uid)
      .then(data => {
        // Only show "not found" if the Firestore doc truly doesn't exist.
        // If the doc exists but some fields are empty, still show the portfolio.
        if (!data) {
          setNotFound(true)
        } else {
          setBrand(data)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [uid])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'galleryPhotos'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
  }, [uid])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      doc(db, 'users', uid, 'galleryDressTypes', 'completed_works'),
      snap => {
        const types = snap.exists() ? (snap.data().types ?? []) : []
        setDressTypes(types)
        setActiveTab(prev => prev || types[0]?.id || null)
      },
      () => {}
    )
  }, [uid])

  useEffect(() => {
    const handler = () => setHeaderScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <p className={styles.nfEmoji}>🧵</p>
        <h2 className={styles.nfTitle}>Portfolio not found</h2>
        <p className={styles.nfSub}>This tailor hasn't set up their portfolio yet.</p>
      </div>
    )
  }

  const accentColor = brand.brandColour || '#D4AF37'
  const brandName = brand.brandName || 'Tailor'
  const completedPhotos = photos.filter(p => p.category === 'completed_works')
  const filteredPhotos = activeTab
    ? completedPhotos.filter(p => p.clothingType === activeTab)
    : completedPhotos

  return (
    <div className={styles.page} style={{ '--brand-accent': accentColor }}>
      <nav className={`${styles.nav} ${headerScrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          {brand.brandLogo
            ? <img src={brand.brandLogo} alt={brandName} className={styles.navLogo} />
            : <span className={styles.navName}>{brandName}</span>
          }
          <button className={styles.navBookBtn} onClick={() => setBookingOpen(true)}>Book Now</button>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroBg} style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}05 100%)` }} />
        <div className={styles.heroContent}>
          {brand.brandLogo
            ? <img src={brand.brandLogo} alt={brandName} className={styles.heroLogo} />
            : <div className={styles.heroAvatar} style={{ background: accentColor + '22', color: accentColor }}>{initials(brandName)}</div>
          }
          <h1 className={styles.heroName}>{brandName}</h1>
          {brand.brandTagline && <p className={styles.heroTagline}>{brand.brandTagline}</p>}
          <div className={styles.heroMeta}>
            {brand.brandAddress && (
              <span className={styles.metaChip}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {brand.brandAddress}
              </span>
            )}
            {brand.brandPhone && (
              <a href={`tel:${brand.brandPhone}`} className={styles.metaChip}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                {brand.brandPhone}
              </a>
            )}
            {brand.brandEmail && (
              <a href={`mailto:${brand.brandEmail}`} className={styles.metaChip}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                {brand.brandEmail}
              </a>
            )}
          </div>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} style={{ background: accentColor }} onClick={() => setBookingOpen(true)}>
              Book an Order
            </button>
            {brand.brandPhone && (
              <a href={`https://wa.me/${brand.brandPhone.replace(/\D/g,'')}`} className={styles.ctaSecondary} target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {completedPhotos.length > 0 && (
        <section className={styles.statsStrip}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{completedPhotos.length}+</span>
            <span className={styles.statLabel}>Completed Works</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{dressTypes.length}</span>
            <span className={styles.statLabel}>Specialties</span>
          </div>
          {brand.brandAddress && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>📍</span>
                <span className={styles.statLabel}>{brand.brandAddress.split(',')[0]}</span>
              </div>
            </>
          )}
        </section>
      )}

      {completedPhotos.length > 0 && (
        <section className={styles.worksSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Completed Works</h2>
            <p className={styles.sectionSub}>Browse {brandName}'s craftsmanship</p>
          </div>
          {dressTypes.length > 0 && (
            <div className={styles.filterBar}>
              <div className={styles.filterScroll}>
                <button
                  className={`${styles.filterPill} ${!activeTab ? styles.filterPillActive : ''}`}
                  style={!activeTab ? { background: accentColor, borderColor: accentColor } : {}}
                  onClick={() => setActiveTab(null)}
                >All</button>
                {dressTypes.map(t => (
                  <button
                    key={t.id}
                    className={`${styles.filterPill} ${activeTab === t.id ? styles.filterPillActive : ''}`}
                    style={activeTab === t.id ? { background: accentColor, borderColor: accentColor } : {}}
                    onClick={() => setActiveTab(t.id)}
                  >{t.label}</button>
                ))}
              </div>
            </div>
          )}
          {filteredPhotos.length === 0 ? (
            <div className={styles.emptyWorks}><p>No photos in this category yet.</p></div>
          ) : (
            <div className={styles.photoGrid}>
              {filteredPhotos.map((photo, i) => (
                <div key={photo.id} className={styles.photoCard} style={{ animationDelay: `${i * 0.04}s` }} onClick={() => setLightbox(photo)}>
                  <img src={photo.src || photo.storageUrl} alt={photo.caption || 'Completed work'} className={styles.photoImg} loading="lazy" />
                  {photo.caption && (
                    <div className={styles.photoOverlay}>
                      <span className={styles.photoCaption}>{photo.caption}</span>
                      {photo.clothingTypeLabel && <span className={styles.photoType}>{photo.clothingTypeLabel}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaGlow} style={{ background: accentColor + '33' }} />
          <h2 className={styles.ctaTitle}>Ready to place an order?</h2>
          <p className={styles.ctaSub}>Get in touch with {brandName} today and let's create something beautiful for you.</p>
          <button className={styles.ctaBigBtn} style={{ background: accentColor }} onClick={() => setBookingOpen(true)}>
            Book Your Order Now
          </button>
          <div className={styles.ctaContacts}>
            {brand.brandPhone && <a href={`tel:${brand.brandPhone}`} className={styles.ctaContact}>📞 {brand.brandPhone}</a>}
            {brand.brandEmail && <a href={`mailto:${brand.brandEmail}`} className={styles.ctaContact}>✉️ {brand.brandEmail}</a>}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerBrand}>{brandName}</p>
        {brand.brandTagline && <p className={styles.footerTagline}>{brand.brandTagline}</p>}
        <p className={styles.footerPowered}>Powered by TailorBook</p>
      </footer>

      {lightbox && <Lightbox photo={lightbox} photos={filteredPhotos} onClose={() => setLightbox(null)} />}
      <BookingSheet isOpen={bookingOpen} onClose={() => setBookingOpen(false)} brandName={brandName} brandEmail={brand.brandEmail} brandPhone={brand.brandPhone} />
    </div>
  )
}
