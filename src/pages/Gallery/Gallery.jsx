import { useState, useRef, useCallback, useEffect } from 'react'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast from '../../components/Toast/Toast'
import styles from './Gallery.module.css'

// ── STORAGE ──
const GALLERY_KEY = 'tailorbook_gallery'

function loadPhotos() {
  try {
    const raw = localStorage.getItem(GALLERY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePhotos(photos) {
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(photos)) }
  catch { /* quota exceeded — base64 images are large */ }
}

// ── TABS ──
const TABS = [
  { id: 'all',        label: 'All',         icon: '🖼️' },
  { id: 'designs',    label: 'Designs',     icon: '✂️' },
  { id: 'completed',  label: 'Completed',   icon: '✅' },
  { id: 'outfits',    label: 'Outfits',     icon: '👔' },
  { id: 'inspiration',label: 'Inspiration', icon: '💡' },
]

const CATEGORY_MAP = {
  designs:     { label: 'Design Reference', icon: '✂️' },
  completed:   { label: 'Completed Work',   icon: '✅' },
  outfits:     { label: 'Customer Outfit',  icon: '👔' },
  inspiration: { label: 'Inspiration',      icon: '💡' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// ── ADD PHOTO MODAL ──
function AddPhotoModal({ isOpen, onClose, onSave, customers }) {
  const [category, setCategory]     = useState('designs')
  const [caption, setCaption]       = useState('')
  const [selectedCust, setSelectedCust] = useState(null)
  const [custQuery, setCustQuery]   = useState('')
  const [custDropOpen, setCustDropOpen] = useState(false)
  const [photos, setPhotos]         = useState([]) // array of { src, name }
  const fileInputRef  = useRef(null)
  const cameraInputRef = useRef(null)

  const filteredCusts = custQuery.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(custQuery.toLowerCase()) ||
        c.phone?.includes(custQuery)
      )
    : customers

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, { src: e.target.result, name: file.name }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx))

  const reset = () => {
    setCategory('designs'); setCaption(''); setSelectedCust(null)
    setCustQuery(''); setCustDropOpen(false); setPhotos([])
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (photos.length === 0) return
    const dateStr = new Date().toISOString()
    photos.forEach(p => {
      onSave({
        id: Date.now() + Math.random(),
        src: p.src,
        category,
        caption: caption.trim(),
        customerId:   selectedCust ? String(selectedCust.id) : null,
        customerName: selectedCust ? selectedCust.name : null,
        date: dateStr,
      })
    })
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalHeader}>
        <span className={styles.modalTitle}>Add Photo</span>
        <button className={styles.modalClose} onClick={handleClose}>
          <span className="mi" style={{ fontSize: '1.8rem' }}>close</span>
        </button>
      </div>

      <div className={styles.modalBody}>
        {/* Photo picker area */}
        {photos.length === 0 ? (
          <div className={styles.uploadArea}>
            <div className={styles.uploadIcon}>📷</div>
            <p className={styles.uploadText}>Add photos from your camera or files</p>
            <div className={styles.uploadBtns}>
              <button className={styles.uploadBtn} onClick={() => cameraInputRef.current?.click()}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>photo_camera</span>
                Camera
              </button>
              <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>photo_library</span>
                Gallery
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={e => handleFiles(e.target.files)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        ) : (
          <div className={styles.previewSection}>
            <div className={styles.previewGrid}>
              {photos.map((p, i) => (
                <div key={i} className={styles.previewThumb}>
                  <img src={p.src} alt={p.name} className={styles.previewImg} />
                  <button className={styles.previewRemove} onClick={() => removePhoto(i)}>
                    <span className="mi" style={{ fontSize: '0.9rem' }}>close</span>
                  </button>
                </div>
              ))}
              {/* Add more button */}
              <button className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()}>
                <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>add</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => handleFiles(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Category */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Category</label>
          <div className={styles.categoryRow}>
            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
              <button
                key={key}
                className={`${styles.categoryChip} ${category === key ? styles.categoryActive : ''}`}
                onClick={() => setCategory(key)}
              >
                <span>{val.icon}</span>
                <span className={styles.categoryLabel}>{val.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Caption <span className={styles.optional}>(optional)</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Senator suit for Uchendu"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
        </div>

        {/* Related client */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Related Client <span className={styles.optional}>(optional)</span></label>
          {selectedCust ? (
            <div className={styles.selectedChip}>
              <div className={styles.chipAvatar}>
                {selectedCust.name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <span className={styles.chipName}>{selectedCust.name}</span>
              <button className={styles.chipRemove} onClick={() => setSelectedCust(null)}>
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
          ) : (
            <div className={styles.searchWrap}>
              <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search client…"
                value={custQuery}
                onChange={e => { setCustQuery(e.target.value); setCustDropOpen(true) }}
                onFocus={() => setCustDropOpen(true)}
              />
              {custDropOpen && custQuery && (
                <div className={styles.dropdown}>
                  {filteredCusts.length === 0 ? (
                    <div className={styles.dropEmpty}>No clients found</div>
                  ) : (
                    filteredCusts.slice(0, 5).map(c => (
                      <button key={c.id} className={styles.dropItem}
                        onClick={() => { setSelectedCust(c); setCustQuery(''); setCustDropOpen(false) }}>
                        <div className={styles.dropAvatar}>
                          {c.name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.dropName}>{c.name}</div>
                          <div className={styles.dropMeta}>{c.phone}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.modalSaveBar}>
        <button
          className={styles.btnSave}
          onClick={handleSave}
          style={{ opacity: photos.length === 0 ? 0.4 : 1 }}
        >
          Save {photos.length > 1 ? `${photos.length} Photos` : 'Photo'}
        </button>
      </div>
    </div>
  )
}

// ── LIGHTBOX ──
function Lightbox({ photo, photos, onClose, onDelete }) {
  const [current, setCurrent] = useState(photo)

  const idx      = photos.findIndex(p => p.id === current.id)
  const hasPrev  = idx > 0
  const hasNext  = idx < photos.length - 1

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft'  && hasPrev) setCurrent(photos[idx - 1])
      if (e.key === 'ArrowRight' && hasNext) setCurrent(photos[idx + 1])
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx, hasPrev, hasNext, photos, onClose])

  const cat = CATEGORY_MAP[current.category]

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className={styles.lightboxBar}>
          <button className={styles.lightboxBtn} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.6rem' }}>close</span>
          </button>
          <div className={styles.lightboxCounter}>{idx + 1} / {photos.length}</div>
          <button className={styles.lightboxBtn} onClick={() => onDelete(current)} style={{ color: 'var(--danger)' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>delete_outline</span>
          </button>
        </div>

        {/* Image */}
        <div className={styles.lightboxImgWrap}>
          {hasPrev && (
            <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={() => setCurrent(photos[idx - 1])}>
              <span className="mi" style={{ fontSize: '1.6rem' }}>chevron_left</span>
            </button>
          )}
          <img src={current.src} alt={current.caption || 'Photo'} className={styles.lightboxImg} />
          {hasNext && (
            <button className={`${styles.navBtn} ${styles.navRight}`} onClick={() => setCurrent(photos[idx + 1])}>
              <span className="mi" style={{ fontSize: '1.6rem' }}>chevron_right</span>
            </button>
          )}
        </div>

        {/* Info */}
        <div className={styles.lightboxInfo}>
          {current.caption && <div className={styles.lightboxCaption}>{current.caption}</div>}
          <div className={styles.lightboxMeta}>
            {cat && <span className={styles.lightboxChip}>{cat.icon} {cat.label}</span>}
            {current.customerName && (
              <span className={styles.lightboxChip}>
                <span className="mi" style={{ fontSize: '0.75rem' }}>person</span>
                {current.customerName}
              </span>
            )}
            <span className={styles.lightboxChip}>
              <span className="mi" style={{ fontSize: '0.75rem' }}>calendar_today</span>
              {formatDate(current.date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function Gallery({ onMenuClick }) {
  const { customers } = useCustomers()

  const [photos, setPhotos]         = useState(() => loadPhotos())
  const [activeTab, setActiveTab]   = useState('all')
  const [modalOpen, setModalOpen]   = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [toastMsg, setToastMsg]     = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  useEffect(() => { savePhotos(photos) }, [photos])

  const addPhoto = (photo) => {
    setPhotos(prev => [photo, ...prev])
  }

  const handleDeleteConfirm = () => {
    if (!confirmDel) return
    setPhotos(prev => prev.filter(p => p.id !== confirmDel.id))
    if (lightboxPhoto?.id === confirmDel.id) setLightboxPhoto(null)
    showToast('Photo deleted')
    setConfirmDel(null)
  }

  const filtered = activeTab === 'all'
    ? photos
    : photos.filter(p => p.category === activeTab)

  const counts = Object.fromEntries(
    TABS.map(t => [t.id, t.id === 'all' ? photos.length : photos.filter(p => p.category === t.id).length])
  )

  // For lightbox navigation — use filtered list
  const lightboxList = lightboxPhoto
    ? (activeTab === 'all' ? photos : photos.filter(p => p.category === activeTab))
    : []

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      {/* TABS */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
            {counts[tab.id] > 0 && (
              <span className={styles.tabBadge}>{counts[tab.id]}</span>
            )}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className={styles.gridArea}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span style={{ fontSize: '3rem', opacity: 0.15 }}>
              {activeTab === 'all' ? '📷' : CATEGORY_MAP[activeTab]?.icon ?? '🖼️'}
            </span>
            <p>No photos here yet.</p>
            <span className={styles.emptyHint}>Tap + to add your first photo</span>
          </div>
        ) : (
          <div className={styles.photoGrid}>
            {filtered.map((photo, i) => (
              <div
                key={photo.id}
                className={styles.photoThumb}
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => setLightboxPhoto(photo)}
              >
                <img src={photo.src} alt={photo.caption || 'photo'} className={styles.thumbImg} />
                {/* Category badge */}
                <div className={styles.thumbBadge}>
                  {CATEGORY_MAP[photo.category]?.icon}
                </div>
                {/* Caption overlay */}
                {photo.caption && (
                  <div className={styles.thumbCaption}>{photo.caption}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => setModalOpen(true)}>
        <span className="mi">add</span>
      </button>

      {/* ADD PHOTO MODAL */}
      {modalOpen && (
        <AddPhotoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={addPhoto}
          customers={customers}
        />
      )}

      {/* LIGHTBOX */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={lightboxList}
          onClose={() => setLightboxPhoto(null)}
          onDelete={(p) => { setLightboxPhoto(null); setConfirmDel(p) }}
        />
      )}

      {/* CONFIRM DELETE */}
      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Photo?"
        message="This photo will be permanently removed."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      <Toast message={toastMsg} />
    </div>
  )
}
