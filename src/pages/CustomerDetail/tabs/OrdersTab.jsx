import { useState, useEffect } from 'react'
import { useOrders } from '../../../contexts/OrdersContext'
import { useAuth }   from '../../../contexts/AuthContext'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../components/Header/Header'
import styles from './Tabs.module.css'

const PRIORITY_COLOR = { normal: 'var(--border2)', urgent: '#fb923c', vip: '#a855f7' }
const PRIORITY_BANNER = {
  normal: { cls: styles.bannerNormal, text: 'Normal Priority' },
  urgent: { cls: styles.bannerUrgent, text: 'Urgent ★' },
  vip:    { cls: styles.bannerVip,    text: 'VIP ★' },
}

const STATUSES = [
  { value: 'pending',     label: 'Pending'      },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'completed',   label: 'Completed'    },
  { value: 'delivered',   label: 'Delivered'    },
  { value: 'cancelled',   label: 'Cancelled'    },
]

const STAGES = [
  { value: 'measurement_taken', label: 'Measurement Taken', icon: 'straighten'     },
  { value: 'fabric_ready',      label: 'Fabric Ready',      icon: 'checkroom'   },
  { value: 'cutting',           label: 'Cutting',           icon: 'content_cut'    },
  { value: 'weaving',           label: 'Weaving',           icon: 'texture'        },
  { value: 'sewing',            label: 'Sewing',            icon: 'construction'           },
  { value: 'embroidery',        label: 'Embroidery',        icon: 'auto_awesome'   },
  { value: 'fitting',           label: 'Fitting',           icon: 'accessibility'  },
  { value: 'adjustments',       label: 'Adjustments',       icon: 'tune'           },
  { value: 'finishing',         label: 'Finishing',         icon: 'dry_cleaning'   },
  { value: 'quality_check',     label: 'Quality Check',     icon: 'fact_check'     },
  { value: 'ready',             label: 'Ready',             icon: 'check_circle'   },
]

const STAGE_TO_STATUS = {
  measurement_taken: 'pending',
  fabric_ready:      'pending',
  cutting:           'in-progress',
  weaving:           'in-progress',
  sewing:            'in-progress',
  embroidery:        'in-progress',
  fitting:           'in-progress',
  adjustments:       'in-progress',
  finishing:         'in-progress',
  quality_check:     'in-progress',
  ready:             'completed',
}

function formatDate(ts) {
  if (!ts) return 'Unknown Date'
  if (typeof ts.toDate === 'function') {
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (typeof ts === 'string') return ts
  return 'Unknown Date'
}

function todayReadable() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
//
// Layout (matches Image 1 reference):
//   0 images  → icon placeholder
//   1 image   → single full image (standard thumb)
//   2 images  → left half + right half (side by side)
//   3+ images → left large (full height) + right column with
//               top-right and bottom-right stacked
//               If total > 3, bottom-right shows "+N" overlay
//
// All layouts live inside orderListOuter → orderListInner so
// the outer card size NEVER changes — images are just smaller.
// ─────────────────────────────────────────────────────────────
function OrderMosaic({ items }) {
  // Collect cover images only
  const covers = items
    .map(item => item.imgSrc ?? null)
    .filter(Boolean)

  const total     = items.length
  const hasImages = covers.length > 0

  // ── No images at all ──
  if (!hasImages) {
    return (
      <div className={styles.orderListOuter}>
        <div className={styles.orderListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>content_cut</span>
        </div>
      </div>
    )
  }

  // ── 1 item → standard single thumb ──
  if (total === 1) {
    return (
      <div className={styles.orderListOuter}>
        <div className={styles.orderListInner}>
          <img src={covers[0]} alt="" className={styles.orderListThumbImg} />
        </div>
      </div>
    )
  }

  // ── 2 items → two halves side by side ──
  if (total === 2) {
    return (
      <div className={styles.orderListOuter}>
        <div className={`${styles.orderListInner} ${styles.mosaicInner}`} style={{ padding: 0 }}>
          <div className={styles.mosaicLeft}>
            <img src={covers[0]} alt="" className={styles.mosaicImg} />
          </div>
          <div className={styles.mosaicDividerV} />
          <div className={styles.mosaicRight}>
            <div className={styles.mosaicRightCell}>
              {covers[1]
                ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 3+ items → large left + two stacked right ──
  // extra = items beyond the 3 shown slots
  const extra = total > 3 ? total - 3 : 0

  return (
    <div className={styles.orderListOuter}>
      <div className={`${styles.orderListInner} ${styles.mosaicInner}`} style={{ padding: 0 }}>
        {/* Large left image — full height */}
        <div className={styles.mosaicLeft}>
          {covers[0]
            ? <img src={covers[0]} alt="" className={styles.mosaicImg} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>

        <div className={styles.mosaicDividerV} />

        {/* Right column: two stacked cells */}
        <div className={styles.mosaicRight}>
          {/* Top-right */}
          <div className={styles.mosaicRightCell}>
            {covers[1]
              ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>

          <div className={styles.mosaicDividerH} />

          {/* Bottom-right — shows "+N" overlay when there are more than 3 */}
          <div className={`${styles.mosaicRightCell} ${extra > 0 ? styles.mosaicOverlayWrap : ''}`}>
            {covers[2]
              ? <img src={covers[2]} alt="" className={styles.mosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extra > 0 && (
              <div className={styles.mosaicOverlay}>+{extra}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ORDER FORM MODAL
// ─────────────────────────────────────────────────────────────
function OrderModal({ isOpen, onClose, measurements, onSave }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [pickerQuery,   setPickerQuery]   = useState('')
  const [desc,          setDesc]          = useState('')
  const [due,           setDue]           = useState('')
  const [priority,      setPriority]      = useState('normal')
  const [notes,         setNotes]         = useState('')
  const [stage,         setStage]         = useState('')

  const reset = () => {
    setSelectedItems([]); setPickerQuery(''); setDesc('')
    setDue(''); setPriority('normal'); setNotes(''); setStage('')
  }

  const toggleId = (m) => {
    const idStr = String(m.id)
    const coverImg = m.imgSrcs?.[0] ?? m.imgSrc ?? null
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === idStr)
      if (exists) return prev.filter(item => item.id !== idStr)
      return [...prev, { id: idStr, price: '', name: m.name, imgSrc: coverImg }]
    })
  }

  const updateItemPrice = (id, priceValue) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === id ? { ...item, price: priceValue } : item
    ))
  }

  const totalPrice  = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  const dynamicQty  = selectedItems.length || 1

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
      desc:           desc.trim() || (selectedItems.length > 0 ? selectedItems.map(i => i.name).join(', ') : 'New Order'),
      price:          totalPrice,
      items:          selectedItems.map(i => ({
        id:     i.id,
        price:  parseFloat(i.price) || 0,
        name:   i.name,
        imgSrc: i.imgSrc || null,
      })),
      qty:            dynamicQty,
      due:            dueDisplay,
      dueRaw:         due,
      notes:          notes.trim(),
      priority,
      measurementIds: selectedItems.map(i => i.id),
      status:         'pending',
      stage:          stage || null,
      takenAt:        todayReadable(),
    })
    reset()
    onClose()
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <Header
        type="back"
        title="New Order"
        onBackClick={handleClose}
        customActions={[{ label: 'Place Order', onClick: handleSave }]}
      />

      <div className={styles.modalBody}>
        <div style={{ padding: '20px' }}>

          {/* ── 1. Select Clothes ── */}
          <p className={styles.sectionHeading}>1. Select Clothes</p>
          {measurements.length > 5 && (
            <div className={styles.pickerSearchWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
              <input
                type="text"
                placeholder="Search cloth type…"
                value={pickerQuery}
                onChange={e => setPickerQuery(e.target.value)}
                className={styles.pickerSearchInput}
              />
            </div>
          )}

          <div className={styles.pickerList}>
            {filteredMeasurements.map(m => {
              const selected  = selectedItems.find(i => i.id === String(m.id))
              const coverImg  = m.imgSrcs?.[0] ?? m.imgSrc ?? null
              return (
                <div
                  key={m.id}
                  className={`${styles.pickerItem} ${selected ? styles.pickerSelected : ''}`}
                  onClick={() => toggleId(m)}
                >
                  <div className={styles.pickerThumb}>
                    {coverImg
                      ? <img src={coverImg} alt={m.name} />
                      : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>}
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

          {/* ── 2. Pricing ── */}
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

          {/* ── 3. Final Details ── */}
          <p className={styles.sectionHeading} style={{ marginTop: 24 }}>3. Final Details</p>
          <div className={styles.orderFormCard}>
            <label className={styles.labelTiny}>Order Description</label>
            <input
              type="text"
              className={styles.clothInput}
              placeholder="e.g. Full Native Set"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Due Date</label>
                <input
                  type="date"
                  className={styles.clothInput}
                  style={{ marginBottom: 0 }}
                  value={due}
                  onChange={e => setDue(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.labelTiny}>Calculated Qty</label>
                <div className={styles.clothInput} style={{ borderBottomColor: 'var(--border)', opacity: 0.8 }}>{dynamicQty}</div>
              </div>
            </div>

            <label className={styles.labelTiny}>Priority</label>
            <div className={styles.priorityRow}>
              {['normal', 'urgent', 'vip'].map(p => (
                <button
                  key={p}
                  className={`${styles.priorityChip} ${priority === p ? styles[`priority_${p}`] : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <label className={styles.labelTiny} style={{ marginTop: 20 }}>Current Stage</label>
            <div className={styles.stageChipRow}>
              {STAGES.map(s => (
                <button
                  key={s.value}
                  className={`${styles.stageChip} ${stage === s.value ? styles.stageChipActive : ''}`}
                  onClick={() => setStage(prev => prev === s.value ? '' : s.value)}
                >
                  <span className="mi" style={{ fontSize: '0.85rem' }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>

            <label className={styles.labelTiny} style={{ marginTop: 20 }}>Notes</label>
            <textarea
              className={styles.orderTextarea}
              placeholder="Fabric color, styles, etc..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ORDER DETAIL
// ─────────────────────────────────────────────────────────────
function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange, onStageChange, onGenerateInvoice, onShareReviewLink }) {
  if (!order) return null
  const banner   = PRIORITY_BANNER[order.priority] ?? PRIORITY_BANNER.normal
  const placedOn = order.takenAt || order.date || formatDate(order.createdAt)
  const stageObj = STAGES.find(s => s.value === order.stage)

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <Header
        type="back"
        title={order.desc}
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.detailBody}>
        <span className={`${styles.priorityBanner} ${banner.cls}`}>{banner.text}</span>

        {/* Meta grid */}
        <div className={styles.orderMetaGrid}>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Total Price</div>
            <div className={styles.cellValue}>₦{Number(order.price || 0).toLocaleString()}</div>
          </div>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Status</div>
            <div className={styles.cellValue} style={{ textTransform: 'capitalize' }}>
              {STATUSES.find(s => s.value === order.status)?.label ?? 'Pending'}
            </div>
          </div>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Current Stage</div>
            <div className={styles.cellValue} style={{ fontSize: '0.85rem' }}>
              {stageObj
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="mi" style={{ fontSize: '1rem' }}>{stageObj.icon}</span>
                    {stageObj.label}
                  </span>
                : <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: '0.8rem' }}>Not set</span>}
            </div>
          </div>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Due</div>
            <div className={styles.cellValue} style={{ fontSize: '0.85rem', color: order.due ? 'var(--danger)' : 'var(--text3)' }}>
              {order.due || '—'}
            </div>
          </div>
        </div>

        {/* Garments — cover images + prices */}
        {order.items && order.items.length > 0 && (
          <div className={styles.linkedSection}>
            <div className={styles.linkLabel}>Selected Garments & Prices</div>
            {order.items.map((item, idx) => (
              <div key={idx} className={styles.linkedRow} style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.linkedThumb}>
                    {item.imgSrc
                      ? <img src={item.imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span className="mi">checkroom</span>}
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

        {/* Notes */}
        {order.notes && (
          <div className={styles.notesSection}>
            <div className={styles.linkLabel}>Notes</div>
            <p>{order.notes}</p>
          </div>
        )}

        {/* Change Stage */}
        <div className={styles.linkedSection} style={{ marginTop: 16 }}>
          <div className={styles.linkLabel}>Change Stage</div>
          <div className={styles.stageChipRow}>
            {STAGES.map(s => (
              <button
                key={s.value}
                className={`${styles.stageChip} ${order.stage === s.value ? styles.stageChipActive : ''}`}
                onClick={() => onStageChange(order.id, order.stage === s.value ? null : s.value)}
              >
                <span className="mi" style={{ fontSize: '0.85rem' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Change Status */}
        <div className={styles.linkedSection}>
          <div className={styles.linkLabel}>Change Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button
                key={s.value}
                className={`${styles.statusToggleBtn} ${order.status === s.value ? styles.statusActive : ''}`}
                onClick={() => onStatusChange(order.id, s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Share Review Link — only when completed or delivered */}
        {(order.status === 'completed' || order.status === 'delivered') && (
          <button
            className={styles.shareReviewBtn}
            onClick={() => onShareReviewLink(order)}
          >
            <span className="material-icons" style={{ fontSize: '1.15rem' }}>rate_review</span>
            Share Review Link via WhatsApp
            <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto', color: '#22c55e' }}>open_in_new</span>
          </button>
        )}

        {/* Generate Invoice */}
        <button
          className={styles.generateInvoiceBtn}
          onClick={() => onGenerateInvoice(order.id)}
          style={{ marginTop: 16 }}
        >
          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: 6 }}>receipt_long</span>
          Generate Invoice
        </button>

        {/* Footer dates — always the very last element */}
        <div className={styles.detailDate}>
          Order Taken: {placedOn}
          {order.due && <> &nbsp;•&nbsp; Due: {order.due}</>}
          &nbsp;•&nbsp; Qty: {order.qty}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN TAB
// ─────────────────────────────────────────────────────────────
export default function OrdersTab({ customerId, orders, measurements, showToast, onGenerateInvoice }) {
  const { addOrder, deleteOrder, updateOrderStatus, updateOrderStage } = useOrders()
  const { user } = useAuth()
  const [modalOpen,   setModalOpen]   = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)

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

  const handleStageChange = async (id, stage) => {
    try {
      await updateOrderStage(customerId, id, stage)
      const autoStatus = stage ? STAGE_TO_STATUS[stage] : null
      if (autoStatus) {
        await updateOrderStatus(customerId, id, autoStatus)
        setDetailOrder(prev =>
          prev && String(prev.id) === String(id) ? { ...prev, stage, status: autoStatus } : prev
        )
      } else {
        setDetailOrder(prev =>
          prev && String(prev.id) === String(id) ? { ...prev, stage } : prev
        )
      }
    } catch {
      showToast('Failed to update stage')
    }
  }

  // ── Share Review Link via WhatsApp ──────────────────────────
  const handleShareReviewLink = (order) => {
    // Build a unique review token scoped to this order
    const token = order.reviewToken || crypto.randomUUID()

    // Public review submission URL — adjust YOUR_DOMAIN to match your deployed URL
    const reviewUrl = `https://tailorflow-62b0a.web.app/review/${user?.uid}/${token}`

    const customerName = order.customerName || 'there'
    const message = encodeURIComponent(
      `Hi ${customerName}! 🙏 Thank you for your order.\n\n` +
      `We'd love to hear your feedback — it only takes a minute:\n${reviewUrl}\n\n` +
      `Your review means a lot to us! ⭐`
    )

    // Clean the phone number — strip spaces, dashes, leading zeros, add country code
    const rawPhone   = order.customerPhone || ''
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '')
    const waPhone    = cleanPhone.startsWith('+')
      ? cleanPhone.replace('+', '')
      : cleanPhone.startsWith('0')
        ? `234${cleanPhone.slice(1)}`   // Nigerian default — adjust if needed
        : cleanPhone

    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${message}`
      : `https://wa.me/?text=${message}`

    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  // Group by takenAt (human date) or createdAt
  const grouped = orders.reduce((acc, o) => {
    const key = o.takenAt || formatDate(o.createdAt) || o.date || 'Unknown Date'
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
            const statusObj = STATUSES.find(s => s.value === o.status) ?? STATUSES[0]
            const stageObj  = STAGES.find(s => s.value === o.stage)
            const itemsList = o.items || []

            return (
              <div
                key={o.id}
                className={`${styles.orderListItem} ${idx === dateOrders.length - 1 ? styles.orderListItemLast : ''}`}
                onClick={() => setDetailOrder(o)}
              >
                {/* Mosaic thumbnail */}
                <OrderMosaic items={itemsList} />

                <div className={styles.orderListInfo}>
                  <div className={styles.orderListDesc}>{o.desc}</div>

                  <div className={styles.orderListStatusRow}>
                    <span className={`${styles.orderListStatusBadge} ${styles[`statusBadge_${(o.status || 'pending').replace('-', '_')}`]}`}>
                      {statusObj.label}
                    </span>
                  </div>

                  {stageObj
                    ? (
                      <div className={styles.orderListStageLine}>
                        <span className="mi" style={{ fontSize: '0.8rem' }}>{stageObj.icon}</span>
                        {stageObj.label}
                      </div>
                    )
                    : (
                      <div className={styles.orderListStageLine} style={{ color: 'var(--text3)' }}>
                        No stage set
                      </div>
                    )
                  }

                  {o.due && <div className={styles.orderListDue}>Due: {o.due}</div>}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <OrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        measurements={measurements}
        onSave={handleSave}
      />

      {detailOrder && (
        <OrderDetail
          order={detailOrder}
          measurements={measurements}
          onClose={() => setDetailOrder(null)}
          onDelete={() => setConfirmDel(detailOrder)}
          onStatusChange={handleStatusChange}
          onStageChange={handleStageChange}
          onShareReviewLink={handleShareReviewLink}
          onGenerateInvoice={(orderId) => {
            setDetailOrder(null)
            onGenerateInvoice(orderId)
          }}
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
