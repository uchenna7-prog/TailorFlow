import { useState, useEffect } from 'react'
import { useOrders } from '../../../../contexts/OrdersContext'
import { useAuth }   from '../../../../contexts/AuthContext'
import ConfirmSheet  from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header        from '../../../../components/Header/Header'
import styles        from './OrdersTab.module.css'


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PRIORITY_BANNER_CONFIG = {
  normal: { className: styles.priorityBanner_normal, label: 'Normal Priority' },
  urgent: { className: styles.priorityBanner_urgent, label: 'Urgent ★'        },
  vip:    { className: styles.priorityBanner_vip,    label: 'VIP ★'           },
}

const STATUSES = [
  { value: 'pending',     label: 'Pending'     },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed'   },
  { value: 'delivered',   label: 'Delivered'   },
  { value: 'cancelled',   label: 'Cancelled'   },
]

const STAGES = [
  { value: 'measurement_taken', color: '#a16207'    },
  { value: 'fabric_ready',      color: '#a16207'    },
  { value: 'cutting',           color: '#2563eb'  },
  { value: 'weaving',           color: '#2563eb'     },
  { value: 'sewing',            color: '#2563eb' },
  { value: 'embroidery',        color: '#2563eb'  },
  { value: 'fitting',           color: '#2563eb' },
  { value: 'adjustments',       color: '#2563eb'     },
  { value: 'finishing',         color: '#2563eb'  },
  { value: 'quality_check',     color: '#2563eb'   },
  { value: 'ready',             color: '#15803d'  },
]


// When a stage is set, auto-update the order status to match
const STAGE_AUTO_STATUS = {
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


// ─────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────

// Formats a Firestore timestamp or plain date string into "Jan 1, 2024"
function formatFirestoreDate(timestamp) {
  if (!timestamp) return 'Unknown Date'

  // Firestore Timestamp object
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    })
  }

  // Already a plain string
  if (typeof timestamp === 'string') return timestamp

  return 'Unknown Date'
}

// Formats "2024-01-15" into "Jan 15" (no year, for due date display)
function formatShortDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  })
}

// Returns today's date as "Jan 1, 2024"
function getTodayReadable() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
// Shows 1, 2, or 3-panel image grid for an order's items
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ items }) {
  // Pull the first image from each item (skip items with no image)
  const images = items.map(item => item.imgSrc ?? null).filter(Boolean)

  const totalItems = items.length
  const hasImages  = images.length > 0

  const placeholderIcon = (
    <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>
      content_cut
    </span>
  )

  // No images at all — show placeholder icon
  if (!hasImages) {
    return (
      <div className={styles.mosaicContainer}>
        <div className={styles.mosaicBox}>
          {placeholderIcon}
        </div>
      </div>
    )
  }

  // Single item — full image
  if (totalItems === 1) {
    return (
      <div className={styles.mosaicContainer}>
        <div className={styles.mosaicBox}>
          <img src={images[0]} alt="" className={styles.mosaicSingleImage} />
        </div>
      </div>
    )
  }

  // Two items — left/right split
  if (totalItems === 2) {
    return (
      <div className={styles.mosaicContainer}>
        <div className={`${styles.mosaicBox} ${styles.mosaicBox_split}`}>
          <div className={styles.mosaicPanel_left}>
            <img src={images[0]} alt="" className={styles.mosaicPanelImage} />
          </div>

          <div className={styles.mosaicDivider_vertical} />

          <div className={styles.mosaicPanel_right}>
            <div className={styles.mosaicCell}>
              {images[1]
                ? <img src={images[1]} alt="" className={styles.mosaicPanelImage} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Three or more items — left panel + two stacked right cells
  const extraCount = totalItems > 3 ? totalItems - 3 : 0

  return (
    <div className={styles.mosaicContainer}>
      <div className={`${styles.mosaicBox} ${styles.mosaicBox_split}`}>
        {/* Left large panel */}
        <div className={styles.mosaicPanel_left}>
          {images[0]
            ? <img src={images[0]} alt="" className={styles.mosaicPanelImage} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>

        <div className={styles.mosaicDivider_vertical} />

        {/* Right column — top and bottom cells */}
        <div className={styles.mosaicPanel_right}>
          <div className={styles.mosaicCell}>
            {images[1]
              ? <img src={images[1]} alt="" className={styles.mosaicPanelImage} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>

          <div className={styles.mosaicDivider_horizontal} />

          {/* Bottom cell — shows "+N" overlay if there are more items */}
          <div className={`${styles.mosaicCell} ${extraCount > 0 ? styles.mosaicCell_hasOverlay : ''}`}>
            {images[2]
              ? <img src={images[2]} alt="" className={styles.mosaicPanelImage} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && (
              <div className={styles.mosaicOverlay}>+{extraCount}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ORDER FORM MODAL
// Slide-up sheet for creating a new order
// ─────────────────────────────────────────────────────────────

function OrderModal({ isOpen, onClose, measurements, onSave }) {

  // ── Form state ──
  const [selectedItems,  setSelectedItems]  = useState([])
  const [clothSearchText, setClothSearchText] = useState('')
  const [orderDesc,      setOrderDesc]      = useState('')
  const [dueDate,        setDueDate]        = useState('')
  const [priority,       setPriority]       = useState('normal')
  const [notes,          setNotes]          = useState('')
  const [stage,          setStage]          = useState('')
  const [pricingError,   setPricingError]   = useState('')

  // ── Reset all fields back to defaults ──
  function resetForm() {
    setSelectedItems([])
    setClothSearchText('')
    setOrderDesc('')
    setDueDate('')
    setPriority('normal')
    setNotes('')
    setStage('')
    setPricingError('')
  }

  // ── Toggle a cloth type on/off in the selection list ──
  function toggleItemSelection(measurement) {
    const itemId   = String(measurement.id)
    const coverImg = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null

    setSelectedItems(prev => {
      const alreadySelected = prev.find(item => item.id === itemId)

      if (alreadySelected) {
        // Deselect — remove it
        return prev.filter(item => item.id !== itemId)
      } else {
        // Select — add with empty price/qty
        return [...prev, { id: itemId, price: '', qty: '', name: measurement.name, imgSrc: coverImg }]
      }
    })

    setPricingError('')
  }

  // ── Update a single field (price or qty) for one item ──
  function updateItemField(itemId, field, value) {
    setSelectedItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, [field]: value } : item)
    )
    setPricingError('')
  }

  // ── Computed totals ──
  const orderTotal = selectedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 0)
  }, 0)

  const totalQty = selectedItems.reduce((sum, item) => {
    return sum + (parseInt(item.qty, 10) || 0)
  }, 0) || 1

  // ── Filter cloth list by search text ──
  const visibleMeasurements = clothSearchText.trim()
    ? measurements.filter(m => m.name.toLowerCase().includes(clothSearchText.toLowerCase()))
    : measurements

  // ── Save the order ──
  function handleSave() {
    const hasItems    = selectedItems.length > 0
    const hasDesc     = orderDesc.trim()

    if (!hasItems && !hasDesc) return

    // Every selected item must have both price and qty filled
    if (hasItems) {
      const incomplete = selectedItems.find(
        item => !(parseFloat(item.price) > 0) || !(parseInt(item.qty, 10) > 0)
      )
      if (incomplete) {
        setPricingError(`Please enter both price and quantity for "${incomplete.name}".`)
        return
      }
    }

    // Format due date for display
    let dueDateDisplay = ''
    if (dueDate) {
      dueDateDisplay = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day:   'numeric',
        year:  'numeric',
      })
    }

    onSave({
      desc:           orderDesc.trim() || (hasItems ? selectedItems.map(i => i.name).join(', ') : 'New Order'),
      price:          orderTotal,
      items:          selectedItems.map(item => ({
        id:     item.id,
        name:   item.name,
        imgSrc: item.imgSrc || null,
        price:  parseFloat(item.price) || 0,
        qty:    parseInt(item.qty, 10) || 1,
      })),
      qty:            totalQty,
      due:            dueDateDisplay,
      dueRaw:         dueDate,
      notes:          notes.trim(),
      priority,
      measurementIds: selectedItems.map(i => i.id),
      status:         'pending',
      stage:          stage || null,
      takenAt:        getTodayReadable(),
    })

    resetForm()
    onClose()
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlay_open : ''}`}>
      <Header
        type="back"
        title="New Order"
        onBackClick={handleClose}
        customActions={[{ label: 'Place Order', onClick: handleSave }]}
      />

      <div className={styles.formScrollBody}>
        <div style={{ padding: '20px' }}>

          {/* ── Step 1: Select Clothes ── */}
          <p className={styles.stepHeading}>1. Select Clothes</p>

          {/* Search bar — only shown when there are many cloth types */}
          {measurements.length > 5 && (
            <div className={styles.clothSearchBar}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
              <input
                type="text"
                placeholder="Search cloth type…"
                value={clothSearchText}
                onChange={e => setClothSearchText(e.target.value)}
                className={styles.clothSearchInput}
              />
            </div>
          )}

          {/* Cloth type picker list */}
          <div className={styles.clothPickerList}>
            {visibleMeasurements.map(measurement => {
              const isSelected = selectedItems.find(i => i.id === String(measurement.id))
              const coverImg   = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null

              return (
                <div
                  key={measurement.id}
                  className={`${styles.clothPickerItem} ${isSelected ? styles.clothPickerItem_selected : ''}`}
                  onClick={() => toggleItemSelection(measurement)}
                >
                  {/* Thumbnail */}
                  <div className={styles.clothThumb}>
                    {coverImg
                      ? <img src={coverImg} alt={measurement.name} />
                      : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>
                    }
                  </div>

                  {/* Name + measurement count */}
                  <div className={styles.clothInfo}>
                    <h5>{measurement.name}</h5>
                    <span>{measurement.fields?.length || 0} measurements</span>
                  </div>

                  {/* Checkmark circle */}
                  <div className={`${styles.clothCheckCircle} ${isSelected ? styles.clothCheckCircle_checked : ''}`}>
                    {isSelected && <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>}
                  </div>
                </div>
              )
            })}
          </div>


          {/* ── Step 2: Price & Quantity per Item ── */}
          {selectedItems.length > 0 && (
            <>
              <p className={styles.stepHeading} style={{ marginTop: 24 }}>
                2. Price &amp; Quantity Per Item
              </p>

              <div className={styles.pricingCard}>
                {selectedItems.map(item => (
                  <div key={item.id} className={styles.pricingRow}>

                    {/* Item thumbnail */}
                    <div className={styles.clothThumb} style={{ width: 40, height: 40, flexShrink: 0 }}>
                      {item.imgSrc
                        ? <img src={item.imgSrc} alt="" />
                        : <span className="mi">checkroom</span>
                      }
                    </div>

                    {/* Fields: name + price/qty/amount inputs */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.pricingItemName}>{item.name}</div>

                      <div className={styles.pricingInputRow}>
                        {/* Price */}
                        <div className={styles.pricingField}>
                          <label className={styles.fieldLabel}>
                            Price (₦) <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="0"
                            className={styles.pricingInput}
                            value={item.price}
                            onChange={e => updateItemField(item.id, 'price', e.target.value)}
                          />
                        </div>

                        {/* Quantity */}
                        <div className={styles.pricingField}>
                          <label className={styles.fieldLabel}>
                            Qty <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="1"
                            min="1"
                            className={styles.pricingInput}
                            value={item.qty}
                            onChange={e => updateItemField(item.id, 'qty', e.target.value)}
                          />
                        </div>

                        {/* Computed line total (read-only) */}
                        <div className={styles.pricingField} style={{ alignItems: 'flex-end' }}>
                          <label className={styles.fieldLabel}>Amount</label>
                          <div className={styles.pricingAmount}>
                            ₦{((parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Error message if price/qty missing */}
                {pricingError && (
                  <div className={styles.pricingError}>
                    <span className="mi" style={{ fontSize: '0.9rem' }}>error_outline</span>
                    {pricingError}
                  </div>
                )}

                {/* Order total row */}
                <div className={styles.orderTotalRow}>
                  <span>Order Total (Qty: {totalQty})</span>
                  <span style={{ color: 'var(--accent)' }}>₦{orderTotal.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}


          {/* ── Step 3: Final Details ── */}
          <p className={styles.stepHeading} style={{ marginTop: 24 }}>3. Final Details</p>

          <div className={styles.detailsCard}>

            {/* Description */}
            <label className={styles.fieldLabel}>Order Description</label>
            <input
              type="text"
              className={styles.underlineInput}
              placeholder="e.g. Full Native Set"
              value={orderDesc}
              onChange={e => setOrderDesc(e.target.value)}
            />

            {/* Due date + total qty side by side */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className={styles.fieldLabel}>Due Date</label>
                <input
                  type="date"
                  className={styles.underlineInput}
                  style={{ marginBottom: 0 }}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.fieldLabel}>Total Qty</label>
                <div className={styles.underlineInput} style={{ borderBottomColor: 'var(--border)', opacity: 0.8 }}>
                  {totalQty}
                </div>
              </div>
            </div>

            {/* Priority chips */}
            <label className={styles.fieldLabel}>Priority</label>
            <div className={styles.priorityChipRow}>
              {['normal', 'urgent', 'vip'].map(p => (
                <button
                  key={p}
                  className={`${styles.priorityChip} ${priority === p ? styles[`priorityChip_${p}`] : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Stage chips */}
            <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Current Stage</label>
            <div className={styles.stageChipRow}>
              {STAGES.map(stageItem => (
                <button
                  key={stageItem.value}
                  className={`${styles.stageChip} ${stage === stageItem.value ? styles.stageChip_active : ''}`}
                  onClick={() => setStage(prev => prev === stageItem.value ? '' : stageItem.value)}
                >
                  <span className="mi" style={{ fontSize: '0.85rem' }}>{stageItem.icon}</span>
                  {stageItem.label}
                </button>
              ))}
            </div>

            {/* Notes */}
            <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Notes</label>
            <textarea
              className={styles.notesTextarea}
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
// ORDER DETAIL PANEL
// Slides in from the right when an order is tapped
// ─────────────────────────────────────────────────────────────

function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange, onStageChange, onGenerateInvoice, onShareReviewLink }) {
  if (!order) return null

  const priorityBanner = PRIORITY_BANNER_CONFIG[order.priority] ?? PRIORITY_BANNER_CONFIG.normal
  const placedOnDate   = order.takenAt || order.date || formatFirestoreDate(order.createdAt)
  const currentStage   = STAGES.find(s => s.value === order.stage)

  return (
    <div className={`${styles.detailPanel} ${styles.detailPanel_open}`}>
      <Header
        type="back"
        title={order.desc}
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.detailScrollBody}>

        {/* Priority label */}
        <span className={`${styles.priorityBanner} ${priorityBanner.className}`}>
          {priorityBanner.label}
        </span>

        {/* 2×2 info grid: price, status, stage, due date */}
        <div className={styles.infoGrid}>
          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Total Price</div>
            <div className={styles.infoGridValue}>₦{Number(order.price || 0).toLocaleString()}</div>
          </div>

          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Status</div>
            <div className={styles.infoGridValue} style={{ textTransform: 'capitalize' }}>
              {STATUSES.find(s => s.value === order.status)?.label ?? 'Pending'}
            </div>
          </div>

          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Current Stage</div>
            <div className={styles.infoGridValue} style={{ fontSize: '0.85rem' }}>
              {currentStage
                ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="mi" style={{ fontSize: '1rem' }}>{currentStage.icon}</span>
                    {currentStage.label}
                  </span>
                )
                : <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: '0.8rem' }}>Not set</span>
              }
            </div>
          </div>

          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Due</div>
            <div className={styles.infoGridValue} style={{ fontSize: '0.85rem', color: order.due ? 'var(--danger)' : 'var(--text3)' }}>
              {order.due || '—'}
            </div>
          </div>
        </div>


        {/* Selected garments list */}
        {order.items && order.items.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionCardLabel}>Selected Garments</div>

            {order.items.map((item, index) => (
              <div key={index} className={styles.garmentRow}>
                {/* Left: thumbnail + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.garmentThumb}>
                    {item.imgSrc
                      ? <img src={item.imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span className="mi">checkroom</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.name}</div>
                    {item.qty > 1 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600 }}>
                        {item.qty} pcs × ₦{Number(item.price || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: line total */}
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)' }}>
                  ₦{((item.qty ?? 1) * Number(item.price || 0)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Notes */}
        {order.notes && (
          <div className={styles.notesCard}>
            <div className={styles.sectionCardLabel}>Notes</div>
            <p>{order.notes}</p>
          </div>
        )}


        {/* Change Stage chips */}
        <div className={styles.sectionCard} style={{ marginTop: 16 }}>
          <div className={styles.sectionCardLabel}>Change Stage</div>
          <div className={styles.stageChipRow}>
            {STAGES.map(stageItem => (
              <button
                key={stageItem.value}
                className={`${styles.stageChip} ${order.stage === stageItem.value ? styles.stageChip_active : ''}`}
                onClick={() => onStageChange(order.id, order.stage === stageItem.value ? null : stageItem.value)}
              >
                <span className="mi" style={{ fontSize: '0.85rem' }}>{stageItem.icon}</span>
                {stageItem.label}
              </button>
            ))}
          </div>
        </div>


        {/* Change Status buttons */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardLabel}>Change Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(statusItem => (
              <button
                key={statusItem.value}
                className={`${styles.statusButton} ${order.status === statusItem.value ? styles.statusButton_active : ''}`}
                onClick={() => onStatusChange(order.id, statusItem.value)}
              >
                {statusItem.label}
              </button>
            ))}
          </div>
        </div>


        {/* Share Review Link — only show for completed/delivered orders */}
        {(order.status === 'completed' || order.status === 'delivered') && (
          <button
            className={styles.shareReviewButton}
            onClick={() => onShareReviewLink(order)}
          >
            <span className="material-icons" style={{ fontSize: '1.15rem' }}>rate_review</span>
            Share Review Link via WhatsApp
            <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto', color: '#22c55e' }}>open_in_new</span>
          </button>
        )}


        {/* Generate Invoice */}
        <button
          className={styles.generateInvoiceButton}
          onClick={() => onGenerateInvoice(order.id)}
          style={{ marginTop: 16 }}
        >
          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: 6 }}>receipt_long</span>
          Generate Invoice
        </button>


        {/* Footer: placed on, due, qty */}
        <div className={styles.detailFooterDates}>
          Order Taken: {placedOnDate}
          {order.due && <> &nbsp;•&nbsp; Due: {order.due}</>}
          &nbsp;•&nbsp; Qty: {order.qty}
        </div>

      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MAIN ORDERS TAB
// ─────────────────────────────────────────────────────────────

export default function OrdersTab({ customerId, orders, measurements, showToast, onGenerateInvoice }) {
  const { addOrder, deleteOrder, updateOrderStatus, updateOrderStage } = useOrders()
  const { user } = useAuth()

  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [selectedOrder,  setSelectedOrder]  = useState(null)
  const [orderToDelete,  setOrderToDelete]  = useState(null)

  // Allow other parts of the app to open the order modal via a custom event
  useEffect(() => {
    const openModal = () => setIsModalOpen(true)
    document.addEventListener('openOrderModal', openModal)
    return () => document.removeEventListener('openOrderModal', openModal)
  }, [])

  // ── Save a new order to Firestore ──
  async function handleSaveOrder(orderData) {
    try {
      await addOrder(customerId, orderData)
      showToast('Order placed ✓')
    } catch {
      showToast('Failed to place order')
    }
  }

  // ── Confirm and delete the order ──
  async function handleDeleteConfirm() {
    if (!orderToDelete) return

    try {
      await deleteOrder(customerId, orderToDelete.id)
      showToast('Order deleted')
    } catch {
      showToast('Failed to delete order')
    }

    setOrderToDelete(null)
    setSelectedOrder(null)
  }

  // ── Update order status ──
  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatus(customerId, orderId, newStatus)

      // Keep the detail panel in sync
      setSelectedOrder(prev =>
        prev && String(prev.id) === String(orderId)
          ? { ...prev, status: newStatus }
          : prev
      )
    } catch {
      showToast('Failed to update status')
    }
  }

  // ── Update order stage and auto-update status to match ──
  async function handleStageChange(orderId, newStage) {
    try {
      await updateOrderStage(customerId, orderId, newStage)

      const autoStatus = newStage ? STAGE_AUTO_STATUS[newStage] : null

      if (autoStatus) {
        // Stage implies a status — update both
        await updateOrderStatus(customerId, orderId, autoStatus)
        setSelectedOrder(prev =>
          prev && String(prev.id) === String(orderId)
            ? { ...prev, stage: newStage, status: autoStatus }
            : prev
        )
      } else {
        // Stage cleared — only update stage
        setSelectedOrder(prev =>
          prev && String(prev.id) === String(orderId)
            ? { ...prev, stage: newStage }
            : prev
        )
      }
    } catch {
      showToast('Failed to update stage')
    }
  }

  // ── Build and open a WhatsApp review link for the customer ──
  function handleShareReviewLink(order) {
    const reviewToken = order.reviewToken || crypto.randomUUID()
    const reviewUrl   = `https://tailorflow-62b0a.web.app/review/${user?.uid}/${reviewToken}`
    const customerName = order.customerName || 'there'

    const message = encodeURIComponent(
      `Hi ${customerName}! 🙏 Thank you for your order.\n\n` +
      `We'd love to hear your feedback — it only takes a minute:\n${reviewUrl}\n\n` +
      `Your review means a lot to us! ⭐`
    )

    // Normalize phone number to international format (Nigerian: 0XX -> 234XX)
    const rawPhone   = order.customerPhone || ''
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '')
    let waPhone = cleanPhone

    if (cleanPhone.startsWith('+')) {
      waPhone = cleanPhone.replace('+', '')
    } else if (cleanPhone.startsWith('0')) {
      waPhone = `234${cleanPhone.slice(1)}`
    }

    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${message}`
      : `https://wa.me/?text=${message}`

    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  // ── Group orders by the date they were taken ──
  const ordersByDate = orders.reduce((groups, order) => {
    const dateKey = order.takenAt || formatFirestoreDate(order.createdAt) || order.date || 'Unknown Date'

    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(order)

    return groups
  }, {})


  return (
    <>
      {/* Empty state */}
      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>shopping_basket</span>
          <p>No active orders yet.</p>
        </div>
      )}

      {/* Orders grouped by date */}
      {Object.entries(ordersByDate).map(([date, ordersInGroup]) => (
        <div key={date} className={styles.orderGroup}>
          <div className={styles.orderGroupDate}>{date}</div>
          <div className={styles.orderGroupDivider} />

          {ordersInGroup.map((order, index) => {
            const statusInfo  = STATUSES.find(s => s.value === order.status) ?? STATUSES[0]
            const stageInfo   = STAGES.find(s => s.value === order.stage)
            const stageColor = STAGES.find(s => s.color)
            console.log(stageColor)
            const items       = order.items || []
            const itemCount   = items.length
            const priceText   = order.price != null ? `₦${Number(order.price).toLocaleString()}` : '—'
            const dueDateRaw  = order.dueRaw || order.dueDate
            const isLastInGroup = index === ordersInGroup.length - 1

            return (
              <div
                key={order.id}
                className={`${styles.orderRow} ${isLastInGroup ? styles.orderRow_last : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Mosaic thumbnail */}
                <OrderMosaic items={items} />

                {/* Left: description, item count, stage */}
                <div className={styles.orderRowInfo}>
                  <div className={styles.orderRowDescription}>{order.desc}</div>

                  {itemCount > 0 && (
                    <div className={styles.orderRowMeta}>
                      <span className={styles.orderRowMetaText}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  )}

                  {stageInfo && (
                    <div className={styles.orderRowStage}>
                      <span  style={{ fontSize: '0.78rem',color:stageColor.color }}>{stageInfo.label}</span>
                      
                    </div>
                  )}
                </div>

                {/* Right: price, status badge, due date */}
                <div className={styles.orderRowRight}>
                  <div className={styles.orderRowPrice}>{priceText}</div>
                  <span className={`${styles.orderStatusBadge} ${styles[`orderStatusBadge_${(order.status || 'pending').replace('-', '_')}`]}`}>
                    {statusInfo.label}
                  </span>
                  {dueDateRaw && (
                    <div className={styles.orderRowDueDate}>
                      Due {formatShortDate(dueDateRaw)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}


      {/* New order modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        measurements={measurements}
        onSave={handleSaveOrder}
      />

      {/* Order detail panel */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          measurements={measurements}
          onClose={() => setSelectedOrder(null)}
          onDelete={() => setOrderToDelete(selectedOrder)}
          onStatusChange={handleStatusChange}
          onStageChange={handleStageChange}
          onShareReviewLink={handleShareReviewLink}
          onGenerateInvoice={(orderId) => {
            setSelectedOrder(null)
            onGenerateInvoice(orderId)
          }}
        />
      )}

      {/* Delete confirmation sheet */}
      <ConfirmSheet
        open={!!orderToDelete}
        title="Delete Order?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOrderToDelete(null)}
      />
    </>
  )
}