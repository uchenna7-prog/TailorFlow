import { useState, useEffect } from 'react'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './Tabs.module.css'

const UNIT_LABELS = { in: '"', cm: 'cm', yd: 'yd' }
const UNIT_FULL   = { in: 'Inches (")', cm: 'Centimetres (cm)', yd: 'Yards (yd)' }

// Defined OUTSIDE components so it's always available
function freshCard(n) {
  return {
    id: Date.now() + Math.random(),
    label: `Cloth Type ${n}`,
    name: '',
    imgSrc: null,
    fields: [{ id: Date.now() + Math.random(), name: '', value: '' }]
  }
}

function MeasureModal({ isOpen, onClose, onSave }) {
  const [unit, setUnit]   = useState('in')
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

  const addCard = () => setCards(prev => [...prev, freshCard(prev.length + 1)])
  const removeCard = (cardId) => setCards(prev => prev.filter(c => c.id !== cardId))

  const handleImgUpload = (cardId, file) => {
    const reader = new FileReader()
    reader.onload = (e) => updateCard(cardId, 'imgSrc', e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    let added = 0
    cards.forEach(card => {
      if (!card.name.trim()) return
      const fields = card.fields.filter(f => f.name.trim()).map(f => ({ name: f.name, value: f.value }))
      onSave({ id: Date.now() + Math.random(), name: card.name.trim(), imgSrc: card.imgSrc, unit, fields, date: today })
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
      <div className={styles.modalHeaderClean}>
        <span className={styles.modalTitle}>New Measurement</span>
        <button className="mi" onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.8rem', cursor: 'pointer' }}>close</button>
      </div>

      <div className={styles.unitsSection}>
        {['in', 'cm', 'yd'].map(u => (
          <button key={u} className={`${styles.unitChip} ${unit === u ? styles.unitChipActive : ''}`} onClick={() => setUnit(u)}>
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
                <button className="mi" onClick={() => removeCard(card.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem' }}>cancel</button>
              )}
            </div>

            <label className={styles.labelTiny}>Name</label>
            <input type="text" className={styles.clothInput} placeholder="e.g. Kaftan Top" value={card.name} onChange={e => updateCard(card.id, 'name', e.target.value)} />

            <label className={styles.labelTiny}>Design Reference</label>
            <label className={styles.designUploadArea}>
              {card.imgSrc
                ? <img src={card.imgSrc} alt="design" className={styles.designPreview} />
                : <>
                    <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)', pointerEvents: 'none' }}>add_a_photo</span>
                    <span className={styles.uploadLabel}>Tap to upload</span>
                  </>
              }
              <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && handleImgUpload(card.id, e.target.files[0])} />
            </label>

            <label className={styles.labelTiny}>Measurements</label>
            <div className={styles.fieldList}>
              {card.fields.map(f => (
                <div key={f.id} className={styles.fieldRow}>
                  <div className={styles.fieldCol}>
                    <label>Field</label>
                    <input type="text" className={styles.fieldInput} placeholder="e.g. Neck" value={f.name} onChange={e => updateField(card.id, f.id, 'name', e.target.value)} />
                  </div>
                  <div className={styles.fieldCol}>
                    <label>Value</label>
                    <input type="number" className={styles.fieldInput} placeholder="0" inputMode="decimal" value={f.value} onChange={e => updateField(card.id, f.id, 'value', e.target.value)} />
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

      <div className={styles.saveBar}>
        <button className={styles.btnSave} onClick={handleSave}>Save Measurements</button>
      </div>
    </div>
  )
}

function MeasureDetail({ measurement, onClose, onDelete }) {
  if (!measurement) return null
  const unitFull = UNIT_FULL[measurement.unit] ?? measurement.unit
  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <div className={styles.detailHeader}>
        <button className="mi" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem', cursor: 'pointer' }}>arrow_back</button>
        <h3 style={{ flex: 1 }}>{measurement.name}</h3>
        <button className="mi" onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.3rem', cursor: 'pointer' }}>delete_outline</button>
      </div>
      <div className={styles.detailBody}>
        {measurement.imgSrc && <img src={measurement.imgSrc} alt="Design" className={styles.detailDesign} />}
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

export default function MeasurementsTab({ measurements, onSave, onDelete, showToast }) {
  const [modalOpen, setModalOpen]         = useState(false)
  const [detailItem, setDetailItem]       = useState(null)
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

  return (
    <>
      {measurements.length === 0 && (
        <div className={styles.emptyState}>
          <span style={{ fontSize: '2.8rem', opacity: 0.4 }}>📏</span>
          <p>No measurements added yet.</p>
          <span className={styles.hint}>Tap + to add the first one</span>
        </div>
      )}

      {measurements.map(m => {
        const unitLabel = UNIT_LABELS[m.unit] ?? m.unit
        return (
          <div key={m.id} className={styles.itemCard} onClick={() => setDetailItem(m)}>
            <div className={styles.designThumb}>
              {m.imgSrc ? <img src={m.imgSrc} alt={m.name} /> : <span style={{ fontSize: '1.4rem' }}>👗</span>}
            </div>
            <div className={styles.cardInfo}>
              <h4>{m.name}</h4>
              <p>{m.date}</p>
              <span className={styles.unitBadge}>{unitLabel} · {m.fields.length} field{m.fields.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.cardActions}>
              <button className={styles.cardDelete} onClick={e => { e.stopPropagation(); setConfirmDelete(m) }}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>delete_outline</span>
              </button>
              <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
            </div>
          </div>
        )
      })}

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
