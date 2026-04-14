// src/pages/CustomerDetail/tabs/MeasurementsTab.jsx

import { useState, useEffect, useRef } from 'react'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../components/Header/Header'
import styles from './Tabs.module.css'

const UNIT_LABELS = { in: '"', cm: 'cm', yd: 'yd' }
const UNIT_FULL   = { in: 'Inches (")', cm: 'Centimetres (cm)', yd: 'Yards (yd)' }

// ─────────────────────────────────────────────────────────────
// IMAGE COMPRESSION UTILITY
// Compresses a File/Blob to a base64 data URL, reducing file
// size while maintaining reasonable visual quality.
// ─────────────────────────────────────────────────────────────
function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        // Calculate new dimensions, preserving aspect ratio
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width  = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Use JPEG for photos; fall back to PNG for transparent images
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mimeType, quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─────────────────────────────────────────────────────────────
// IMAGE CAROUSEL (used in detail modal)
// ─────────────────────────────────────────────────────────────
function ImageCarousel({ images, className }) {
  const [current, setCurrent] = useState(0)
  if (!images || images.length === 0) return null

  const prev = (e) => {
    e.stopPropagation()
    setCurrent(i => (i === 0 ? images.length - 1 : i - 1))
  }
  const next = (e) => {
    e.stopPropagation()
    setCurrent(i => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className={styles.carousel}>
      <img
        src={images[current]}
        alt={`Design reference ${current + 1}`}
        className={className || styles.carouselImg}
      />

      {images.length > 1 && (
        <>
          <button className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`} onClick={prev} type="button">
            <span className="mi">chevron_left</span>
          </button>
          <button className={`${styles.carouselArrow} ${styles.carouselArrowRight}`} onClick={next} type="button">
            <span className="mi">chevron_right</span>
          </button>

          {/* Pagination dots */}
          <div className={styles.carouselDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.carouselDot} ${i === current ? styles.carouselDotActive : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MULTI-IMAGE UPLOAD SECTION (inside form card)
// ─────────────────────────────────────────────────────────────
function MultiImageUpload({ images, onChange, cardId }) {
  const [previewIdx, setPreviewIdx] = useState(0)
  const inputRef = useRef(null)

  // Keep previewIdx in bounds
  useEffect(() => {
    if (previewIdx >= images.length && images.length > 0) {
      setPreviewIdx(images.length - 1)
    }
  }, [images.length, previewIdx])

  const handleFiles = async (files) => {
    const fileArr = Array.from(files)
    const compressed = await Promise.all(fileArr.map(f => compressImage(f)))
    onChange([...images, ...compressed])
    // Jump to last newly added
    setPreviewIdx(images.length + compressed.length - 1)
  }

  const removeImage = (e, idx) => {
    e.stopPropagation()
    const updated = images.filter((_, i) => i !== idx)
    onChange(updated)
    setPreviewIdx(Math.max(0, idx - 1))
  }

  const prev = (e) => { e.stopPropagation(); setPreviewIdx(i => Math.max(0, i - 1)) }
  const next = (e) => { e.stopPropagation(); setPreviewIdx(i => Math.min(images.length - 1, i + 1)) }

  return (
    <div className={styles.multiUploadWrap}>
      {images.length === 0 ? (
        /* Empty upload area */
        <label className={styles.designUploadArea} htmlFor={`upload-${cardId}`}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)', pointerEvents: 'none' }}>add_a_photo</span>
          <span className={styles.uploadLabel}>Tap to upload design references</span>
          <input
            id={`upload-${cardId}`}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => e.target.files.length && handleFiles(e.target.files)}
          />
        </label>
      ) : (
        /* Preview carousel */
        <div className={styles.uploadCarousel}>
          <img
            src={images[previewIdx]}
            alt={`Preview ${previewIdx + 1}`}
            className={styles.uploadPreviewImg}
          />

          {/* Remove current image */}
          <button
            type="button"
            className={styles.uploadRemoveBtn}
            onClick={e => removeImage(e, previewIdx)}
          >
            <span className="mi" style={{ fontSize: '1rem' }}>close</span>
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
                onClick={prev}
              >
                <span className="mi">chevron_left</span>
              </button>
              <button
                type="button"
                className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                onClick={next}
              >
                <span className="mi">chevron_right</span>
              </button>
            </>
          )}

          {/* Dots */}
          <div className={styles.carouselDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.carouselDot} ${i === previewIdx ? styles.carouselDotActive : ''}`}
                onClick={e => { e.stopPropagation(); setPreviewIdx(i) }}
              />
            ))}
          </div>

          {/* Counter badge */}
          <div className={styles.uploadCounter}>{previewIdx + 1} / {images.length}</div>
        </div>
      )}

      {/* Add more button (when images already exist) */}
      {images.length > 0 && (
        <label className={styles.addMoreImgBtn} htmlFor={`upload-more-${cardId}`}>
          <span className="mi" style={{ fontSize: '0.9rem' }}>add_photo_alternate</span>
          Add More Images
          <input
            id={`upload-more-${cardId}`}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => e.target.files.length && handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FRESH CARD FACTORY
// imgSrcs is now an array instead of a single imgSrc
// ─────────────────────────────────────────────────────────────
function freshCard(n) {
  return {
    id:      Date.now() + Math.random(),
    label:   `Cloth Type ${n}`,
    name:    '',
    imgSrcs: [],          // ← array of base64 strings
    fields:  [{ id: Date.now() + Math.random(), name: '', value: '' }],
  }
}

// ─────────────────────────────────────────────────────────────
// MEASURE MODAL
// ─────────────────────────────────────────────────────────────
function MeasureModal({ isOpen, onClose, onSave }) {
  const [unit,  setUnit]  = useState('in')
  const [cards, setCards] = useState(() => [freshCard(1)])

  const updateCard = (cardId, key, val) =>
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, [key]: val } : c))

  const addField = (cardId) =>
    setCards(prev => prev.map(c => c.id === cardId
      ? { ...c, fields: [...c.fields, { id: Date.now() + Math.random(), name: '', value: '' }] }
      : c))

  const removeField = (cardId, fieldId) =>
    setCards(prev => prev.map(c => c.id === cardId
      ? { ...c, fields: c.fields.filter(f => f.id !== fieldId) }
      : c))

  const updateField = (cardId, fieldId, key, val) =>
    setCards(prev => prev.map(c => c.id === cardId
      ? { ...c, fields: c.fields.map(f => f.id === fieldId ? { ...f, [key]: val } : f) }
      : c))

  const addCard    = () => setCards(prev => [...prev, freshCard(prev.length + 1)])
  const removeCard = (cardId) => setCards(prev => prev.filter(c => c.id !== cardId))

  const handleSave = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    let added = 0
    cards.forEach(card => {
      if (!card.name.trim()) return
      const fields = card.fields.filter(f => f.name.trim()).map(f => ({ name: f.name, value: f.value }))

      // imgSrcs: array of compressed base64 strings
      // imgSrc (cover): first image for backwards-compat with orders
      onSave({
        id:      Date.now() + Math.random(),
        name:    card.name.trim(),
        imgSrcs: card.imgSrcs,
        imgSrc:  card.imgSrcs[0] ?? null,   // cover image
        unit,
        fields,
        date: today,
      })
      added++
    })
    if (added === 0) return
    setCards([freshCard(1)])
    setUnit('in')
    onClose()
  }

  const handleClose = () => {
    setCards([freshCard(1)])
    setUnit('in')
    onClose()
  }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <Header
        type="back"
        title="New Measurement"
        onBackClick={handleClose}
        customActions={[{ label: 'Save', onClick: handleSave }]}
      />

      {/* Unit selector */}
      <div className={styles.unitsSection}>
        {['in', 'cm', 'yd'].map(u => (
          <button
            key={u}
            className={`${styles.unitChip} ${unit === u ? styles.unitChipActive : ''}`}
            onClick={() => setUnit(u)}
          >
            {UNIT_FULL[u]}
          </button>
        ))}
      </div>

      <div className={styles.modalBody}>
        {cards.map((card, idx) => (
          <div key={card.id} className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <span className={styles.formCardLabel}>{card.label}</span>
              {idx > 0 && (
                <button
                  className="mi"
                  onClick={() => removeCard(card.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  cancel
                </button>
              )}
            </div>

            {/* Name */}
            <label className={styles.labelTiny}>Name</label>
            <input
              type="text"
              className={styles.clothInput}
              placeholder="e.g. Shirt"
              value={card.name}
              onChange={e => updateCard(card.id, 'name', e.target.value)}
            />

            {/* Multi-image upload */}
            <label className={styles.labelTiny}>Design References</label>
            <MultiImageUpload
              images={card.imgSrcs}
              cardId={card.id}
              onChange={(imgs) => updateCard(card.id, 'imgSrcs', imgs)}
            />

            {/* Measurements */}
            <label className={styles.labelTiny} style={{ marginTop: 20 }}>Measurements</label>
            <div className={styles.fieldList}>
              {card.fields.map(f => (
                <div key={f.id} className={styles.fieldRow}>
                  <div className={styles.fieldCol}>
                    <label>Field</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. Neck"
                      value={f.name}
                      onChange={e => updateField(card.id, f.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldCol}>
                    <label>Value</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      placeholder="0"
                      inputMode="decimal"
                      value={f.value}
                      onChange={e => updateField(card.id, f.id, 'value', e.target.value)}
                    />
                  </div>
                  <button className={styles.deleteBtn} onClick={() => removeField(card.id, f.id)}>
                    <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.addFieldBtn} onClick={() => addField(card.id)}>
              <span className="mi" style={{ fontSize: '0.9rem' }}>add</span> Add Field
            </button>
          </div>
        ))}

        <div className={styles.addClothBtnWrap}>
          <button className={styles.addClothBtn} onClick={addCard}>
            <span className="mi">add_circle_outline</span> Add Another Cloth Type
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MEASURE DETAIL (slides from right)
// ─────────────────────────────────────────────────────────────
function MeasureDetail({ measurement, onClose, onDelete }) {
  if (!measurement) return null
  const unitFull = UNIT_FULL[measurement.unit] ?? measurement.unit

  // Support both new imgSrcs[] and legacy imgSrc
  const images = measurement.imgSrcs?.length
    ? measurement.imgSrcs
    : measurement.imgSrc
      ? [measurement.imgSrc]
      : []

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <Header
        type="back"
        title={measurement.name}
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />
      <div className={styles.detailBody}>
        {/* Carousel of design reference images */}
        {images.length > 0 && (
          <ImageCarousel images={images} className={styles.detailDesign} />
        )}

        <div className={styles.detailUnit}>{unitFull}</div>
        {measurement.fields.length === 0
          ? <p style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>No fields recorded.</p>
          : measurement.fields.map((f, i) => (
              <div key={i} className={styles.measurementRow}>
                <span className={styles.measureLabel}>{f.name}</span>
                <span className={styles.measureValue}>{f.value || '—'}</span>
              </div>
            ))
        }
        <div className={styles.detailDate}>Saved on {measurement.date}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN TAB
// ─────────────────────────────────────────────────────────────
export default function MeasurementsTab({ measurements, onSave, onDelete, showToast }) {
  const [modalOpen,    setModalOpen]    = useState(false)
  const [detailItem,   setDetailItem]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openMeasureModal', handler)
    return () => document.removeEventListener('openMeasureModal', handler)
  }, [])

  const handleSave = (entry) => {
    onSave(entry)
    showToast('Measurement saved ✓')
  }

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return
    onDelete(confirmDelete.id)
    showToast('Measurement deleted')
    setConfirmDelete(null)
    setDetailItem(null)
  }

  // Group by date
  const grouped = measurements.reduce((acc, m) => {
    const key = m.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <>
      {measurements.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>straighten</span>
          <p>No measurements added yet.</p>
          <span className={styles.hint}>Tap + to add the first one</span>
        </div>
      )}

      {Object.entries(grouped).map(([date, dateItems]) => (
        <div key={date} className={styles.orderGroup}>
          <div className={styles.orderGroupDate}>{date}</div>
          <div className={styles.orderGroupDivider} />

          {dateItems.map((m, idx) => {
            const unitLabel  = UNIT_LABELS[m.unit] ?? m.unit
            const isLast     = idx === dateItems.length - 1

            // Cover image: first of imgSrcs, or legacy imgSrc
            const coverImg   = m.imgSrcs?.[0] ?? m.imgSrc ?? null

            // Extra images count (beyond cover)
            const extraCount = (m.imgSrcs?.length ?? (m.imgSrc ? 1 : 0)) - 1

            return (
              <div
                key={m.id}
                className={`${styles.orderListItem} ${isLast ? styles.orderListItemLast : ''}`}
                onClick={() => setDetailItem(m)}
              >
                {/* Thumbnail area */}
                <div className={styles.orderListOuter}>
                  <div className={styles.orderListInner} style={{ position: 'relative' }}>
                    {coverImg
                      ? <img src={coverImg} alt={m.name} className={styles.orderListThumbImg} />
                      : <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>straighten</span>
                    }
                    {/* +N views overlay on thumbnail */}
                    {extraCount > 0 && coverImg && (
                      <div className={styles.thumbViewsOverlay}>+{extraCount} view{extraCount !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className={styles.orderListInfo}>
                  <div className={styles.orderListDesc}>{m.name}</div>
                  <div className={styles.orderListOrdRow}>{m.date}</div>
                  <div className={styles.orderListOrdRow}>
                    {unitLabel} · {m.fields.length} field{m.fields.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Delete + chevron */}
                <div className={styles.cardActions}>
                  <button
                    className={styles.cardDelete}
                    onClick={e => { e.stopPropagation(); setConfirmDelete(m) }}
                  >
                    <span className="mi" style={{ fontSize: '1.2rem' }}>delete_outline</span>
                  </button>
                  <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <MeasureModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />

      {detailItem && (
        <MeasureDetail
          measurement={detailItem}
          onClose={() => setDetailItem(null)}
          onDelete={() => setConfirmDelete(detailItem)}
        />
      )}

      <ConfirmSheet
        open={!!confirmDelete}
        title="Delete Measurement?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}