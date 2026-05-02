// src/pages/CustomerDetail/tabs/MeasurementsTab.jsx

import { useState, useEffect, useRef } from 'react'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header       from '../../../../components/Header/Header'
import styles       from './MeasurementsTab.module.css'


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

// Short symbol shown in the list row (e.g. 14")
const UNIT_SHORT = { in: '"', cm: 'cm', yd: 'yd' }

// Full label shown in the detail panel
const UNIT_FULL  = { in: 'Inches (")', cm: 'Centimetres (cm)', yd: 'Yards (yd)' }


// ─────────────────────────────────────────────────────────────
// IMAGE COMPRESSION UTILITY
// Shrinks a photo before storing it to keep Firestore docs small
// ─────────────────────────────────────────────────────────────

function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.onload = (event) => {
      const img = new Image()

      img.onerror = () => reject(new Error('Failed to load image'))

      img.onload = () => {
        let { width, height } = img

        // Scale down if wider than maxWidth, keeping aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width  = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mimeType, quality))
      }

      img.src = event.target.result
    }

    reader.readAsDataURL(file)
  })
}


// ─────────────────────────────────────────────────────────────
// FULLSCREEN LIGHTBOX
// Opens when the user taps an image in the detail panel
// ─────────────────────────────────────────────────────────────

function ImageLightbox({ images, startIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const touchStartX = useRef(null)

  // Sync index if parent re-opens with a different starting image
  useEffect(() => { setCurrentIndex(startIndex) }, [startIndex])

  // Prevent page scrolling while lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function goPrev() {
    setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1))
  }

  function goNext() {
    setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1))
  }

  // Swipe left/right to navigate
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const swipeDistance = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(swipeDistance) > 40) {
      swipeDistance > 0 ? goNext() : goPrev()
    }
    touchStartX.current = null
  }

  if (!images || images.length === 0) return null

  return (
    <div
      className={styles.lightboxOverlay}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button className={styles.lightboxCloseButton} onClick={onClose} type="button">
        <span className="mi">close</span>
      </button>

      {/* "2 / 5" counter */}
      {images.length > 1 && (
        <div className={styles.lightboxCounter}>
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Current image */}
      <div className={styles.lightboxImageWrapper}>
        <img
          src={images[currentIndex]}
          alt={`Design reference ${currentIndex + 1}`}
          className={styles.lightboxImage}
        />
      </div>

      {/* Left / Right arrows + dot indicators */}
      {images.length > 1 && (
        <>
          <button
            className={`${styles.lightboxArrow} ${styles.lightboxArrow_left}`}
            onClick={goPrev}
            type="button"
          >
            <span className="mi">chevron_left</span>
          </button>

          <button
            className={`${styles.lightboxArrow} ${styles.lightboxArrow_right}`}
            onClick={goNext}
            type="button"
          >
            <span className="mi">chevron_right</span>
          </button>

          <div className={styles.lightboxDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.lightboxDot} ${i === currentIndex ? styles.lightboxDot_active : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// IMAGE CAROUSEL
// Used inside the detail panel — tap image to open lightbox
// ─────────────────────────────────────────────────────────────

function ImageCarousel({ images, className, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  function goPrev(e) {
    e.stopPropagation()
    setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1))
  }

  function goNext(e) {
    e.stopPropagation()
    setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className={styles.carousel}>
      {/* Main image — tappable if onImageClick is provided */}
      <img
        src={images[currentIndex]}
        alt={`Design reference ${currentIndex + 1}`}
        className={`${className || styles.carouselImage} ${onImageClick ? styles.carouselImage_zoomable : ''}`}
        onClick={() => onImageClick && onImageClick(currentIndex)}
      />

      {/* Small "expand" hint badge in the corner */}
      {onImageClick && (
        <div className={styles.carouselExpandHint}>
          <span className="mi" style={{ fontSize: '0.85rem' }}>open_in_full</span>
        </div>
      )}

      {/* Arrows + dots when there are multiple images */}
      {images.length > 1 && (
        <>
          <button
            className={`${styles.carouselArrow} ${styles.carouselArrow_left}`}
            onClick={goPrev}
            type="button"
          >
            <span className="mi">chevron_left</span>
          </button>

          <button
            className={`${styles.carouselArrow} ${styles.carouselArrow_right}`}
            onClick={goNext}
            type="button"
          >
            <span className="mi">chevron_right</span>
          </button>

          <div className={styles.carouselDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.carouselDot} ${i === currentIndex ? styles.carouselDot_active : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i) }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MULTI-IMAGE UPLOAD
// Lets the user pick multiple reference photos for a cloth type
// ─────────────────────────────────────────────────────────────

function MultiImageUpload({ images, onChange, cardId }) {
  const [previewIndex, setPreviewIndex] = useState(0)

  // If images are removed and previewIndex is out of range, clamp it
  useEffect(() => {
    if (previewIndex >= images.length && images.length > 0) {
      setPreviewIndex(images.length - 1)
    }
  }, [images.length, previewIndex])

  // Compress and add new images to the list
  async function handleFilePick(files) {
    const fileArray    = Array.from(files)
    const compressed   = await Promise.all(fileArray.map(f => compressImage(f)))
    onChange([...images, ...compressed])
    setPreviewIndex(images.length + compressed.length - 1)
  }

  // Remove the currently previewed image
  function removeCurrentImage(e) {
    e.stopPropagation()
    const updated = images.filter((_, i) => i !== previewIndex)
    onChange(updated)
    setPreviewIndex(Math.max(0, previewIndex - 1))
  }

  function goPrev(e) {
    e.stopPropagation()
    setPreviewIndex(i => Math.max(0, i - 1))
  }

  function goNext(e) {
    e.stopPropagation()
    setPreviewIndex(i => Math.min(images.length - 1, i + 1))
  }

  // ── Empty state: show upload area ──
  if (images.length === 0) {
    return (
      <div className={styles.uploadArea_wrapper}>
        <label className={styles.uploadArea_empty} htmlFor={`upload-${cardId}`}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)', pointerEvents: 'none' }}>
            add_a_photo
          </span>
          <span className={styles.uploadArea_label}>Tap to upload design references</span>
          <input
            id={`upload-${cardId}`}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => e.target.files.length && handleFilePick(e.target.files)}
          />
        </label>
      </div>
    )
  }

  // ── Has images: show carousel with remove button ──
  return (
    <div className={styles.uploadArea_wrapper}>
      <div className={styles.uploadCarousel}>
        <img
          src={images[previewIndex]}
          alt={`Preview ${previewIndex + 1}`}
          className={styles.uploadCarouselImage}
        />

        {/* Remove current image button */}
        <button
          type="button"
          className={styles.uploadRemoveButton}
          onClick={removeCurrentImage}
        >
          <span className="mi" style={{ fontSize: '1rem' }}>close</span>
        </button>

        {/* Nav arrows for multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrow_left}`}
              onClick={goPrev}
            >
              <span className="mi">chevron_left</span>
            </button>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrow_right}`}
              onClick={goNext}
            >
              <span className="mi">chevron_right</span>
            </button>
          </>
        )}

        {/* Dot indicators */}
        <div className={styles.carouselDots}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.carouselDot} ${i === previewIndex ? styles.carouselDot_active : ''}`}
              onClick={e => { e.stopPropagation(); setPreviewIndex(i) }}
            />
          ))}
        </div>

        {/* "1 / 3" counter */}
        <div className={styles.uploadCarouselCounter}>
          {previewIndex + 1} / {images.length}
        </div>
      </div>

      {/* "Add More Images" button below the carousel */}
      <label className={styles.addMoreImagesButton} htmlFor={`upload-more-${cardId}`}>
        <span className="mi" style={{ fontSize: '0.9rem' }}>add_photo_alternate</span>
        Add More Images
        <input
          id={`upload-more-${cardId}`}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => e.target.files.length && handleFilePick(e.target.files)}
        />
      </label>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// FRESH CARD FACTORY
// Returns a blank cloth-type card object for the form
// ─────────────────────────────────────────────────────────────

function createBlankCard(cardNumber) {
  return {
    id:      Date.now() + Math.random(),
    label:   `Cloth Type ${cardNumber}`,
    name:    '',
    imgSrcs: [],
    fields:  [{ id: Date.now() + Math.random(), name: '', value: '' }],
  }
}


// ─────────────────────────────────────────────────────────────
// MEASURE MODAL
// Slide-up form for adding new measurements
// ─────────────────────────────────────────────────────────────

function MeasureModal({ isOpen, onClose, onSave }) {
  const [unit,  setUnit]  = useState('in')
  const [cards, setCards] = useState(() => [createBlankCard(1)])

  // ── Card-level updates ──

  function updateCard(cardId, key, value) {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, [key]: value } : card
    ))
  }

  function addCard() {
    setCards(prev => [...prev, createBlankCard(prev.length + 1)])
  }

  function removeCard(cardId) {
    setCards(prev => prev.filter(card => card.id !== cardId))
  }

  // ── Field-level updates (measurement rows inside a card) ──

  function addField(cardId) {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, fields: [...card.fields, { id: Date.now() + Math.random(), name: '', value: '' }] }
        : card
    ))
  }

  function removeField(cardId, fieldId) {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, fields: card.fields.filter(f => f.id !== fieldId) }
        : card
    ))
  }

  function updateField(cardId, fieldId, key, value) {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, fields: card.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f) }
        : card
    ))
  }

  // ── Save all cards that have a name filled in ──

  function handleSave() {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    })

    let savedCount = 0

    cards.forEach(card => {
      if (!card.name.trim()) return  // skip blank cards

      const filledFields = card.fields
        .filter(f => f.name.trim())
        .map(f => ({ name: f.name, value: f.value }))

      onSave({
        id:      Date.now() + Math.random(),
        name:    card.name.trim(),
        imgSrcs: card.imgSrcs,
        imgSrc:  card.imgSrcs[0] ?? null,
        unit,
        fields:  filledFields,
        date:    today,
      })

      savedCount++
    })

    if (savedCount === 0) return

    // Reset form
    setCards([createBlankCard(1)])
    setUnit('in')
    onClose()
  }

  function handleClose() {
    setCards([createBlankCard(1)])
    setUnit('in')
    onClose()
  }

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlay_open : ''}`}>
      <Header
        type="back"
        title="New Measurement"
        onBackClick={handleClose}
        customActions={[{ label: 'Save', onClick: handleSave }]}
      />

      {/* Unit selector bar — sticky below the header */}
      <div className={styles.unitSelectorBar}>
        {['in', 'cm', 'yd'].map(u => (
          <button
            key={u}
            className={`${styles.unitChip} ${unit === u ? styles.unitChip_active : ''}`}
            onClick={() => setUnit(u)}
          >
            {UNIT_FULL[u]}
          </button>
        ))}
      </div>

      {/* Scrollable form body */}
      <div className={styles.formScrollBody}>

        {/* One card per cloth type */}
        {cards.map((card, index) => (
          <div key={card.id} className={styles.clothCard}>

            {/* Card header: label + remove button */}
            <div className={styles.clothCardHeader}>
              <span className={styles.clothCardLabel}>{card.label}</span>
              {index > 0 && (
                <button
                  className="mi"
                  onClick={() => removeCard(card.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  cancel
                </button>
              )}
            </div>

            {/* Cloth name */}
            <label className={styles.fieldLabel}>Name</label>
            <input
              type="text"
              className={styles.underlineInput}
              placeholder="e.g. Shirt"
              value={card.name}
              onChange={e => updateCard(card.id, 'name', e.target.value)}
            />

            {/* Design reference images */}
            <label className={styles.fieldLabel}>Design References</label>
            <MultiImageUpload
              images={card.imgSrcs}
              cardId={card.id}
              onChange={imgs => updateCard(card.id, 'imgSrcs', imgs)}
            />

            {/* Measurement fields */}
            <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Measurements</label>
            <div className={styles.measureFieldList}>
              {card.fields.map(field => (
                <div key={field.id} className={styles.measureFieldRow}>

                  {/* Field name */}
                  <div className={styles.measureFieldColumn}>
                    <label>Field</label>
                    <input
                      type="text"
                      className={styles.measureFieldInput}
                      placeholder="e.g. Neck"
                      value={field.name}
                      onChange={e => updateField(card.id, field.id, 'name', e.target.value)}
                    />
                  </div>

                  {/* Field value */}
                  <div className={styles.measureFieldColumn}>
                    <label>Value</label>
                    <input
                      type="number"
                      className={styles.measureFieldInput}
                      placeholder="0"
                      inputMode="decimal"
                      value={field.value}
                      onChange={e => updateField(card.id, field.id, 'value', e.target.value)}
                    />
                  </div>

                  {/* Remove field button */}
                  <button
                    className={styles.removeFieldButton}
                    onClick={() => removeField(card.id, field.id)}
                  >
                    <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
                  </button>
                </div>
              ))}
            </div>

            <button className={styles.addFieldButton} onClick={() => addField(card.id)}>
              <span className="mi" style={{ fontSize: '0.9rem' }}>add</span> Add Field
            </button>
          </div>
        ))}

        {/* Add another cloth type */}
        <div className={styles.addClothButtonWrapper}>
          <button className={styles.addClothButton} onClick={addCard}>
            <span className="mi">add_circle_outline</span> Add Another Cloth Type
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MEASURE DETAIL PANEL
// Slides in from the right when a measurement row is tapped
// ─────────────────────────────────────────────────────────────

function MeasureDetail({ measurement, onClose, onDelete }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!measurement) return null

  const unitLabel = UNIT_FULL[measurement.unit] ?? measurement.unit

  // Support both old single-image (imgSrc) and new multi-image (imgSrcs) format
  const images = measurement.imgSrcs?.length
    ? measurement.imgSrcs
    : measurement.imgSrc
      ? [measurement.imgSrc]
      : []

  return (
    <>
      <div className={`${styles.detailPanel} ${styles.detailPanel_open}`}>
        <Header
          type="back"
          title={measurement.name}
          onBackClick={onClose}
          customActions={[
            { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
          ]}
        />

        <div className={styles.detailScrollBody}>

          {/* Image carousel — tap to open fullscreen lightbox */}
          {images.length > 0 && (
            <ImageCarousel
              images={images}
              className={styles.detailCarouselImage}
              onImageClick={(index) => setLightboxIndex(index)}
            />
          )}

          {/* Unit label (e.g. "Inches (")") */}
          <div className={styles.detailUnitLabel}>{unitLabel}</div>

          {/* Measurement fields list */}
          {measurement.fields.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>No fields recorded.</p>
            : measurement.fields.map((field, index) => (
                <div key={index} className={styles.measurementFieldRow}>
                  <span className={styles.measurementFieldName}>{field.name}</span>
                  <span className={styles.measurementFieldValue}>{field.value || '—'}</span>
                </div>
              ))
          }

          {/* Saved date */}
          <div className={styles.detailFooterDate}>Saved on {measurement.date}</div>
        </div>
      </div>

      {/* Fullscreen lightbox — rendered on top of the detail panel */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}


// ─────────────────────────────────────────────────────────────
// MAIN MEASUREMENTS TAB
// ─────────────────────────────────────────────────────────────

export default function MeasurementsTab({ measurements, onSave, onDelete, showToast }) {
  const [isModalOpen,       setIsModalOpen]       = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState(null)
  const [measurementToDelete, setMeasurementToDelete] = useState(null)

  // Allow other parts of the app to open the modal via a custom event
  useEffect(() => {
    const openModal = () => setIsModalOpen(true)
    document.addEventListener('openMeasureModal', openModal)
    return () => document.removeEventListener('openMeasureModal', openModal)
  }, [])

  function handleSave(entry) {
    onSave(entry)
    showToast('Measurement saved ✓')
  }

  function handleDeleteConfirm() {
    if (!measurementToDelete) return
    onDelete(measurementToDelete.id)
    showToast('Measurement deleted')
    setMeasurementToDelete(null)
    setSelectedMeasurement(null)
  }

  // Group measurements by the date they were saved
  const measurementsByDate = measurements.reduce((groups, measurement) => {
    const dateKey = measurement.date || 'Unknown Date'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(measurement)
    return groups
  }, {})

  return (
    <>
      {/* Empty state */}
      {measurements.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>straighten</span>
          <p>No measurements added yet.</p>
          <span className={styles.emptyStateHint}>Tap + to add the first one</span>
        </div>
      )}

      {/* Measurements grouped by date */}
      {Object.entries(measurementsByDate).map(([date, measurementsInGroup]) => (
        <div key={date} className={styles.measurementGroup}>
          <div className={styles.measurementGroupDate}>{date}</div>
          <div className={styles.measurementGroupDivider} />

          {measurementsInGroup.map((measurement, index) => {
            const unitShort     = UNIT_SHORT[measurement.unit] ?? measurement.unit
            const isLastInGroup = index === measurementsInGroup.length - 1
            const coverImage    = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null
            const extraCount    = (measurement.imgSrcs?.length ?? (measurement.imgSrc ? 1 : 0)) - 1

            return (
              <div
                key={measurement.id}
                className={`${styles.measurementRow} ${isLastInGroup ? styles.measurementRow_last : ''}`}
                onClick={() => setSelectedMeasurement(measurement)}
              >
                {/* Thumbnail box */}
                <div className={styles.thumbnailContainer}>
                  <div className={styles.thumbnailBox}>
                    {coverImage
                      ? <img src={coverImage} alt={measurement.name} className={styles.thumbnailImage} />
                      : <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>straighten</span>
                    }
                    {/* "+N views" overlay when there are more images */}
                    {extraCount > 0 && coverImage && (
                      <div className={styles.thumbnailExtraOverlay}>
                        +{extraCount} view{extraCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name, date, unit + field count */}
                <div className={styles.measurementRowInfo}>
                  <div className={styles.measurementRowName}>{measurement.name}</div>
             
                  <div className={styles.measurementRowMeta}>
                    {measurement.fields.length} measurement{measurement.fields.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Delete + chevron */}
                <div className={styles.measurementRowActions}>
                  <button
                    className={styles.deleteButton}
                    onClick={e => { e.stopPropagation(); setMeasurementToDelete(measurement) }}
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

      {/* New measurement modal */}
      <MeasureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Measurement detail panel */}
      {selectedMeasurement && (
        <MeasureDetail
          measurement={selectedMeasurement}
          onClose={() => setSelectedMeasurement(null)}
          onDelete={() => setMeasurementToDelete(selectedMeasurement)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmSheet
        open={!!measurementToDelete}
        title="Delete Measurement?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMeasurementToDelete(null)}
      />
    </>
  )
}