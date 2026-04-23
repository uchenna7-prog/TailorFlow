// src/pages/Orders/Orders.jsx

import { useState, useRef } from 'react'
import Header from '../../components/Header/Header'
import styles from './Orders.module.css'
import { useOrders } from '../../contexts/OrdersContext'
import { useAuth }   from '../../contexts/AuthContext'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── Helpers ───────────────────────────────────────────────────

function isOverdue(order) {
  if (!order.dueDate) return false
  if (['completed', 'delivered', 'cancelled'].includes(order.status)) return false
  return new Date(order.dueDate + 'T23:59:59') < new Date()
}

function daysUntil(dateStr) {
  if (!dateStr) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due  = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0)   return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `${diff}d left`
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown Date'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getOrderGroupDate(o) {
  if (o.date && o.date !== 'Unknown Date') return o.date
  if (o.createdAt) {
    const d = typeof o.createdAt.toDate === 'function'
      ? o.createdAt.toDate()
      : new Date(o.createdAt)
    if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (o.dueDate) return formatDate(o.dueDate)
  return 'Unknown Date'
}

function fmt(price) {
  if (price === null || price === undefined || price === '') return '—'
  return `₦${Number(price).toLocaleString('en-NG')}`
}

// ── Constants ─────────────────────────────────────────────────

const TABS = [
  { id: 'all',         label: 'All',         icon: 'assignment'     },
  { id: 'pending',     label: 'Pending',     icon: 'schedule'       },
  { id: 'in-progress', label: 'In Progress', icon: 'autorenew'      },
  { id: 'completed',   label: 'Completed',   icon: 'check_circle'   },
  { id: 'delivered',   label: 'Delivered',   icon: 'local_shipping'  },
  { id: 'cancelled',   label: 'Cancelled',   icon: 'cancel'         },
  { id: 'overdue',     label: 'Overdue',     icon: 'alarm_on'       },
]

const EMPTY_CONFIG = {
  all:           { icon: 'assignment',     text: 'No orders yet.' },
  pending:       { icon: 'schedule',       text: 'No pending orders.' },
  'in-progress': { icon: 'autorenew',      text: 'No orders in progress.' },
  completed:     { icon: 'check_circle',   text: 'No completed orders yet.' },
  delivered:     { icon: 'local_shipping', text: 'No delivered orders yet.' },
  cancelled:     { icon: 'cancel',         text: 'No cancelled orders.' },
  overdue:       { icon: 'alarm_on',       text: 'No overdue orders. Good job!' },
}

const STATUS_COLORS = {
  pending:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  'in-progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
  completed:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)'  },
  delivered:     { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
  cancelled:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.35)'},
}

const PRIORITY_COLORS = {
  normal: { color: 'var(--text2)',  bg: 'var(--surface2)', border: 'var(--border2)' },
  urgent: { color: '#fb923c',       bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)'  },
  vip:    { color: '#a855f7',       bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)'  },
}

const STATUSES = [
  { value: 'pending',     label: 'Pending'     },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed'   },
  { value: 'delivered',   label: 'Delivered'   },
  { value: 'cancelled',   label: 'Cancelled'   },
]

const STAGES = [
  { value: 'measurement_taken', label: 'Measurement Taken', icon: 'straighten'    },
  { value: 'fabric_ready',      label: 'Fabric Ready',      icon: 'roll_content'  },
  { value: 'cutting',           label: 'Cutting',           icon: 'content_cut'   },
  { value: 'weaving',           label: 'Weaving',           icon: 'texture'       },
  { value: 'sewing',            label: 'Sewing',            icon: 'send'          },
  { value: 'embroidery',        label: 'Embroidery',        icon: 'auto_awesome'  },
  { value: 'fitting',           label: 'Fitting',           icon: 'accessibility' },
  { value: 'adjustments',       label: 'Adjustments',       icon: 'tune'          },
  { value: 'finishing',         label: 'Finishing',         icon: 'dry_cleaning'  },
  { value: 'quality_check',     label: 'Quality Check',     icon: 'fact_check'    },
  { value: 'ready',             label: 'Ready',             icon: 'check_circle'  },
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

// ── Order Detail Panel ────────────────────────────────────────

function OrderDetailPanel({ order, onClose, onGoToCustomer }) {
  const { updateOrderStatus, updateOrderStage, updateOrder, deleteOrder } = useOrders()
  const { user } = useAuth()

  const [localOrder,    setLocalOrder]    = useState(order)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const overdue  = isOverdue(localOrder)
  const due      = daysUntil(localOrder.dueDate)
  const sc       = overdue
    ? { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' }
    : STATUS_COLORS[localOrder.status] ?? STATUS_COLORS.pending
  const pc       = PRIORITY_COLORS[localOrder.priority ?? 'normal']
  const items    = localOrder.items || []
  const stageObj = STAGES.find(s => s.value === localOrder.stage)

  const handleStatusChange = async (status) => {
    try {
      await updateOrderStatus(localOrder.customerId, localOrder.id, status)
      setLocalOrder(prev => ({ ...prev, status }))
    } catch (err) {
      console.error('[OrderDetailPanel] handleStatusChange:', err)
    }
  }

  const handleStageChange = async (stageValue) => {
    const newStage = localOrder.stage === stageValue ? null : stageValue
    try {
      await updateOrderStage(localOrder.customerId, localOrder.id, newStage)
      const autoStatus = newStage ? STAGE_TO_STATUS[newStage] : null
      if (autoStatus) {
        await updateOrderStatus(localOrder.customerId, localOrder.id, autoStatus)
        setLocalOrder(prev => ({ ...prev, stage: newStage, status: autoStatus }))
      } else {
        setLocalOrder(prev => ({ ...prev, stage: newStage }))
      }
    } catch (err) {
      console.error('[OrderDetailPanel] handleStageChange:', err)
    }
  }

  const handlePriorityChange = async (priority) => {
    try {
      await updateOrder(localOrder.customerId, localOrder.id, { priority })
      setLocalOrder(prev => ({ ...prev, priority }))
    } catch (err) {
      console.error('[OrderDetailPanel] handlePriorityChange:', err)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOrder(localOrder.customerId, localOrder.id)
      onClose()
    } catch (err) {
      console.error('[OrderDetailPanel] handleDelete:', err)
    }
  }

  const handleShareReviewLink = () => {
    const token      = localOrder.reviewToken || crypto.randomUUID()
    const reviewUrl  = `https://tailorflow-62b0a.web.app/review/${user?.uid}/${token}`
    const name       = localOrder.customerName || 'there'
    const message    = encodeURIComponent(
      `Hi ${name}! 🙏 Thank you for your order.\n\n` +
      `We'd love to hear your feedback — it only takes a minute:\n${reviewUrl}\n\n` +
      `Your review means a lot to us! ⭐`
    )
    const rawPhone   = localOrder.customerPhone || ''
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '')
    const waPhone    = cleanPhone.startsWith('+')
      ? cleanPhone.replace('+', '')
      : cleanPhone.startsWith('0')
        ? `234${cleanPhone.slice(1)}`
        : cleanPhone

    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${message}`
      : `https://wa.me/?text=${message}`

    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.detailOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.detailPanel}>
        <div className={styles.detailHandle} />

        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderTitle}>Order Details</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>delete_outline</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text2)' }}>Delete?</span>
                <button
                  onClick={handleDelete}
                  style={{ background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'DM Sans, sans-serif' }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text2)', cursor: 'pointer', padding: '5px 10px', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'DM Sans, sans-serif' }}
                >
                  No
                </button>
              </div>
            )}
            <button onClick={onClose} className={styles.detailCloseBtn}>
              <span className="material-icons" style={{ fontSize: '1.4rem' }}>close</span>
            </button>
          </div>
        </div>

        <div className={styles.detailBody}>

          {/* Garment images */}
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {item.imgSrc
                      ? <img src={item.imgSrc} alt={item.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                      : <span className="material-icons" style={{ fontSize: '1.6rem', color: 'var(--text3)' }}>checkroom</span>
                    }
                  </div>
                  {item.name && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text3)', textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Title + customer */}
          <div className={styles.detailTitle}>{localOrder.desc || localOrder.name || 'Order'}</div>

          {localOrder.customerName && (
            <div className={styles.detailCustomer}>
              <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--text3)' }}>person</span>
              {localOrder.customerName}
            </div>
          )}

          {/* Status + priority + stage pills */}
          <div className={styles.detailPillRow}>
            <span className={styles.detailPill} style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
              {overdue ? 'Overdue' : (localOrder.status ? localOrder.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Pending')}
            </span>
            {localOrder.priority && localOrder.priority !== 'normal' && (
              <span className={styles.detailPill} style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}>
                {localOrder.priority.charAt(0).toUpperCase() + localOrder.priority.slice(1)}
              </span>
            )}
            {stageObj && (
              <span className={styles.detailPill} style={{ color: 'var(--text2)', background: 'var(--surface2)', borderColor: 'var(--border2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-icons" style={{ fontSize: '0.75rem' }}>{stageObj.icon}</span>
                {stageObj.label}
              </span>
            )}
          </div>

          {/* Per-item prices + total */}
          {items.length > 0 && (
            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '2px 0',
              marginBottom: 14,
            }}>
              {items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {item.imgSrc
                        ? <img src={item.imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                        : <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--text3)' }}>checkroom</span>
                      }
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{item.name || 'Item'}</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {fmt(item.price)}
                  </span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                borderRadius: '0 0 12px 12px',
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total (Qty: {items.length})
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {fmt(items.reduce((sum, i) => sum + (Number(i.price) || 0), 0))}
                </span>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Placed On</div>
              <div className={styles.detailCellVal} style={{ fontSize: '0.8rem' }}>
                {localOrder.takenAt || (localOrder.createdAt ? formatDate(
                  typeof localOrder.createdAt.toDate === 'function'
                    ? localOrder.createdAt.toDate().toISOString()
                    : localOrder.createdAt
                ) : null) || localOrder.date || '—'}
              </div>
            </div>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Due Date</div>
              <div className={styles.detailCellVal} style={{ fontSize: '0.8rem', color: localOrder.dueDate ? '#ef4444' : 'var(--text3)' }}>
                {localOrder.dueDate
                  ? `${formatDate(localOrder.dueDate)}${due ? ` · ${due}` : ''}`
                  : localOrder.due || '—'}
              </div>
            </div>
          </div>

          {/* Notes */}
          {localOrder.notes && (
            <div className={styles.detailNotes}>
              <div className={styles.detailNotesLabel}>Notes</div>
              <p>{localOrder.notes}</p>
            </div>
          )}

          {/* Linked cloth types */}
          {localOrder.linkedNames?.length > 0 && (
            <div className={styles.detailLinked}>
              <div className={styles.detailNotesLabel}>Cloth Types</div>
              <div className={styles.detailLinkedNames}>{localOrder.linkedNames.join(', ')}</div>
            </div>
          )}

          {/* ── Change Stage ── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Change Stage
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
              {STAGES.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStageChange(s.value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '8px 12px',
                    borderRadius: 20,
                    border: localOrder.stage === s.value ? '1px solid var(--accent)' : '1px solid var(--border2)',
                    background: localOrder.stage === s.value ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: localOrder.stage === s.value ? 'var(--accent)' : 'var(--text3)',
                    fontSize: '0.7rem',
                    lineHeight: 1.4,
                    fontWeight: 800,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                    margin: '0 6px 8px 0',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '0.85rem' }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Change Status ── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Change Status
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  style={{
                    flex: 1,
                    minWidth: 'calc(33% - 6px)',
                    padding: '11px 6px',
                    borderRadius: 10,
                    border: localOrder.status === s.value ? '1px solid var(--success)' : '1px solid var(--border2)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: localOrder.status === s.value ? 'var(--success)' : 'var(--text3)',
                    background: localOrder.status === s.value ? 'var(--surface2)' : 'transparent',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Change Priority ── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Priority
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['normal', 'urgent', 'vip'].map(p => {
                const isActive = (localOrder.priority ?? 'normal') === p
                const activeStyles = {
                  normal: { bg: 'var(--surface2)',        border: 'var(--text2)', color: 'var(--text)'  },
                  urgent: { bg: 'rgba(251,146,60,0.15)',  border: '#fb923c',      color: '#fb923c'      },
                  vip:    { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7',      color: '#a855f7'      },
                }
                const as = activeStyles[p]
                return (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '9px 4px',
                      borderRadius: 10,
                      border: isActive ? `1px solid ${as.border}` : '1px solid var(--border2)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: isActive ? as.color : 'var(--text3)',
                      background: isActive ? as.bg : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Go to Customer Profile */}
          {localOrder.customerId && onGoToCustomer && (
            <button
              onClick={() => { onClose(); onGoToCustomer(localOrder.customerId) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: 12,
                padding: '12px 14px',
                color: 'var(--accent)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'border-color 0.2s',
              }}
            >
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>account_circle</span>
              Go to {localOrder.customerName || 'Customer'}'s Profile
              <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto' }}>arrow_forward_ios</span>
            </button>
          )}

          {/* Share Review Link — only when completed or delivered */}
          {(localOrder.status === 'completed' || localOrder.status === 'delivered') && (
            <button
              onClick={handleShareReviewLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: 12,
                padding: '12px 14px',
                color: '#22c55e',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 18,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'opacity 0.15s',
              }}
            >
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>rate_review</span>
              Share Review Link via WhatsApp
              <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto' }}>open_in_new</span>
            </button>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Order Mosaic Thumbnail ────────────────────────────────────

function OrderMosaic({ items, overdue }) {
  const covers = (items || []).map(item => item.imgSrc ?? null).filter(Boolean)
  const total  = items?.length ?? 0

  if (!covers.length) {
    return (
      <div className={styles.orderListOuter}>
        <div className={styles.orderListInner}>
          <span className="material-icons" style={{ fontSize: '1.5rem', color: overdue ? '#ef4444' : 'var(--text3)' }}>
            {overdue ? 'alarm_on' : 'assignment'}
          </span>
        </div>
      </div>
    )
  }

  if (total === 1) {
    return (
      <div className={styles.orderListOuter}>
        <div className={styles.orderListInner}>
          <img src={covers[0]} alt="" className={styles.orderListThumbImg} />
        </div>
      </div>
    )
  }

  if (total === 2) {
    return (
      <div className={styles.orderListOuter}>
        <div className={`${styles.orderListInner} ${styles.mosaicInner}`}>
          <div className={styles.mosaicLeft}>
            <img src={covers[0]} alt="" className={styles.mosaicImg} />
          </div>
          <div className={styles.mosaicDividerV} />
          <div className={styles.mosaicRight}>
            <div className={styles.mosaicRightCell}>
              {covers[1]
                ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
                : <span className="material-icons" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const extra = total > 3 ? total - 3 : 0
  return (
    <div className={styles.orderListOuter}>
      <div className={`${styles.orderListInner} ${styles.mosaicInner}`}>
        <div className={styles.mosaicLeft}>
          {covers[0]
            ? <img src={covers[0]} alt="" className={styles.mosaicImg} />
            : <span className="material-icons" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDividerV} />
        <div className={styles.mosaicRight}>
          <div className={styles.mosaicRightCell}>
            {covers[1]
              ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
              : <span className="material-icons" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDividerH} />
          <div className={`${styles.mosaicRightCell} ${extra > 0 ? styles.mosaicOverlayWrap : ''}`}>
            {covers[2]
              ? <img src={covers[2]} alt="" className={styles.mosaicImg} />
              : <span className="material-icons" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extra > 0 && <div className={styles.mosaicOverlay}>+{extra}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Order List Item ───────────────────────────────────────────

function OrderCard({ order, isLast, onTap }) {
  const overdue  = isOverdue(order)
  const due      = daysUntil(order.dueDate)
  const sc       = overdue
    ? { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    : STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
  const stageObj = STAGES.find(s => s.value === order.stage)

  return (
    <div
      className={`${styles.orderListItem} ${isLast ? styles.orderListItemLast : ''} ${overdue ? styles.orderListItemOverdue : ''}`}
      onClick={onTap}
    >
      <OrderMosaic items={order.items || []} overdue={overdue} />

      <div className={styles.orderListInfo}>
        <div className={styles.orderListDesc}>{order.desc || order.name || 'Order'}</div>

        <div className={styles.orderListMeta}>
          <span className="material-icons" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.orderListMetaText}>{order.customerName || '—'}</span>
        </div>

        {order.status && (
          <div style={{ marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: 6,
              color: sc.color,
              background: sc.bg,
              border: `1px solid ${sc.border}`,
            }}>
              {overdue ? 'Overdue' : order.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
        )}

        {stageObj && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <span className="material-icons" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>{stageObj.icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text2)' }}>{stageObj.label}</span>
          </div>
        )}

        {(order.dueDate || order.due) && (
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', marginTop: 1 }}>
            Due {order.dueDate ? formatDate(order.dueDate) : order.due}{order.dueDate && due ? ` · ${due}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Orders({ onMenuClick, onGoToCustomer }) {
  const { allOrders } = useOrders()

  const [activeTab,   setActiveTab]   = useState('all')
  const [detailOrder, setDetailOrder] = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const tabsRef = useRef(null)

  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const filtered = allOrders.filter(o => {
    if (activeTab === 'all')          return true
    if (activeTab === 'pending')      return o.status === 'pending' && !isOverdue(o)
    if (activeTab === 'in-progress')  return o.status === 'in-progress' && !isOverdue(o)
    if (activeTab === 'completed')    return o.status === 'completed'
    if (activeTab === 'delivered')    return o.status === 'delivered'
    if (activeTab === 'cancelled')    return o.status === 'cancelled'
    if (activeTab === 'overdue')      return isOverdue(o)
    return true
  })

  const counts = {
    all:           allOrders.length,
    pending:       allOrders.filter(o => o.status === 'pending' && !isOverdue(o)).length,
    'in-progress': allOrders.filter(o => o.status === 'in-progress' && !isOverdue(o)).length,
    completed:     allOrders.filter(o => o.status === 'completed').length,
    delivered:     allOrders.filter(o => o.status === 'delivered').length,
    cancelled:     allOrders.filter(o => o.status === 'cancelled').length,
    overdue:       allOrders.filter(o => isOverdue(o)).length,
  }

  const searchFiltered = search.trim()
    ? filtered.filter(o =>
        (o.desc || o.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName || '').toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  const grouped = [...searchFiltered]
    .sort((a, b) => {
      const da = a.dueDate || a.date || ''
      const db = b.dueDate || b.date || ''
      return db.localeCompare(da)
    })
    .reduce((acc, o) => {
      const key = getOrderGroupDate(o)
      if (!acc[key]) acc[key] = []
      acc[key].push(o)
      return acc
    }, {})

  return (
    <div className={styles.page}>
      <Header title="All Orders" onMenuClick={onMenuClick} />

      {/* Search + filter */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="material-icons" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search orders or clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer', padding: 0 }}
                onClick={() => setSearch('')}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
          <button
            className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(p => !p)}
          >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>tune</span>
          </button>
        </div>

        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Filter by Status</div>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.filterOption} ${activeTab === t.id ? styles.filterOptionActive : ''}`}
                onClick={() => { setActiveTab(t.id); setFilterOpen(false) }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                {t.label}
                {activeTab === t.id && <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs} ref={tabsRef} onClick={() => filterOpen && setFilterOpen(false)}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={(e) => handleTabClick(e, tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'overdue' ? styles.badgeOverdue : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* List */}
      <div className={styles.listArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {searchFiltered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-icons" style={{ fontSize: '2.8rem', opacity: 0.2 }}>
              {EMPTY_CONFIG[activeTab].icon}
            </span>
            <p>{EMPTY_CONFIG[activeTab].text}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateOrders]) => (
            <div key={date} className={styles.orderGroup}>
              <div className={styles.orderGroupDate}>{date}</div>
              <div className={styles.orderGroupDivider} />
              {dateOrders.map((order, idx) => (
                <OrderCard
                  key={`${order.customerId}-${order.id}`}
                  order={order}
                  isLast={idx === dateOrders.length - 1}
                  onTap={() => setDetailOrder(order)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Detail bottom sheet */}
      {detailOrder && (
        <OrderDetailPanel
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onGoToCustomer={onGoToCustomer}
        />
      )}
      <BottomNav></BottomNav>
    </div>
  )
}
