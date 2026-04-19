// src/pages/Portfolio/Portfolio.jsx
// Public-facing tailor landing page — no auth required
// Route: /portfolio/:handle   (handle = slug OR legacy uid)

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, doc, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { getBrandFromFirestore } from '../../services/brandService'
import { getPortfolioSettings } from '../../services/portfolioSettingsService'
import { resolveSlug } from '../../services/slugService'
import styles from './Portfolio.module.css'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Booking Sheet ─────────────────────────────────────────────
function BookingSheet({ isOpen, onClose, brandName, brandEmail, brandPhone }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [garment, setGarment] = useState('')
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
    const msg = `Hello ${brandName},%0A%0AI'd like to place an order.%0A%0AName: ${name}%0APhone: ${phone}%0AGarment: ${garment}%0ADetails: ${message}`
    if (brandPhone) {
      const clean = brandPhone.replace(/\D/g, '')
      window.open(`https://wa.me/${clean}?text=${msg}`, '_blank', 'noopener,noreferrer')
    } else if (brandEmail) {
      window.open(`mailto:${brandEmail}?subject=Order Enquiry&body=${decodeURIComponent(msg.replace(/%0A/g, '\n').replace(/%0A%0A/g, '\n\n'))}`)
    }
    setSent(true)
    setTimeout(() => { setSent(false); onClose(); setName(''); setPhone(''); setGarment(''); setMessage('') }, 2500)
  }

  return (
    <div className={`${styles.bookingOverlay} ${visible ? styles.bookingOverlayVisible : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`${styles.bookingDrawer} ${visible ? styles.bookingDrawerVisible : ''}`}>
        <div className={styles.drawerHandle} />
        {sent ? (
          <div className={styles.sentState}>
            <div className={styles.sentCheck}><span className="mi">check</span></div>
            <p className={styles.sentTitle}>Request Received</p>
            <p className={styles.sentSub}>{brandName} will be in touch shortly.</p>
          </div>
        ) : (
          <>
            <div className={styles.drawerHead}>
              <div>
                <p className={styles.drawerLabel}>PLACE AN ORDER</p>
                <p className={styles.drawerTitle}>Book {brandName}</p>
              </div>
              <button className={styles.drawerClose} onClick={onClose}>
                <span className="mi">close</span>
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Name *</label>
                <input className={styles.fieldInput} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Phone Number *</label>
                <input className={styles.fieldInput} placeholder="e.g. 0812 345 6789" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Garment Type</label>
                <input className={styles.fieldInput} placeholder="e.g. Suit, Dress, Agbada, Co-ord…" value={garment} onChange={e => setGarment(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Additional Details</label>
                <textarea className={styles.fieldTextarea} placeholder="Occasion, fabric preferences, measurements, deadline…" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
              </div>
            </div>
            <div className={styles.drawerFooter}>
              <button className={styles.sendBtn} onClick={handleSubmit} disabled={!name.trim() || !phone.trim()}>
                Send Booking Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ photo, photos, onClose }) {
  const [idx, setIdx] = useState(() => photos.findIndex(p => p.id === photo.id))
  const current = photos[idx] || photo

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [photos, onClose])

  return (
    <div className={styles.lbOverlay} onClick={onClose}>
      <div className={styles.lbInner} onClick={e => e.stopPropagation()}>
        <button className={styles.lbClose} onClick={onClose}><span className="mi">close</span></button>
        <img src={current.src || current.storageUrl} alt={current.caption} className={styles.lbImg} />
        {photos.length > 1 && (
          <>
            {idx > 0 && (
              <button className={`${styles.lbNav} ${styles.lbLeft}`} onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}>
                <span className="mi">chevron_left</span>
              </button>
            )}
            {idx < photos.length - 1 && (
              <button className={`${styles.lbNav} ${styles.lbRight}`} onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}>
                <span className="mi">chevron_right</span>
              </button>
            )}
          </>
        )}
        {(current.caption || current.price) && (
          <div className={styles.lbMeta}>
            {current.caption && <p className={styles.lbCaption}>{current.caption}</p>}
            <div className={styles.lbTags}>
              {current.clothingTypeLabel && <span className={styles.lbType}>{current.clothingTypeLabel}</span>}
              {current.price && <span className={styles.lbPrice}>From ₦{current.price}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function Portfolio() {
  // `handle` = slug ("stitched-by-amara") OR legacy Firebase UID
  const { handle } = useParams()

  const [resolvedUid,   setResolvedUid]   = useState(null)
  const [brand,         setBrand]         = useState(null)
  const [photos,        setPhotos]        = useState([])
  const [dressTypes,    setDressTypes]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [activeTab,     setActiveTab]     = useState(null)
  const [lightbox,      setLightbox]      = useState(null)
  const [bookingOpen,   setBookingOpen]   = useState(false)
  const [navScrolled,   setNavScrolled]   = useState(false)
  const [navOpen,       setNavOpen]       = useState(false)
  const [lightMode,     setLightMode]     = useState(true)
  const [heroImageId,   setHeroImageId]   = useState(null)
  const [footerImageId, setFooterImageId] = useState(null)
  const [reviews,       setReviews]       = useState([])

  const [activeNav,     setActiveNav]     = useState('home')

  const worksRef        = useRef(null)
  const aboutRef        = useRef(null)
  const bookRef         = useRef(null)
  const heroRef         = useRef(null)
  const filterScrollRef = useRef(null)

  // ── Step 1: resolve handle → uid ─────────────────────────────
  // Firebase UIDs always contain uppercase letters.
  // Slugs are purely lowercase a-z, 0-9, hyphens.
  // This lets us route both formats without a server.
  useEffect(() => {
    if (!handle) { setNotFound(true); setLoading(false); return }

    const looksLikeUid = /[A-Z]/.test(handle)

    if (looksLikeUid) {
      // Legacy UID link — use directly, no slug lookup needed
      setResolvedUid(handle)
    } else {
      resolveSlug(handle)
        .then(uid => {
          if (!uid) { setNotFound(true); setLoading(false) }
          else setResolvedUid(uid)
        })
        .catch(() => { setNotFound(true); setLoading(false) })
    }
  }, [handle])

  // ── Step 2: load brand once uid is known ─────────────────────
  useEffect(() => {
    if (!resolvedUid) return
    getBrandFromFirestore(resolvedUid)
      .then(data => { if (!data) setNotFound(true); else setBrand(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [resolvedUid])

  // ── Step 3: realtime photos ───────────────────────────────────
  useEffect(() => {
    if (!resolvedUid) return
    const q = query(collection(db, 'users', resolvedUid, 'galleryPhotos'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
  }, [resolvedUid])

  // ── Step 4: realtime dress types ─────────────────────────────
  useEffect(() => {
    if (!resolvedUid) return
    return onSnapshot(
      doc(db, 'users', resolvedUid, 'galleryDressTypes', 'completed_works'),
      snap => setDressTypes(snap.exists() ? (snap.data().types ?? []) : []),
      () => {}
    )
  }, [resolvedUid])

  // ── Step 5: portfolio image selections ───────────────────────
  useEffect(() => {
    if (!resolvedUid) return
    getPortfolioSettings(resolvedUid)
      .then(({ heroImageId: h, footerImageId: f }) => { setHeroImageId(h); setFooterImageId(f) })
      .catch(() => {})
  }, [resolvedUid])

  // ── Step 6: approved reviews (public, real-time) ──────────
  useEffect(() => {
    if (!resolvedUid) return
    const q = query(
      collection(db, 'users', resolvedUid, 'reviews'),
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
  }, [resolvedUid])

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const sections = [
      { id: 'home',  ref: heroRef },
      { id: 'about', ref: aboutRef },
      { id: 'works', ref: worksRef },
      { id: 'book',  ref: bookRef },
    ]
    const observers = sections.map(({ id, ref }) => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveNav(id) },
        { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
      )
      if (ref.current) observer.observe(ref.current)
      return observer
    })
    return () => observers.forEach((obs, i) => {
      if (sections[i].ref.current) obs.unobserve(sections[i].ref.current)
    })
  }, [brand])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (filterScrollRef.current) {
      const el = filterScrollRef.current.querySelector(`[data-tab="${tabId ?? 'all'}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  const scrollTo = (ref) => {
    setNavOpen(false)
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f6f1' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: 1, height: 60, background: 'linear-gradient(to bottom, transparent, #999)', animation: 'grow 1.2s ease infinite' }} />
          <style>{`@keyframes grow { 0%,100%{opacity:0.2;transform:scaleY(0.3)} 50%{opacity:1;transform:scaleY(1)} }`}</style>
          <p style={{ color: '#888', fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Loading</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f6f1', gap: '16px' }}>
        <span className="mi" style={{ fontSize: '3rem', color: '#bbb' }}>content_cut</span>
        <p style={{ color: '#222', fontFamily: 'Georgia, serif', fontSize: '1.2rem', letterSpacing: '1px' }}>Portfolio not found</p>
        <p style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '1px' }}>This tailor hasn't set up their portfolio yet.</p>
      </div>
    )
  }

  const brandName       = brand.brandName    || 'The Tailor'
  const tagline         = brand.brandTagline || ''
  const brandBio        = brand.brandBio     || ''
  const completedPhotos = photos.filter(p => p.category === 'completed_works')
  const filteredPhotos  = activeTab ? completedPhotos.filter(p => p.clothingType === activeTab) : completedPhotos
  const heroPhoto       = (heroImageId   ? completedPhotos.find(p => p.id === heroImageId)   : null) ?? completedPhotos[0] ?? null
  const footerPhoto     = (footerImageId ? completedPhotos.find(p => p.id === footerImageId) : null) ?? completedPhotos[1] ?? null

  return (
    <div className={`${styles.page} ${lightMode ? styles.lightMode : ''}`}>

      {/* ── NAV ── */}
      <nav className={`${styles.nav} ${navScrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <span className={styles.navBrand}>{brandName}</span>
          <div className={`${styles.navLinks} ${navOpen ? styles.navLinksOpen : ''}`}>
            <div className={styles.navHomeRow}>
              <button className={styles.themeToggleMobileInline} onClick={() => setLightMode(m => !m)} aria-label="Toggle theme">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="currentColor"/>
                </svg>
              </button>
              <button onClick={() => { setNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className={`${styles.navLink} ${activeNav === 'home' ? styles.navLinkActive : ''}`}>Home</button>
              <span className={styles.navHomeRowSpacer} />
            </div>
            <button onClick={() => scrollTo(aboutRef)} className={`${styles.navLink} ${activeNav === 'about' ? styles.navLinkActive : ''}`}>About</button>
            <button onClick={() => scrollTo(worksRef)} className={`${styles.navLink} ${activeNav === 'works' ? styles.navLinkActive : ''}`}>Works</button>
            <button onClick={() => scrollTo(bookRef)}  className={`${styles.navLink} ${activeNav === 'book'  ? styles.navLinkActive : ''}`}>Book</button>
            <button onClick={() => { setNavOpen(false); setBookingOpen(true) }} className={styles.navCta}>Order Now</button>
          </div>
          <div className={styles.navRight}>
            <button className={styles.themeToggleDesktop} onClick={() => setLightMode(m => !m)} aria-label="Toggle theme">
              <span className="material-icons">{lightMode ? 'dark_mode' : 'light_mode'}</span>
            </button>
            <button className={styles.navHamburger} onClick={() => setNavOpen(o => !o)} aria-label="Menu">
              <span className={`${styles.hamLine} ${navOpen ? styles.hamLineToTop : ''}`} />
              <span className={`${styles.hamLine} ${navOpen ? styles.hamLineToBottom : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero} ref={heroRef}>
        {heroPhoto ? (
          <div className={styles.heroBgWrap}>
            <img src={heroPhoto.src || heroPhoto.storageUrl} alt="" className={styles.heroBgImg} />
            <div className={styles.heroBgOverlay} />
          </div>
        ) : <div className={styles.heroBgFallback} />}
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>— {brandName} —</p>
          <h1 className={styles.heroName}>{brandName}</h1>
          {tagline && <p className={styles.heroTagline}>{tagline}</p>}
          <div className={styles.heroCtas}>
            <button className={styles.heroPrimary} onClick={() => setBookingOpen(true)}>Place an Order</button>
            <button className={styles.heroSecondary} onClick={() => scrollTo(worksRef)}>
              View Works
              <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 6 }}>arrow_downward</span>
            </button>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <span className={styles.heroScrollLine} />
          <span className={styles.heroScrollText}>Scroll</span>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{completedPhotos.length || '—'}</span>
          <span className={styles.statLabel}>Completed Works</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statNum}>{dressTypes.length || '—'}</span>
          <span className={styles.statLabel}>Specialties</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className="mi" style={{ fontSize: '1.1rem' }}>verified</span>
          <span className={styles.statLabel}>Bespoke Only</span>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section className={styles.about} ref={aboutRef}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutLeft}>
            <p className={styles.sectionEyebrow}>01 — About</p>
            <h2 className={styles.aboutHeading}>{brandName}</h2>
            {tagline && <p className={styles.aboutHeadingTagline}>"{tagline}"</p>}
          </div>
          <div className={styles.aboutRight}>
            <div className={styles.aboutCard}>
              <div className={styles.aboutLogo}>
                {brand.brandLogo
                  ? <img src={brand.brandLogo} alt={brandName} className={styles.aboutLogoImg} />
                  : <div className={styles.aboutInitials}>{initials(brandName)}</div>}
              </div>
              <p className={styles.aboutName}>{brandName}</p>
              {tagline && <p className={styles.aboutTagline}>"{tagline}"</p>}
              {brandBio && <p className={styles.aboutBio}>{brandBio}</p>}
              {dressTypes.length > 0 && (
                <div className={styles.aboutSpecialties}>
                  <p className={styles.aboutSpecialtiesLabel}>Specialises in</p>
                  <div className={styles.aboutSpecialtiesList}>
                    {dressTypes.map(t => <span key={t.id} className={styles.aboutSpecialtyPill}>{t.label}</span>)}
                  </div>
                </div>
              )}
              <div className={styles.aboutMeta}>
                {brand.brandAddress && (
                  <div className={styles.aboutMetaRow}>
                    <span className="material-icons" style={{ fontSize: '0.95rem', flexShrink: 0 }}>location_on</span>
                    <span>{brand.brandAddress}</span>
                  </div>
                )}
                {brand.brandPhone && (
                  <a href={`tel:${brand.brandPhone}`} className={styles.aboutMetaRow}>
                    <span className="material-icons" style={{ fontSize: '0.95rem', flexShrink: 0 }}>call</span>
                    <span>{brand.brandPhone}</span>
                  </a>
                )}
                {brand.brandEmail && (
                  <a href={`mailto:${brand.brandEmail}`} className={styles.aboutMetaRow}>
                    <span className="material-icons" style={{ fontSize: '0.95rem', flexShrink: 0 }}>mail</span>
                    <span>{brand.brandEmail}</span>
                  </a>
                )}
                {brand.brandWebsite && (
                  <a href={brand.brandWebsite} target="_blank" rel="noopener noreferrer" className={styles.aboutMetaRow}>
                    <span className="material-icons" style={{ fontSize: '0.95rem', flexShrink: 0 }}>language</span>
                    <span>{brand.brandWebsite}</span>
                  </a>
                )}
              </div>
              {brand.brandPhone && (
                <a href={`https://wa.me/${brand.brandPhone.replace(/\D/g,'')}`} className={styles.whatsappBtn} target="_blank" rel="noopener noreferrer">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES MARQUEE ── */}
      {dressTypes.length > 0 && (
        <div className={styles.marqueeWrap}>
          <div className={styles.marqueeTrack}>
            {[...dressTypes, ...dressTypes, ...dressTypes, ...dressTypes].map((t, i) => (
              <span key={i} className={styles.marqueeItem}>
                {t.label}
                <span className="mi" style={{ fontSize: '0.5rem', margin: '0 16px', opacity: 0.3, verticalAlign: 'middle' }}>fiber_manual_record</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPLETED WORKS ── */}
      <section className={styles.works} ref={worksRef}>
        <div className={styles.worksHead}>
          <p className={styles.sectionEyebrow}>02 — Portfolio</p>
          <h2 className={styles.worksTitle}>Completed Works</h2>
          <p className={styles.worksSub}>Every piece is a testament to precision and craft.</p>
        </div>
        {dressTypes.length > 0 && (
          <div className={styles.filterBar}>
            <div className={styles.filterScroll} ref={filterScrollRef}>
              <button data-tab="all" className={`${styles.filterPill} ${!activeTab ? styles.filterPillActive : ''}`} onClick={() => handleTabChange(null)}>All</button>
              {dressTypes.map(t => (
                <button key={t.id} data-tab={t.id} className={`${styles.filterPill} ${activeTab === t.id ? styles.filterPillActive : ''}`} onClick={() => handleTabChange(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>
        )}
        {filteredPhotos.length === 0 ? (
          <div className={styles.emptyWorks}><p>No works in this category yet.</p></div>
        ) : (
          <div className={styles.photoGrid}>
            {filteredPhotos.map((photo, i) => (
              <div key={photo.id} className={`${styles.photoCard} ${i === 0 ? styles.photoCardFeatured : ''}`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => setLightbox(photo)}>
                <img src={photo.src || photo.storageUrl} alt={photo.caption || 'Completed work'} className={styles.photoImg} loading="lazy" />
                {photo.price && (
                  <span className={styles.photoPrice}>₦{photo.price}</span>
                )}
                <div className={styles.photoOverlay}>
                  <span className={`mi ${styles.photoZoom}`}>open_in_full</span>
                  {photo.caption && <p className={styles.photoCaption}>{photo.caption}</p>}
                  {photo.clothingTypeLabel && <span className={styles.photoType}>{photo.clothingTypeLabel}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PROCESS ── */}
      <section className={styles.process}>
        <div className={styles.processInner}>
          <p className={styles.sectionEyebrow}>03 — Process</p>
          <h2 className={styles.processTitle}>From Idea<br />to Outfit</h2>
          <div className={styles.processSteps}>
            {[
              { num: '01', icon: 'forum',          title: 'Consultation', desc: 'Share your vision, occasion, and preferences. We listen carefully.' },
              { num: '02', icon: 'straighten',     title: 'Measurements', desc: 'Precise measurements taken for a flawless custom fit.' },
              { num: '03', icon: 'content_cut',    title: 'Crafting',     desc: 'Every stitch placed with intention, skill, and care.' },
              { num: '04', icon: 'local_shipping', title: 'Delivery',     desc: 'Your bespoke garment, delivered to perfection.' },
            ].map(step => (
              <div key={step.num} className={styles.processStep}>
                <div className={styles.processNumWrap}>
                  <span className={styles.processNum}>{step.num}</span>
                  <span className={`mi ${styles.processIcon}`}>{step.icon}</span>
                </div>
                <div className={styles.processLine} />
                <div>
                  <p className={styles.processStepTitle}>{step.title}</p>
                  <p className={styles.processStepDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {reviews.length > 0 && (
        <section className={styles.testimonials}>
          <div className={styles.testimonialsInner}>
            <p className={styles.sectionEyebrow}>04 — Testimonials</p>
            <h2 className={styles.testimonialsTitle}>What Clients Say</h2>
            <div className={styles.testimonialsGrid}>
              {reviews.map(r => (
                <div key={r.id} className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>
                    {[1,2,3,4,5].map(n => (
                      <span
                        key={n}
                        className="material-icons"
                        style={{ fontSize: '0.9rem', color: n <= r.rating ? '#f59e0b' : 'var(--border)' }}
                      >star</span>
                    ))}
                  </div>
                  <p className={styles.testimonialText}>"{r.review}"</p>
                  <div className={styles.testimonialAuthor}>
                    <div className={styles.testimonialAvatar}>
                      {(r.customerName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.testimonialName}>{r.customerName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOOK CTA ── */}
      <section className={styles.bookSection} ref={bookRef}>
        {footerPhoto ? (
          <div className={styles.bookBgWrap}>
            <img src={footerPhoto.src || footerPhoto.storageUrl} alt="" className={styles.bookBgImg} />
            <div className={styles.bookBgOverlay} />
          </div>
        ) : <div className={styles.bookBgFallback} />}
        <div className={styles.bookContent}>
          <p className={styles.sectionEyebrow} style={{ color: '#888' }}>05 — Book</p>
          <h2 className={styles.bookTitle}>Ready for<br />something<br />extraordinary?</h2>
          <p className={styles.bookSub}>Every garment is made to order.<br />Let's create yours.</p>
          <button className={styles.bookCta} onClick={() => setBookingOpen(true)}>Place Your Order</button>
          <div className={styles.bookContacts}>
            {brand.brandPhone && (
              <a href={`tel:${brand.brandPhone}`} className={styles.bookContact}>
                <span className="mi" style={{ fontSize: '0.9rem' }}>call</span>{brand.brandPhone}
              </a>
            )}
            {brand.brandEmail && (
              <a href={`mailto:${brand.brandEmail}`} className={styles.bookContact}>
                <span className="mi" style={{ fontSize: '0.9rem' }}>mail</span>{brand.brandEmail}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <p className={styles.footerBrand}>{brandName}</p>
          {tagline && <p className={styles.footerTagline}>{tagline}</p>}
        </div>
        <div className={styles.footerDivider} />
        <div className={styles.footerBottom}>
          <div className={styles.footerLinks}>
            {brand.brandPhone && <a href={`tel:${brand.brandPhone}`} className={styles.footerLink}><span className="material-icons">call</span>Call</a>}
            {brand.brandEmail && <a href={`mailto:${brand.brandEmail}`} className={styles.footerLink}><span className="material-icons">mail</span>Email</a>}
            {brand.brandPhone && (
              <a href={`https://wa.me/${brand.brandPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
        <div className={styles.footerPoweredRow}>
          <p className={styles.footerPowered}>Powered by TailorFlow</p>
        </div>
      </footer>

      {lightbox && <Lightbox photo={lightbox} photos={filteredPhotos} onClose={() => setLightbox(null)} />}
      <BookingSheet isOpen={bookingOpen} onClose={() => setBookingOpen(false)} brandName={brandName} brandEmail={brand.brandEmail} brandPhone={brand.brandPhone} />
    </div>
  )
}