// src/pages/CustomerBodyMeasurements/CustomerBodyMeasurements.jsx

import { useRef, useState, useEffect } from 'react'
import { useParams }                    from 'react-router-dom'
import { useCustomers }                 from '../../contexts/CustomerContext'
import Header                           from '../../components/Header/Header'
import styles                           from './CustomerBodyMeasurements.module.css'

// ── Male measurement image imports ────────────────────────────
import aboveKneeMaleImg           from '../../assets/aboveKneeMale.jpg'
import ankleMaleImg               from '../../assets/ankleMale.jpg'
import armHoleMaleImg             from '../../assets/armHoleMale.jpg'
import armLengthMaleImg           from '../../assets/armLengthMale.jpg'
import belowKneeMaleImg           from '../../assets/belowKneeMale.jpg'
import bicepsMaleImg              from '../../assets/bicepsMale.jpg'
import calfMaleImg                from '../../assets/calfMale.jpg'
import calfToAnkleMaleImg         from '../../assets/calfToAnkleMale.jpg'
import chestMaleImg               from '../../assets/chestMale.jpg'
import coatSleeveLengthMaleImg    from '../../assets/coatSleeveLengthMale.jpg'
import coatWaistMaleImg           from '../../assets/coatWaistMale.jpg'
import crossBackMaleImg           from '../../assets/crossBackMale.jpg'
import crotchMaleImg              from '../../assets/crotchMale.jpg'
import crotchToKneeMaleImg        from '../../assets/crotchToKneeMale.jpg'
import flyMaleImg                 from '../../assets/flyMale.jpg'
import halfShoulderMaleImg        from '../../assets/halfShoulderMale.jpg'
import hipMaleImg                 from '../../assets/hipMale.jpg'
import inseamMaleImg              from '../../assets/inseamMale.jpg'
import jacketLengthMaleImg        from '../../assets/jacketLengthMale.jpg'
import kneeToCalfMaleImg          from '../../assets/kneeToCalfMale.jpg'
import neckMaleImg                from '../../assets/neckMale.jpg'
import pantsLengthMaleImg         from '../../assets/pantsLengthMale.jpg'
import seatMaleImg                from '../../assets/seatMale.jpg'
import shirtLengthMaleImg         from '../../assets/shirtLengthMale.jpg'
import shortsLengthMaleImg        from '../../assets/shortsLengthMale.jpg'
import shoulderWidthMaleImg       from '../../assets/shoulderWidthMale.jpg'
import sleeveLengthForSuitMaleImg from '../../assets/sleeveLengthForSuitMale.jpg'
import sleeveLengthMaleImg        from '../../assets/sleeveLengthMale.jpg'
import thighsMaleImg              from '../../assets/thighsMale.jpg'
import waistMaleImg               from '../../assets/waistMale.jpg'
import waistToAnkleMaleImg        from '../../assets/waistToAnkleMale.jpg'
import wristMaleImg               from '../../assets/wristMale.jpg'

// ── Female measurement image imports ──────────────────────────
import neckFemaleImg          from '../../assets/female/neckFemale.jpg'
import backNeckDepthFemaleImg from '../../assets/female/backNeckDepthFemale.jpg'
import shoulderFemaleImg      from '../../assets/female/shoulderFemale.jpg'
import halfShoulderFemaleImg  from '../../assets/female/halfShoulderFemale.jpg'
import frontShoulderFemaleImg from '../../assets/female/frontShoulderFemale.jpg'
import backShoulderFemaleImg  from '../../assets/female/backShoulderFemale.jpg'
import upperChestFemaleImg    from '../../assets/female/upperChestFemale.jpg'
import bustFemaleImg          from '../../assets/female/bustFemale.jpg'
import chestFemaleImg         from '../../assets/female/chestFemale.jpg'
import blouseChestFemaleImg   from '../../assets/female/blouseChestFemale.jpg'
import blouseBelowBustFemaleImg from '../../assets/female/blouseBelowBust.jpg'
import stomachFemaleImg       from '../../assets/female/stomachFemale.jpg'
import waistFemaleImg         from '../../assets/female/waistFemale.jpg'
import blouseLengthFemaleImg  from '../../assets/female/blouseLengthFemale.jpg'
import shirtLengthFemaleImg   from '../../assets/female/shirtLengthFemale.jpg'
import hipFemaleImg           from '../../assets/female/hipFemale.jpg'
import fullHeightFemaleImg    from '../../assets/female/fullHeightFemale.jpg'
import kurthiHeightFemaleImg  from '../../assets/female/kurthiHeightFemale.jpg'
import fullSleeveLengthFemaleImg from '../../assets/female/fullSleeveLengthFemale.jpg'

// ── Measurement definitions ───────────────────────────────────
// NOTE: Only update MALE_MEASUREMENT_IMAGES and MALE_MEASUREMENTS when new images are added.

// ── Male measurements ordered top → middle → lower body ──────
const MALE_MEASUREMENTS = [
  // ── Upper body (neck down to wrist) ──
  'Neck', 'Shoulder Width', 'Half Shoulder', 'Chest', 'Cross Back',
  'Arm Hole', 'Biceps', 'Arm Length', 'Sleeve Length', 'Coat Sleeve', 'Wrist',
  'Shirt Length', 'Jacket Length',
  // ── Mid body (waist, core, outerwear waist) ──
  'Waist', 'Hip', 'Seat', 'Coat Waist',
  'Crotch', 'Fly', 'Inseam',
  // ── Lower body (legs to feet) ──
  'Thighs', 'Crotch To Knee', 'Above Knee', 'Below Knee',
  'Knee To Calf', 'Calf', 'Calf To Ankle', 'Ankle',
  'Waist To Ankle', 'Pants Length', 'Shorts Length',
]

const MALE_MEASUREMENT_IMAGES = {
  // ── Upper body ──
  'Neck':           neckMaleImg,
  'Shoulder Width': shoulderWidthMaleImg,
  'Half Shoulder':  halfShoulderMaleImg,
  'Chest':          chestMaleImg,
  'Cross Back':     crossBackMaleImg,
  'Arm Hole':       armHoleMaleImg,
  'Biceps':         bicepsMaleImg,
  'Arm Length':     armLengthMaleImg,
  'Sleeve Length':  sleeveLengthMaleImg,
  'Coat Sleeve':    sleeveLengthForSuitMaleImg,
  'Wrist':          wristMaleImg,
  'Shirt Length':   shirtLengthMaleImg,
  'Jacket Length':  jacketLengthMaleImg,
  // ── Mid body ──
  'Waist':          waistMaleImg,
  'Hip':            hipMaleImg,
  'Seat':           seatMaleImg,
  'Coat Waist':     coatWaistMaleImg,
  'Crotch':         crotchMaleImg,
  'Fly':            flyMaleImg,
  'Inseam':         inseamMaleImg,
  // ── Lower body ──
  'Thighs':         thighsMaleImg,
  'Crotch To Knee': crotchToKneeMaleImg,
  'Above Knee':     aboveKneeMaleImg,
  'Below Knee':     belowKneeMaleImg,
  'Knee To Calf':   kneeToCalfMaleImg,
  'Calf':           calfMaleImg,
  'Calf To Ankle':  calfToAnkleMaleImg,
  'Ankle':          ankleMaleImg,
  'Waist To Ankle': waistToAnkleMaleImg,
  'Pants Length':   pantsLengthMaleImg,
  'Shorts Length':  shortsLengthMaleImg,
}

// ── Female measurements ordered top → middle → lower body ────
const FEMALE_MEASUREMENTS = [
  // ── Upper body ──
  'Neck', 'Back Neck Depth', 'Shoulder', 'Half Shoulder', 'Front Shoulder', 'Back Shoulder',
  'Upper Chest', 'Bust', 'Chest', 'Blouse Chest', 'Blouse Below Bust',
  // ── Mid body ──
  'Stomach', 'Waist', 'Blouse Length', 'Shirt Length',
  // ── Lower body ──
  'Hip', 'Full Height', 'Kurthi Height', 'Full Sleeve Length',
]

const FEMALE_MEASUREMENT_IMAGES = {
  // ── Upper body ──
  'Neck':              neckFemaleImg,
  'Back Neck Depth':   backNeckDepthFemaleImg,
  'Shoulder':          shoulderFemaleImg,
  'Half Shoulder':     halfShoulderFemaleImg,
  'Front Shoulder':    frontShoulderFemaleImg,
  'Back Shoulder':     backShoulderFemaleImg,
  'Upper Chest':       upperChestFemaleImg,
  'Bust':              bustFemaleImg,
  'Chest':             chestFemaleImg,
  'Blouse Chest':      blouseChestFemaleImg,
  'Blouse Below Bust': blouseBelowBustFemaleImg,
  // ── Mid body ──
  'Stomach':           stomachFemaleImg,
  'Waist':             waistFemaleImg,
  'Blouse Length':     blouseLengthFemaleImg,
  'Shirt Length':      shirtLengthFemaleImg,
  // ── Lower body ──
  'Hip':               hipFemaleImg,
  'Full Height':       fullHeightFemaleImg,
  'Kurthi Height':     kurthiHeightFemaleImg,
  'Full Sleeve Length': fullSleeveLengthFemaleImg,
}

// ── Load image as base64 AND return its natural dimensions ────
// This lets us do proper aspect-ratio fitting in the PDF cell
// instead of blindly stretching to a fixed square.
async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve({
        b64:    canvas.toDataURL('image/jpeg', 0.85),
        width:  img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ── Fit dimensions into a box while preserving aspect ratio ──
// Equivalent to CSS object-fit: contain.
function fitInBox(imgW, imgH, boxW, boxH) {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  return {
    w: imgW * scale,
    h: imgH * scale,
  }
}

// ── PDF export ────────────────────────────────────────────────
async function exportPDF(customer, allEntries, imgMap) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload  = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const PAGE_W    = 210
  const PAGE_H    = 297
  const MARGIN    = 14
  const CONTENT_W = PAGE_W - MARGIN * 2
  const COL_COUNT = 2
  const GAP       = 5
  const COL_W     = (CONTENT_W - GAP) / COL_COUNT
  const ROW_H     = 28      // card height
  const IMG_BOX   = 22      // square box reserved for the image (contain inside it)
  const CARD_PAD  = 4

  // ── Header band ──
  doc.setFillColor(18, 18, 18)
  doc.rect(0, 0, PAGE_W, 24, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(customer.name + (customer.sex ? `  (${customer.sex})` : ''), MARGIN, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(170, 170, 170)
  doc.text('FULL BODY MEASUREMENTS  ·  INCHES', MARGIN, 20)
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  doc.text(dateStr, PAGE_W - MARGIN, 20, { align: 'right' })

  let y = 30

  for (let i = 0; i < allEntries.length; i++) {
    const { field, value } = allEntries[i]
    const col = i % COL_COUNT

    // Page break at the start of a new row
    if (col === 0 && i > 0 && y + ROW_H > PAGE_H - 14) {
      doc.addPage()
      y = 14
    }

    const cardX = MARGIN + col * (COL_W + GAP)
    const cardY = y

    // Card background + border
    doc.setFillColor(247, 247, 247)
    doc.setDrawColor(218, 218, 218)
    doc.setLineWidth(0.3)
    doc.roundedRect(cardX, cardY, COL_W, ROW_H, 2.5, 2.5, 'FD')

    // Image — load with natural dimensions, then fit into IMG_BOX × IMG_BOX
    const imgSrc = imgMap[field] || null
    if (imgSrc) {
      const result = await loadImage(imgSrc)
      if (result) {
        try {
          const { w, h } = fitInBox(result.width, result.height, IMG_BOX, IMG_BOX)
          // Center the fitted image within the reserved IMG_BOX area
          const imgAreaX = cardX + CARD_PAD
          const imgAreaY = cardY + (ROW_H - IMG_BOX) / 2
          const imgX = imgAreaX + (IMG_BOX - w) / 2
          const imgY = imgAreaY + (IMG_BOX - h) / 2
          doc.addImage(result.b64, 'JPEG', imgX, imgY, w, h)
        } catch (_) { /* skip broken image */ }
      }
    }

    // Text starts after the image area (or at card edge if no image)
    const textX    = imgSrc ? cardX + CARD_PAD + IMG_BOX + 4 : cardX + CARD_PAD
    const maxTextW = COL_W - (imgSrc ? CARD_PAD + IMG_BOX + 4 + CARD_PAD : CARD_PAD * 2)

    // Field label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(130, 130, 130)
    doc.text(field.toUpperCase(), textX, cardY + ROW_H / 2 - 2.5, { maxWidth: maxTextW })

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(18, 18, 18)
    doc.text(`${value}"`, textX, cardY + ROW_H / 2 + 6, { maxWidth: maxTextW })

    // Advance row after the second column (or last item)
    if (col === COL_COUNT - 1 || i === allEntries.length - 1) {
      y += ROW_H + 4
    }
  }

  // ── Footer on every page ──
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 180)
    doc.text('Generated by TailorFlow', MARGIN, PAGE_H - 6)
    doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' })
  }

  doc.save(`${customer.name.replace(/\s+/g, '_')}_measurements.pdf`)
}

// ── Edit Measurements Modal ───────────────────────────────────
function EditMeasurementsModal({ isOpen, customer, onClose, onSave }) {
  const sex           = customer?.sex || ''
  const measureFields = sex === 'Female' ? FEMALE_MEASUREMENTS : MALE_MEASUREMENTS
  const imgMap        = sex === 'Female' ? FEMALE_MEASUREMENT_IMAGES : MALE_MEASUREMENT_IMAGES
  const knownSet      = new Set(measureFields)

  const [draft,        setDraft]        = useState({})
  const [customFields, setCustomFields] = useState([])
  const [saving,       setSaving]       = useState(false)

  // Pre-fill standard fields + restore any previously saved custom fields
  useEffect(() => {
    if (!isOpen || !customer) return
    const saved = customer.bodyMeasurements || {}
    const standardDraft = {}
    measureFields.forEach(f => {
      if (saved[f] !== undefined) standardDraft[f] = saved[f]
    })
    setDraft(standardDraft)
    const existing = Object.entries(saved)
      .filter(([k]) => !knownSet.has(k))
      .map(([k, v]) => ({ id: Date.now() + Math.random(), label: k, value: String(v) }))
    setCustomFields(existing)
  }, [isOpen, customer]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateDraft = (field, val) =>
    setDraft(prev => ({ ...prev, [field]: val }))

  const addCustomField = () =>
    setCustomFields(prev => [...prev, { id: Date.now(), label: '', value: '' }])

  const updateCustomField = (id, key, val) =>
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))

  const removeCustomField = (id) =>
    setCustomFields(prev => prev.filter(f => f.id !== id))

  const handleSave = async () => {
    const merged = { ...draft }
    customFields.forEach(f => {
      if (f.label.trim()) merged[f.label.trim()] = f.value
    })
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== '' && v !== undefined)
    )
    setSaving(true)
    try {
      await onSave(cleaned)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!customer) return null

  return (
    <>
      <div className={`${styles.editOverlay} ${isOpen ? styles.editOverlayOpen : ''}`}>

        <div className={styles.editHeader}>
          <button className={styles.editCloseBtn} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.3rem' }}>close</span>
          </button>
          <span className={styles.editHeaderTitle}>Edit Measurements</span>
          <button className={styles.editSaveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className={styles.editSubheader}>
          {sex ? `${sex} body measurements (inches)` : 'Body measurements (inches)'}
        </div>

        <div className={styles.editBody}>
          {measureFields.map((field, idx) => {
            const imgSrc = imgMap[field] || null
            const isLastImgField = imgSrc &&
              !measureFields.slice(idx + 1).some(f => imgMap[f])

            if (imgSrc) {
              return (
                <div
                  key={field}
                  className={`${styles.editImgRow} ${isLastImgField ? styles.editImgRowLast : ''}`}
                >
                  <img src={imgSrc} alt={field} className={styles.editMeasureImg} />
                  <div className={styles.editImgRight}>
                    <label className={styles.editLabel}>{field}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      className={styles.editInput}
                      placeholder="0"
                      value={draft[field] || ''}
                      onChange={e => updateDraft(field, e.target.value)}
                    />
                  </div>
                </div>
              )
            }

            return (
              <div key={field} className={styles.editTextRow}>
                <label className={styles.editLabel}>{field}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className={styles.editInput}
                  placeholder="0"
                  value={draft[field] || ''}
                  onChange={e => updateDraft(field, e.target.value)}
                />
              </div>
            )
          })}

          {customFields.map(f => (
            <div key={f.id} className={styles.customFieldRow}>
              <div className={styles.customFieldInputs}>
                <input
                  type="text"
                  className={styles.editInput}
                  placeholder="Field name"
                  value={f.label}
                  onChange={e => updateCustomField(f.id, 'label', e.target.value)}
                />
                <input
                  type="number"
                  className={styles.editInput}
                  placeholder="0"
                  inputMode="decimal"
                  value={f.value}
                  onChange={e => updateCustomField(f.id, 'value', e.target.value)}
                />
              </div>
              <button className={styles.removeCustomBtn} onClick={() => removeCustomField(f.id)}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
              </button>
            </div>
          ))}

          <button className={styles.addCustomFieldBtn} onClick={addCustomField}>
            <span className="mi" style={{ fontSize: '1rem' }}>add</span> Add Custom Field
          </button>
        </div>
      </div>

      {isOpen && <div className={styles.editBackdrop} onClick={onClose} />}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function CustomerBodyMeasurements({ onMenuClick }) {
  const { id }   = useParams()
  const { getCustomer, updateCustomer } = useCustomers()

  const [isScrolled, setIsScrolled] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [exporting,  setExporting]  = useState(false)
  const [toastMsg,   setToastMsg]   = useState('')
  const toastTimer     = useRef(null)
  const topSentinelRef = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  const customer = getCustomer(id)
  if (!customer) return null

  const sex              = customer.sex || ''
  const bodyMeasurements = customer.bodyMeasurements || {}
  const orderedFields    = sex === 'Female' ? FEMALE_MEASUREMENTS : MALE_MEASUREMENTS
  const imgMap           = sex === 'Female' ? FEMALE_MEASUREMENT_IMAGES : MALE_MEASUREMENT_IMAGES

  const knownEntries = orderedFields
    .filter(f => bodyMeasurements[f] !== undefined && bodyMeasurements[f] !== '')
    .map(f => ({ field: f, value: bodyMeasurements[f] }))

  const knownSet      = new Set(orderedFields)
  const customEntries = Object.entries(bodyMeasurements)
    .filter(([k, v]) => !knownSet.has(k) && v !== undefined && v !== '')
    .map(([k, v]) => ({ field: k, value: v }))

  const allEntries = [...knownEntries, ...customEntries]
  const isEmpty    = allEntries.length === 0

  const handleSaveMeasurements = async (cleaned) => {
    await updateCustomer(id, { bodyMeasurements: cleaned })
    showToast('Measurements saved ✓')
  }

  const handleExport = async () => {
    if (isEmpty || exporting) return
    setExporting(true)
    try {
      await exportPDF(customer, allEntries, imgMap)
    } catch (err) {
      showToast('Export failed. Try again.')
      console.error('[CBM export]', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div ref={topSentinelRef} className={styles.sentinel} />

      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : 'Body Measurements'}
          customActions={[
            { icon: 'edit', onClick: () => setEditOpen(true), outlined: true },
            {
              icon:     exporting ? 'hourglass_empty' : 'ios_share',
              onClick:  isEmpty || exporting ? undefined : handleExport,
              outlined: true,
              color:    isEmpty || exporting ? 'var(--text3)' : undefined,
            },
          ]}
        />
      </div>

      <div className={styles.identityStrip}>
        <div className={styles.stripName}>
          {customer.name}{sex ? ` (${sex})` : ''}
        </div>
        <div className={styles.stripSub}>Full body measurements · inches</div>
      </div>

      <div className={styles.scrollArea}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)', opacity: 0.3 }}>
              straighten
            </span>
            <p>No body measurements recorded.</p>
            <span>Tap the button below to add measurements.</span>
            <button className={styles.emptyEditBtn} onClick={() => setEditOpen(true)}>
              <span className="mi" style={{ fontSize: '1rem' }}>edit</span>
              Add Measurements
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {allEntries.map(({ field, value }, idx) => {
              const imgSrc = imgMap[field] || null

              if (imgSrc) {
                const isLastImgRow = !allEntries.slice(idx + 1).some(e => imgMap[e.field])
                return (
                  <div
                    key={field}
                    className={`${styles.imgRow} ${isLastImgRow && customEntries.length === 0 ? styles.imgRowLast : ''}`}
                  >
                    <img src={imgSrc} alt={field} className={styles.measureImg} />
                    <div className={styles.imgRowRight}>
                      <div className={styles.fieldLabel}>{field}</div>
                      <div className={styles.fieldValue}>
                        {value}<span className={styles.unit}>″</span>
                      </div>
                    </div>
                  </div>
                )
              }

              const isLast = idx === allEntries.length - 1
              return (
                <div
                  key={field}
                  className={`${styles.textRow} ${isLast ? styles.textRowLast : ''}`}
                >
                  <div className={styles.fieldLabel}>{field}</div>
                  <div className={styles.fieldValue}>
                    {value}<span className={styles.unit}>″</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <EditMeasurementsModal
        isOpen={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveMeasurements}
      />

      <div className={`${styles.toast} ${toastMsg ? styles.toastShow : ''}`}>
        {toastMsg}
      </div>
    </div>
  )
}
