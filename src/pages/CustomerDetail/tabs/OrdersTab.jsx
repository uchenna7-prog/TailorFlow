import { useState, useEffect } from 'react'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './Tabs.module.css'

const PRIORITY_COLOR = { normal: 'var(--border2)', urgent: '#fb923c', vip: '#a855f7' }
const PRIORITY_BANNER = {
  normal: { cls: styles.bannerNormal, text: 'Normal Priority' },
  urgent: { cls: styles.bannerUrgent, text: 'Urgent ★' },
  vip:    { cls: styles.bannerVip,    text: 'VIP ★' },
}

// ── ORDER FORM MODAL ──
function OrderModal({ isOpen, onClose, measurements, onSave }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [pickerQuery, setPickerQuery] = useState('')
  const [desc, setDesc]       = useState('')
  const [price, setPrice]     = useState('')
  const [qty, setQty]         = useState('')
  const [due, setDue]         = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes]     = useState('')

  const reset = () => {
    setSelectedIds([]); setPickerQuery(''); setDesc(''); setPrice('')
    setQty(''); setDue(''); setPriority('normal'); setNotes('')
  }

  const toggleId = (id) =>
    setSelectedIds(prev => prev.includes(String(id)) ? prev.filter(x => x !== String(id)) : [...prev, String(id)])

  const filteredMeasurements = pickerQuery.trim()
    ? measurements.filter(m => m.name.toLowerCase().includes(pickerQuery.toLowerCase()))
    : measurements

  const handleSave = () => {
    if (!desc.trim()) return
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    let dueDisplay = ''
    if (due) {
      const d = new Date(due + 'T00:00:00')
      dueDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    onSave({
      id: Date.now() + Math.random(),
      desc: desc.trim(),
      price: price ? parseFloat(price) : null,
      qty: parseInt(qty) || 1,
      due: dueDisplay, dueRaw: due,
      notes: notes.trim(),
      priority,
      measurementIds: [...selectedIds],
      measurementId: selectedIds[0] ?? null,
      status: 'pending',
      date: today,
    })
    reset()
    onClose()
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <div className={styles.modalHeaderClean}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="mi" onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem', cursor: 'pointer' }}>arrow_back</button>
          <span className={styles.modalTitle}>New Order</span>
        </div>
        <button className={styles.headerActionBtn} onClick={handleSave}>Place Order</button>
      </div>
      <div className={styles.modalBody}>
        <div style={{ padding: '20px' }}>
          <p className={styles.sectionHeading}>Cloth Types</p>
          {measurements.length > 5 && (
            <div className={styles.pickerSearchWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
              <input type="text" placeholder="Search cloth type…" value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} className={styles.pickerSearchInput} />
            </div>
          )}
          <div className={styles.pickerList}>
            {measurements.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text3)', paddingBottom: 6 }}>No measurements yet. You can still place an order.</p>}
            {filteredMeasurements.length === 0 && measurements.length > 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>No matches found.</p>}
            {filteredMeasurements.map(m => {
              const selected = selectedIds.includes(String(m.id))
              return (
                <div key={m.id} className={`${styles.pickerItem} ${selected ? styles.pickerSelected : ''}`} onClick={() => toggleId(m.id)}>
                  <div className={styles.pickerThumb}>
                    {m.imgSrc ? <img src={m.imgSrc} alt={m.name} /> : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>}
                  </div>
                  <div className={styles.pickerInfo}>
                    <h5>{m.name}</h5>
                    <span>{m.fields.length} field{m.fields.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className={`${styles.pickerCheck} ${selected ? styles.pickerCheckSelected : ''}`}>
                    {selected && <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <p className={styles.sectionHeading} style={{ marginTop: 24 }}>Order Details</p>
          <div className={styles.orderFormCard}>
            <label className={styles.labelTiny}>Description / Cloth Type</label>
            <input type="text" className={styles.clothInput} placeholder="e.g. Senator Suit" value={desc} onChange={e => setDesc(e.target.value)} />

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Price (₦)</label>
                <input type="number" className={styles.clothInput} style={{ marginBottom: 0 }} placeholder="0.00" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Qty</label>
                <input type="number" className={styles.clothInput} style={{ marginBottom: 0 }} placeholder="1" inputMode="numeric" min="1" value={qty} onChange={e => setQty(e.target.value)} />
              </div>
            </div>

            <label className={styles.labelTiny}>Due Date</label>
            <input type="date" className={styles.clothInput} value={due} onChange={e => setDue(e.target.value)} />

            <label className={styles.labelTiny}>Priority</label>
            <div className={styles.priorityRow}>
              {['normal', 'urgent', 'vip'].map(p => (
                <button key={p} className={`${styles.priorityChip} ${priority === p ? styles[`priority_${p}`] : ''}`} onClick={() => setPriority(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <label className={styles.labelTiny} style={{ marginTop: 20 }}>Notes</label>
            <textarea className={styles.orderTextarea} placeholder="Fabric colour, special instructions…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ORDER DETAIL ──
function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange, onGenerateInvoice }) {
  if (!order) return null
  const banner = PRIORITY_BANNER[order.priority] ?? PRIORITY_BANNER.normal
  const priceStr = order.price !== null && order.price !== undefined ? `₦${Number(order.price).toLocaleString()}` : '—'
  const ids = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
  const linked = ids.map(id => measurements.find(m => String(m.id) === String(id))).filter(Boolean)

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <div className={styles.detailHeader}>
        <button className="mi" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem', cursor: 'pointer' }}>arrow_back</button>
        <h3 style={{ flex: 1 }}>{order.desc}</h3>
        <button className="mi" onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.3rem', cursor: 'pointer' }}>delete_outline</button>
      </div>
      <div className={styles.detailBody}>
        <span className={`${styles.priorityBanner} ${banner.cls}`}>{banner.text}</span>

        <div className={styles.orderMetaGrid}>
          <div className={styles.orderMetaCell}><div className={styles.cellLabel}>Price</div><div className={styles.cellValue}>{priceStr}</div></div>
          <div className={styles.orderMetaCell}><div className={styles.cellLabel}>Qty</div><div className={styles.cellValue}>{order.qty}</div></div>
          <div className={styles.orderMetaCell}><div className={styles.cellLabel}>Due Date</div><div className={styles.cellValue} style={{ fontSize: '0.85rem' }}>{order.due || '—'}</div></div>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Status</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button className={`${styles.statusToggleBtn} ${order.status !== 'done' ? styles.statusActive : ''}`} onClick={() => onStatusChange(order.id, 'pending')}>Pending</button>
              <button className={`${styles.statusToggleBtn} ${order.status === 'done' ? styles.statusActive : ''}`} onClick={() => onStatusChange(order.id, 'done')}>Done</button>
            </div>
          </div>
        </div>

        {linked.length > 0 && (
          <div className={styles.linkedSection}>
            <div className={styles.linkLabel}>Linked Measurement{linked.length > 1 ? 's' : ''}</div>
            {linked.map(m => (
              <div key={m.id} className={styles.linkedRow}>
                <div className={styles.linkedThumb}>{m.imgSrc ? <img src={m.imgSrc} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} /> : <span className="mi">checkroom</span>}</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>{m.fields.length} field{m.fields.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {order.notes && (
          <div className={styles.notesSection}>
            <div className={styles.linkLabel}>Notes</div>
            <p>{order.notes}</p>
          </div>
        )}

        <div className={styles.detailDate}>Placed on {order.date}</div>

        <button className={styles.generateInvoiceBtn} onClick={() => onGenerateInvoice(order.id)}>
          <span className="mi" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '4px' }}>request_quote</span>
          Generate Invoice
        </button>
      </div>
    </div>
  )
}

// ── MAIN TAB ──
export default function OrdersTab({ orders, measurements, onSave, onDelete, onStatusChange, showToast }) {
  const [modalOpen, setModalOpen]     = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [confirmDel, setConfirmDel]   = useState(null)

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openOrderModal', handler)
    return () => document.removeEventListener('openOrderModal', handler)
  }, [])

  const handleSave = (order) => {
    onSave(order)
    showToast('Order placed ✓')
  }

  const handleDeleteConfirm = () => {
    if (!confirmDel) return
    onDelete(confirmDel.id)
    showToast('Order deleted')
    setConfirmDel(null)
    setDetailOrder(null)
  }

  const handleStatusChange = (id, status) => {
    onStatusChange(id, status)
    setDetailOrder(prev => prev && String(prev.id) === String(id) ? { ...prev, status } : prev)
  }

  const handleGenerateInvoice = (orderId) => {
    document.dispatchEvent(new CustomEvent('generateInvoice', { detail: { orderId } }))
    document.dispatchEvent(new CustomEvent('switchToInvoiceTab'))
    setDetailOrder(null)
    showToast('Generating invoice…')
  }

  return (
    <>
      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>shopping_basket</span>
          <p>No active orders yet.</p>
          <span className={styles.hint}>Tap + to place an order</span>
        </div>
      )}

      {orders.map(o => {
        const priceStr = o.price !== null && o.price !== undefined ? `₦${Number(o.price).toLocaleString()}` : '—'
        const ids = o.measurementIds?.length ? o.measurementIds : (o.measurementId ? [o.measurementId] : [])
        const linkedCount = ids.filter(id => measurements.find(m => String(m.id) === String(id))).length
        const linkedStr = linkedCount > 0 ? ` · ${linkedCount} cloth${linkedCount > 1 ? 'es' : ''}` : ''
        const dueStr = o.due ? `Due ${o.due}` : 'No due date'
        const statusClass = o.status === 'done' ? styles.statusDone : styles.statusPending

        return (
          <div key={o.id} className={styles.orderCard} onClick={() => setDetailOrder(o)}>
            <div className={styles.priorityBar} style={{ background: PRIORITY_COLOR[o.priority] ?? PRIORITY_COLOR.normal }} />
            <div className={styles.orderCardIcon}><span className="mi">content_cut</span></div>
            <div className={styles.orderCardInfo}>
              <h4>{o.desc}</h4>
              <p>{dueStr}{linkedStr}</p>
              <span className={`${styles.statusBadge} ${statusClass}`}>{o.status === 'done' ? 'Done' : 'Pending'}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={styles.orderPrice}>{priceStr}</div>
              {o.qty > 1 && <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>×{o.qty}</div>}
            </div>
          </div>
        )
      })}

      <OrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} measurements={measurements} onSave={handleSave} />

      {detailOrder && (
        <OrderDetail
          order={detailOrder}
          measurements={measurements}
          onClose={() => setDetailOrder(null)}
          onDelete={() => setConfirmDel(detailOrder)}
          onStatusChange={handleStatusChange}
          onGenerateInvoice={handleGenerateInvoice}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Order?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />
    </>
  )
}
