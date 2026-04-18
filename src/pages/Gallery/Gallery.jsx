import { useState, useRef, useCallback, useEffect } from 'react'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast from '../../components/Toast/Toast'
import styles from './Gallery.module.css'

// ── STORAGE ──
const GALLERY_KEY = 'tailorbook_gallery'
const SUB_TABS_KEY = 'tailorbook_gallery_subtabs'

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

function loadSubTabs() {
  try {
    const raw = localStorage.getItem(SUB_TABS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_SUB_TABS
  } catch { return DEFAULT_SUB_TABS }
}

function saveSubTabs(subTabs) {
  try { localStorage.setItem(SUB_TABS_KEY, JSON.stringify(subTabs)) }
  catch {}
}

// ── TABS ──
const TABS = [
  { id: 'completed_works', label: 'Completed Works', icon: 'check_circle' },
  { id: 'designs',         label: 'Designs',         icon: 'content_cut' },
  { id: 'inspiration',     label: 'Inspiration',     icon: 'lightbulb' },
]

const CATEGORY_MAP = {
  designs:         { label: 'Design Reference', icon: 'content_cut' },
  completed_works: { label: 'Completed Work',   icon: 'check_circle' },
  inspiration:     { label: 'Inspiration',      icon: 'lightbulb' },
}

// Default sub-tabs for each main tab
const DEFAULT_SUB_TABS = {
  completed_works: [{ id: 'kaftan', label: 'Kaftan' }, { id: 'gown', label: 'Gown' }],
  designs:         [{ id: 'kaftan', label: 'Kaftan' }, { id: 'gown', label: 'Gown' }],
  inspiration:     [{ id: 'kaftan', label: 'Kaftan' }, { id: 'gown', label: 'Gown' }],
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// ── MANAGE SUB-TABS MODAL ──
function ManageSubTabsModal({ isOpen, onClose, tabId, subTabs, onSave }) {
  const [items, setItems] = useState([...(subTabs || [])])
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    if (isOpen) setItems([...(subTabs || [])])
  }, [isOpen, subTabs])

  if (!isOpen) return null

  const addItem = () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    setItems(prev => [...prev, { id, label: trimmed }])
    setNewLabel('')
  }

  const removeItem = (id) => setItems(prev => prev.filter(t => t.id !== id))

  const handleSave = () => {
    onSave(tabId, items)
    onClose()
  }

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Manage Categories</span>
          <button className={styles.sheetClose} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <div className={styles.sheetBody}>
          {items.map(item => (
            <div key={item.id} className={styles.manageRow}>
              <span className={styles.manageLabel}>{item.label}</span>
              <button className={styles.manageRemove} onClick={() => removeItem(item.id)}>
                <span className="mi" style={{ fontSize: '1rem', color: 'var(--danger)' }}>delete_outline</span>
              </button>
            </div>
          ))}

          <div className={styles.manageAddRow}>
            <input
              type="text"
              className={styles.manageInput}
              placeholder="New category (e.g. Agbada)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem() }}
            />
            <button
              className={styles.manageAddBtn}
              onClick={addItem}
              disabled={!newLabel.trim()}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>add</span>
            </button>
          </div>
        </div>

        <div className={styles.sheetFooter}>
          <button className={styles.sheetSaveBtn} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

// ── ADD PHOTO MODAL ──
function AddPhotoModal({ isOpen, onClose, onSave, customers, subTabs, activeMainTab }) {
  const [category, setCategory]         = useState(activeMainTab || 'completed_works')
  const [selectedCust, setSelectedCust] = useState(null)
  const [custQuery, setCustQuery]       = useState('')
  const [custDropOpen, setCustDropOpen] = useState(false)
  const [photos, setPhotos]             = useState([]) // array of { src, name, caption, clothingType }
  const [captionErrors, setCaptionErrors] = useState({})
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  const currentSubTabs = subTabs[category] || []

  const filteredCusts = custQuery.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(custQuery.toLowerCase()) ||
        c.phone?.includes(custQuery)
      )
    : customers

  const handleFiles = (files) => {
    const defaultType = currentSubTabs[0]?.id || ''
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          src: e.target.result,
          name: file.name,
          caption: '',
          clothingType: defaultType,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx))

  const updatePhoto = (idx, field, value) => {
    setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
    if (field === 'caption') {
      setCaptionErrors(prev => ({ ...prev, [idx]: false }))
    }
  }

  const reset = () => {
    setCategory(activeMainTab || 'completed_works')
    setSelectedCust(null)
    setCustQuery(''); setCustDropOpen(false)
    setPhotos([])
    setCaptionErrors({})
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (photos.length === 0) return
    // Validate all captions are filled
    const errors = {}
    photos.forEach((p, i) => {
      if (!p.caption.trim()) errors[i] = true
    })
    if (Object.keys(errors).length > 0) {
      setCaptionErrors(errors)
      return
    }
    const dateStr = new Date().toISOString()
    photos.forEach(p => {
      onSave({
        id: Date.now() + Math.random(),
        src: p.src,
        category,
        caption: p.caption.trim(),
        clothingType: p.clothingType,
        customerId:   selectedCust ? String(selectedCust.id) : null,
        customerName: selectedCust ? selectedCust.name : null,
        date: dateStr,
      })
    })
    reset()
    onClose()
  }

  // When category changes, reset clothingType for all photos
  useEffect(() => {
    const defaultType = (subTabs[category] || [])[0]?.id || ''
    setPhotos(prev => prev.map(p => ({ ...p, clothingType: defaultType })))
  }, [category, subTabs])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <Header
        type="back"
        title="Add Photo"
        onBackClick={handleClose}
        customActions={[{
          label: 'Save',
          onClick: handleSave,
          disabled: photos.length === 0
        }]}
      />

      <div className={styles.modalBody}>
        {/* Photo picker area */}
        {photos.length === 0 ? (
          <div className={styles.uploadArea}>
            <div className={styles.uploadIcon}>
              <span className="mi" style={{ fontSize: '3rem', opacity: 0.3 }}>add_a_photo</span>
            </div>
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
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFiles(e.target.files)} />
            <input ref={fileInputRef}   type="file" accept="image/*" multiple          hidden onChange={e => handleFiles(e.target.files)} />
          </div>
        ) : (
          <div className={styles.previewSection}>
            {/* Per-image caption + clothing type */}
            {photos.map((p, i) => (
              <div key={i} className={styles.photoEntry}>
                <div className={styles.photoEntryTop}>
                  <div className={styles.previewThumb}>
                    <img src={p.src} alt={p.name} className={styles.previewImg} />
                    <button className={styles.previewRemove} onClick={() => removePhoto(i)}>
                      <span className="mi" style={{ fontSize: '0.9rem' }}>close</span>
                    </button>
                  </div>
                  <div className={styles.photoEntryFields}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        Caption <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${captionErrors[i] ? styles.inputError : ''}`}
                        placeholder="e.g. Senator suit for Emeka"
                        value={p.caption}
                        onChange={e => updatePhoto(i, 'caption', e.target.value)}
                      />
                      {captionErrors[i] && (
                        <span className={styles.errorMsg}>Caption is required</span>
                      )}
                    </div>
                    {currentSubTabs.length > 0 && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Category</label>
                        <div className={styles.clothingTypeRow}>
                          {currentSubTabs.map(st => (
                            <button
                              key={st.id}
                              className={`${styles.clothingTypeChip} ${p.clothingType === st.id ? styles.clothingTypeActive : ''}`}
                              onClick={() => updatePhoto(i, 'clothingType', st.id)}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add more button */}
            <button className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()}>
              <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>add_photo_alternate</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 700 }}>Add more photos</span>
            </button>

            <input ref={fileInputRef}   type="file" accept="image/*" multiple          hidden onChange={e => handleFiles(e.target.files)} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFiles(e.target.files)} />
          </div>
        )}

        {/* Category (main tab) */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Section</label>
          <div className={styles.categoryRow}>
            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
              <button
                key={key}
                className={`${styles.categoryChip} ${category === key ? styles.categoryActive : ''}`}
                onClick={() => setCategory(key)}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>{val.icon}</span>
                <span className={styles.categoryLabel}>{val.label}</span>
              </button>
            ))}
          </div>
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
    </div>
  )
}

// ── LIGHTBOX ──
function Lightbox({ photo, photos, onClose, onDelete }) {
  const [current, setCurrent] = useState(photo)

  const idx     = photos.findIndex(p => p.id === current.id)
  const hasPrev = idx > 0
  const hasNext = idx < photos.length - 1

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
            <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>delete_outline</span>
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
            {cat && (
              <span className={styles.lightboxChip}>
                <span className="mi" style={{ fontSize: '0.85rem' }}>{cat.icon}</span>
                {cat.label}
              </span>
            )}
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

  const [photos, setPhotos]                     = useState(() => loadPhotos())
  const [activeTab, setActiveTab]               = useState('completed_works')
  const [activeSubTabs, setActiveSubTabs]       = useState({}) // { tabId: subTabId }
  const [subTabs, setSubTabs]                   = useState(() => loadSubTabs())
  const [manageTabId, setManageTabId]           = useState(null)
  const [modalOpen, setModalOpen]               = useState(false)
  const [lightboxPhoto, setLightboxPhoto]       = useState(null)
  const [confirmDel, setConfirmDel]             = useState(null)
  const [toastMsg, setToastMsg]                 = useState('')
  const toastTimer = useRef(null)
  const tabsRef    = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  useEffect(() => { savePhotos(photos) }, [photos])
  useEffect(() => { saveSubTabs(subTabs) }, [subTabs])

  const addPhoto = (photo) => setPhotos(prev => [photo, ...prev])

  const handleDeleteConfirm = () => {
    if (!confirmDel) return
    setPhotos(prev => prev.filter(p => p.id !== confirmDel.id))
    if (lightboxPhoto?.id === confirmDel.id) setLightboxPhoto(null)
    showToast('Photo deleted')
    setConfirmDel(null)
  }

  const handleSaveSubTabs = (tabId, newTabs) => {
    setSubTabs(prev => ({ ...prev, [tabId]: newTabs }))
    // Reset active sub-tab for this main tab if it no longer exists
    const ids = newTabs.map(t => t.id)
    setActiveSubTabs(prev => ({
      ...prev,
      [tabId]: ids.includes(prev[tabId]) ? prev[tabId] : (ids[0] || null)
    }))
  }

  const currentSubTabs = subTabs[activeTab] || []
  const activeSubTab   = activeSubTabs[activeTab] || currentSubTabs[0]?.id || null

  // Filter by main tab then by sub-tab
  const filteredByMain = photos.filter(p => p.category === activeTab)
  const filtered = activeSubTab
    ? filteredByMain.filter(p => p.clothingType === activeSubTab)
    : filteredByMain

  const counts = Object.fromEntries(
    TABS.map(t => [t.id, photos.filter(p => p.category === t.id).length])
  )

  const lightboxList = lightboxPhoto ? filtered : []

  return (
    <div className={styles.page}>
      <Header title="Gallery" onMenuClick={onMenuClick} />

      {/* MAIN TABS + CONTEXT ACTION (same sticky row) */}
      <div className={styles.tabActionBar}>
        <div className={styles.tabs} ref={tabsRef}>
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={(e) => {
                setActiveTab(tab.id)
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
              }}
            >
              <span>{tab.label}</span>
              {counts[tab.id] > 0 && (
                <span className={styles.tabBadge}>{counts[tab.id]}</span>
              )}
            </div>
          ))}
        </div>

        {/* Per-tab action button — top right */}
        <div className={styles.tabAction}>
          {activeTab === 'completed_works' && (
            <button
              className={styles.tabActionBtn}
              onClick={() => showToast('Portfolio link coming soon!')}
            >
              <span className="mi" style={{ fontSize: '0.95rem' }}>share</span>
              <span className={styles.tabActionLabel}>Share</span>
            </button>
          )}
          {activeTab === 'designs' && (
            <button
              className={styles.tabActionBtn}
              onClick={() => showToast('Export lookbook coming soon!')}
            >
              <span className="mi" style={{ fontSize: '0.95rem' }}>picture_as_pdf</span>
              <span className={styles.tabActionLabel}>Lookbook</span>
            </button>
          )}
          {activeTab === 'inspiration' && (
            <button
              className={styles.tabActionBtn}
              onClick={() => showToast('Share board coming soon!')}
            >
              <span className="mi" style={{ fontSize: '0.95rem' }}>send</span>
              <span className={styles.tabActionLabel}>Send Board</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TABS (rounded pill style) */}
      <div className={styles.subTabsBar}>
        <div className={styles.subTabsScroll}>
          {currentSubTabs.map(st => (
            <button
              key={st.id}
              className={`${styles.subTab} ${activeSubTab === st.id ? styles.subTabActive : ''}`}
              onClick={() => setActiveSubTabs(prev => ({ ...prev, [activeTab]: st.id }))}
            >
              {st.label}
            </button>
          ))}
        </div>
        {/* Action icons */}
        <div className={styles.subTabActions}>
          <button
            className={styles.subTabIconBtn}
            onClick={() => setManageTabId(activeTab)}
            title="Edit categories"
          >
            <span className="mi" style={{ fontSize: '1.1rem' }}>edit</span>
          </button>
          <button
            className={styles.subTabIconBtn}
            onClick={() => setManageTabId(activeTab)}
            title="Add category"
          >
            <span className="mi" style={{ fontSize: '1.1rem' }}>add</span>
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.gridArea}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '3rem', opacity: 0.15 }}>
              {CATEGORY_MAP[activeTab]?.icon ?? 'image'}
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
                <div className={styles.thumbBadge}>
                  <span className="mi" style={{ fontSize: '0.8rem' }}>{CATEGORY_MAP[photo.category]?.icon}</span>
                </div>
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
          subTabs={subTabs}
          activeMainTab={activeTab}
        />
      )}

      {/* MANAGE SUB-TABS */}
      <ManageSubTabsModal
        isOpen={!!manageTabId}
        onClose={() => setManageTabId(null)}
        tabId={manageTabId}
        subTabs={subTabs[manageTabId] || []}
        onSave={handleSaveSubTabs}
      />

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
