// src/pages/CustomerDetail/tabs/OrdersTab.jsx

import { useState, useEffect } from 'react'
import { useOrders } from '../../../contexts/OrdersContext'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './Tabs.module.css'

const PRIORITY_COLOR = { normal: 'var(--border2)', urgent: '#fb923c', vip: '#a855f7' }
const PRIORITY_BANNER = {
  normal: { cls: styles.bannerNormal, text: 'Normal Priority' },
  urgent: { cls: styles.bannerUrgent, text: 'Urgent ★' },
  vip: { cls: styles.bannerVip, text: 'VIP ★' },
}

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatDate(ts) {
  if (!ts) return 'Unknown Date'
  if (typeof ts.toDate === 'function') {
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (typeof ts === 'string') return ts
  return 'Unknown Date'
}

// ── ORDER FORM MODAL ──────────────────────────────────────────
function OrderModal({ isOpen, onClose, measurements, onSave }) {
  const [selectedItems, setSelectedItems] = useState([]) 
  const [pickerQuery, setPickerQuery] = useState('')
  const [desc, setDesc] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setSelectedItems([]); setPickerQuery(''); setDesc(''); 
    setDue(''); setPriority('normal'); setNotes('')
  }

  const toggleId = (m) => {
    const idStr = String(m.id)
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === idStr)
      if (exists) return prev.filter(item => item.id !== idStr)
      return [...prev, { id: idStr, price: '', name: m.name, imgSrc: m.imgSrc }]
    })
  }

  const updateItemPrice = (id, priceValue) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === id ? { ...item, price: priceValue } : item
    ))
  }

  const totalPrice = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  // Dynamic Qty based on selection length
  const dynamicQty = selectedItems.length || 1

  const filteredMeasurements = pickerQuery.trim()
    ? measurements.filter(m => m.name.toLowerCase().includes(pickerQuery.toLowerCase()))
    : measurements

  const handleSave = () => {
    if (selectedItems.length === 0 && !desc.trim()) return
    
    let dueDisplay = ''
    if (due) {
      const d = new Date(due + 'T00:00:00')
      dueDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    onSave({
      desc: desc.trim() || (selectedItems.length > 0 ? selectedItems.map(i => i.name).join(', ') : 'New Order'),
      price: totalPrice,
      items: selectedItems.map(i => ({ id: i.id, price: parseFloat(i.price) || 0, name: i.name, imgSrc: i.imgSrc || null })),
      qty: dynamicQty,
      due: dueDisplay,
      dueRaw: due,
      notes: notes.trim(),
      priority,
      measurementIds: selectedItems.map(i => i.id),
      status: 'pending',
    })
    reset()
    onClose()
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <div className={styles.modalHeaderClean}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="mi" onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem' }}>arrow_back</button>
          <span className={styles.modalTitle}>New Order</span>
        </div>
        <button className={styles.headerActionBtn} onClick={handleSave}>Place Order</button>
      </div>

      <div className={styles.modalBody}>
        <div style={{ padding: '20px' }}>
          <p className={styles.sectionHeading}>1. Select Clothes</p>
          {measurements.length > 5 && (
            <div className={styles.pickerSearchWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
              <input type="text" placeholder="Search cloth type…" value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} className={styles.pickerSearchInput} />
            </div>
          )}
          
          <div className={styles.pickerList}>
            {filteredMeasurements.map(m => {
              const selected = selectedItems.find(i => i.id === String(m.id))
              return (
                <div key={m.id} className={`${styles.pickerItem} ${selected ? styles.pickerSelected : ''}`} onClick={() => toggleId(m)}>
                  <div className={styles.pickerThumb}>
                    {m.imgSrc ? <img src={m.imgSrc} alt={m.name} /> : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>}
                  </div>
                  <div className={styles.pickerInfo}>
                    <h5>{m.name}</h5>
                    <span>{m.fields?.length || 0} measurements</span>
                  </div>
                  <div className={`${styles.pickerCheck} ${selected ? styles.pickerCheckSelected : ''}`}>
                    {selected && <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {selectedItems.length > 0 && (
            <>
              <p className={styles.sectionHeading} style={{ marginTop: 24 }}>2. Pricing Per Item</p>
              <div className={styles.pricingList}>
                {selectedItems.map(item => (
                  <div key={item.id} className={styles.priceInputRow}>
                    <div className={styles.pickerThumb} style={{ width: 40, height: 40 }}>
                      {item.imgSrc ? <img src={item.imgSrc} alt="" /> : <span className="mi">checkroom</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                       <label className={styles.labelTiny} style={{ marginBottom: 2 }}>{item.name} Price (₦)</label>
                       <input 
                        type="number" 
                        placeholder="0.00" 
                        className={styles.itemPriceInput}
                        value={item.price}
                        onChange={(e) => updateItemPrice(item.id, e.target.value)}
                       />
                    </div>
                  </div>
                ))}
                <div className={styles.totalIndicator}>
                  <span>Total (Qty: {dynamicQty})</span>
                  <span style={{ color: 'var(--accent)' }}>₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          <p className={styles.sectionHeading} style={{ marginTop: 24 }}>3. Final Details</p>
          <div className={styles.orderFormCard}>
            <label className={styles.labelTiny}>Order Description</label>
            <input type="text" className={styles.clothInput} placeholder="e.g. Full Native Set" value={desc} onChange={e => setDesc(e.target.value)} />
            
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Due Date</label>
                <input type="date" className={styles.clothInput} style={{ marginBottom: 0 }} value={due} onChange={e => setDue(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Calculated Qty</label>
                <div className={styles.clothInput} style={{ borderBottomColor: 'var(--border)', opacity: 0.8 }}>{dynamicQty}</div>
              </div>
            </div>

            <label className={styles.labelTiny}>Priority</label>
            <div className={styles.priorityRow}>
              {['normal', 'urgent', 'vip'].map(p => (
                <button key={p} className={`${styles.priorityChip} ${priority === p ? styles[`priority_${p}`] : ''}`} onClick={() => setPriority(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <label className={styles.labelTiny} style={{ marginTop: 20 }}>Notes</label>
            <textarea className={styles.orderTextarea} placeholder="Fabric color, styles, etc..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ORDER DETAIL ──────────────────────────────────────────────
function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange }) {
  if (!order) return null
  const banner = PRIORITY_BANNER[order.priority] ?? PRIORITY_BANNER.normal
  const placedOn = order.date || formatDate(order.createdAt)

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <div className={styles.detailHeader}>
        <button className="mi" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem' }}>arrow_back</button>
        <h3 style={{ flex: 1 }}>{order.desc}</h3>
        <button className="mi" onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.3rem' }}>delete_outline</button>
      </div>

      <div className={styles.detailBody}>
        <span className={`${styles.priorityBanner} ${banner.cls}`}>{banner.text}</span>
        
        <div className={styles.orderMetaGrid}>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Total Order Price</div>
            <div className={styles.cellValue}>₦{Number(order.price || 0).toLocaleString()}</div>
          </div>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Status</div>
            <div className={styles.cellValue} style={{ textTransform: 'capitalize' }}>{order.status}</div>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className={styles.linkedSection}>
            <div className={styles.linkLabel}>Selected Garments & Prices</div>
            {order.items.map((item, idx) => (
              <div key={idx} className={styles.linkedRow} style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.linkedThumb}>
                    {item.imgSrc ? <img src={item.imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="mi">checkroom</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.name}</div>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)' }}>
                  ₦{Number(item.price || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.linkedSection}>
          <div className={styles.linkLabel}>Change Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s.value} className={`${styles.statusToggleBtn} ${order.status === s.value ? styles.statusActive : ''}`} onClick={() => onStatusChange(order.id, s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {order.notes && (
          <div className={styles.notesSection}>
            <div className={styles.linkLabel}>Notes</div>
            <p>{order.notes}</p>
          </div>
        )}

        <div className={styles.detailDate}>Order Placed: {placedOn} • Qty: {order.qty}</div>
      </div>
    </div>
  )
}

// ── MAIN TAB ──────────────────────────────────────────────────
export default function OrdersTab({ customerId, orders, measurements, showToast }) {
  const { addOrder, deleteOrder, updateOrderStatus } = useOrders()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openOrderModal', handler)
    return () => document.removeEventListener('openOrderModal', handler)
  }, [])

  const handleSave = async (orderData) => {
    try {
      await addOrder(customerId, orderData)
      showToast('Order placed ✓')
    } catch {
      showToast('Failed to place order')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    try {
      await deleteOrder(customerId, confirmDel.id)
      showToast('Order deleted')
    } catch {
      showToast('Failed to delete order')
    }
    setConfirmDel(null); setDetailOrder(null)
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateOrderStatus(customerId, id, status)
      setDetailOrder(prev => prev && String(prev.id) === String(id) ? { ...prev, status } : prev)
    } catch {
      showToast('Failed to update status')
    }
  }

  const grouped = orders.reduce((acc, o) => {
    const key = formatDate(o.createdAt) || o.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(o)
    return acc
  }, {})

  return (
    <>
      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>shopping_basket</span>
          <p>No active orders yet.</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, dateOrders]) => (
        <div key={date} className={styles.orderGroup}>
          <div className={styles.orderGroupDate}>{date}</div>
          <div className={styles.orderGroupDivider} />
          {dateOrders.map((o, idx) => {
            const priceStr = o.price ? `₦${Number(o.price).toLocaleString()}` : '₦0'
            const statusLabel = STATUSES.find(s => s.value === o.status)?.label ?? 'Pending'
            const itemsList = o.items || []
            const thumb = itemsList[0]?.imgSrc

            return (
              <div key={o.id} className={`${styles.orderListItem} ${idx === dateOrders.length - 1 ? styles.orderListItemLast : ''}`} onClick={() => setDetailOrder(o)}>
                <div className={styles.orderListOuter}>
                  <div className={styles.orderListInner}>
                    {thumb ? <img src={thumb} alt="" className={styles.orderListThumbImg} /> : <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>content_cut</span>}
                  </div>
                </div>
                <div className={styles.orderListInfo}>
                  <div className={styles.orderListDesc}>{o.desc}</div>
                  <div className={styles.orderListStatusRow}>
                    <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>autorenew</span>
                    <span className={styles.orderListStatusText}>{statusLabel}</span>
                  </div>
                  <div className={styles.orderListPriceLine}>{priceStr} <span className={styles.orderListQty}>({o.qty} pcs)</span></div>
                  {o.due && <div className={styles.orderListDue}>Due: {o.due}</div>}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <OrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} measurements={measurements} onSave={handleSave} />
      {detailOrder && <OrderDetail order={detailOrder} measurements={measurements} onClose={() => setDetailOrder(null)} onDelete={() => setConfirmDel(detailOrder)} onStatusChange={handleStatusChange} />}
      <ConfirmSheet open={!!confirmDel} title="Delete Order?" message="This can't be undone." onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDel(null)} />
    </>
  )
}
