import { useState, useEffect } from 'react'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './Tabs.module.css'

const PRIORITY_COLOR = { normal: 'var(--border2)', urgent: '#fb923c', vip: '#a855f7' }
const PRIORITY_BANNER = {
  normal: { cls: styles.bannerNormal, text: 'Normal Priority' },
  urgent: { cls: styles.bannerUrgent, text: 'Urgent ★' },
  vip:    { cls: styles.bannerVip,    text: 'VIP ★' },
}

const STATUSES = [
  { value: 'pending',   label: 'Pending'   },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function OrderModal({ isOpen, onClose, measurements, onSave }) {
  const [selectedIds,  setSelectedIds]  = useState([])
  const [pickerQuery,  setPickerQuery]  = useState('')
  const [desc,         setDesc]         = useState('')
  const [price,        setPrice]        = useState('')
  const [qty,          setQty]          = useState('')
  const [due,          setDue]          = useState('')
  const [priority,     setPriority]     = useState('normal')
  const [notes,        setNotes]        = useState('')

  const reset = () => {
    setSelectedIds([]); setPickerQuery(''); setDesc(''); setPrice('')
    setQty(''); setDue(''); setPriority('normal'); setNotes('')
  }

  const toggleId = (id) =>
    setSelectedIds(prev =>
      prev.includes(String(id)) ? prev.filter(x => x !== String(id)) : [...prev, String(id)]
    )

  const filteredMeasurements = pickerQuery.trim()
    ? measurements.filter(m => m.name.toLowerCase().includes(pickerQuery.toLowerCase()))
    : measurements

  const handleSave = () => {
    if (!desc.trim()) return
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    let dueDisplay = ''
    if (due) {
      const d = new Date(due + 'T00:00:00')
      dueDisplay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
    onSave({
      id:             Date.now() + Math.random(),
      desc:           desc.trim(),
      price:          price ? parseFloat(price) : null,
      qty:            parseInt(qty) || 1,
      due:            dueDisplay,
      dueRaw:         due,
      notes:          notes.trim(),
      priority,
      measurementIds: [...selectedIds],
      measurementId:  selectedIds[0] ?? null,
      status:         'pending',
      date:           today,
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
            {measurements.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text3)', paddingBottom: 6 }}>No measurements yet.</p>}
            {filteredMeasurements.map(m => {
              const selected = selectedIds.includes(String(m.id))
              return (
                <div key={m.id} className={`${styles.pickerItem} ${selected ? styles.pickerSelected : ''}`} onClick={() => toggleId(m.id)}>
                  <div className={styles.pickerThumb}>
                    {m.imgSrc ? <img src={m.imgSrc} alt={m.name} /> : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>}
                  </div>
                  <div className={styles.pickerInfo}>
                    <h5>{m.name}</h5>
                    <span>{m.fields.length} fields</span>
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
                <input type="number" className={styles.clothInput} style={{ marginBottom: 0 }} placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Qty</label>
                <input type="number" className={styles.clothInput} style={{ marginBottom: 0 }} placeholder="1" value={qty} onChange={e => setQty(e.target.value)} />
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
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange, onGenerateInvoice }) {
  if (!order) return null
  const banner = PRIORITY_BANNER[order.priority] ?? PRIORITY_BANNER.normal
  const priceStr = order.price !== null ? `₦${Number(order.price).toLocaleString()}` : '—'
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
          <div className={styles.orderMetaCell} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.cellLabel}>Status</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {STATUSES.map(s => (
                <button key={s.value} className={`${styles.statusToggleBtn} ${order.status === s.value ? styles.statusActive : ''}`} onClick={() => onStatusChange(order.id, s.value)}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
        <button className={styles.generateInvoiceBtn} onClick={() => onGenerateInvoice(order.id)}>Generate Invoice</button>
      </div>
    </div>
  )
}

export default function OrdersTab({ orders, measurements, onSave, onDelete, onStatusChange, showToast }) {
  const [modalOpen,    setModalOpen]    = useState(false)
  const [detailOrder,  setDetailOrder]  = useState(null)
  const [confirmDel,   setConfirmDel]   = useState(null)

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openOrderModal', handler)
    return () => document.removeEventListener('openOrderModal', handler)
  }, [])

  return (
    <>
      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>shopping_basket</span>
          <p>No active orders yet.</p>
        </div>
      )}

      <div className={styles.ordersContainer}>
        {orders.map(o => {
          const priceStr = o.price !== null ? `₦${Number(o.price).toLocaleString()}` : '—'
          const dueStr = o.due ? `Due On ${o.due}` : 'No due date'
          
          return (
            <div key={o.id} className={styles.orderListItem} onClick={() => setDetailOrder(o)}>
              <div className={styles.orderListIconWrap}>
                 <div className={styles.orderListIcon}><span className="mi">content_cut</span></div>
              </div>
              <div className={styles.orderListMain}>
                <div className={styles.orderListTitle}>{o.desc}</div>
                <div className={styles.orderListSub}>Ord# {o.id.toString().slice(-5).toUpperCase()}</div>
                <div className={styles.orderListStatus}>
                   <span className="mi" style={{fontSize: '1rem'}}>task_alt</span> Received
                </div>
                <div className={styles.orderListPricing}>{priceStr} ({o.qty} item{o.qty > 1 ? 's' : ''})</div>
                <div className={styles.orderListDueDate}>{dueStr}</div>
              </div>
            </div>
          )
        })}
      </div>

      <OrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} measurements={measurements} onSave={(o) => { onSave(o); showToast('Order placed ✓') }} />

      {detailOrder && <OrderDetail order={detailOrder} measurements={measurements} onClose={() => setDetailOrder(null)} onDelete={() => setConfirmDel(detailOrder)} onStatusChange={(id, s) => { onStatusChange(id, s); setDetailOrder(prev => ({...prev, status: s})) }} onGenerateInvoice={(id) => { document.dispatchEvent(new CustomEvent('generateInvoice', { detail: { orderId: id } })); setDetailOrder(null) }} />}

      <ConfirmSheet open={!!confirmDel} title="Delete Order?" onConfirm={() => { onDelete(confirmDel.id); setConfirmDel(null); setDetailOrder(null); showToast('Deleted') }} onCancel={() => setConfirmDel(null)} />
    </>
  )
}
