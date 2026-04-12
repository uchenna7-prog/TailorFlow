// src/pages/Orders/Orders.jsx

import { useState, useRef } from 'react'
import Header from '../../components/Header/Header'
import styles from './Orders.module.css'
import { useOrders } from '../../contexts/OrdersContext'

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

function fmt(price) {
  if (price === null || price === undefined || price === '') return '—'
  return `₦${Number(price).toLocaleString('en-NG')}`
}

// ── Tabs ──────────────────────────────────────────────────────

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
  all:          { icon: 'assignment',     text: 'No orders yet.' },
  pending:      { icon: 'schedule',       text: 'No pending orders.' },
  'in-progress':{ icon: 'autorenew',     text: 'No orders in progress.' },
  completed:    { icon: 'check_circle',   text: 'No completed orders yet.' },
  delivered:    { icon: 'local_shipping', text: 'No delivered orders yet.' },
  cancelled:    { icon: 'cancel',         text: 'No cancelled orders.' },
  overdue:      { icon: 'alarm_on',       text: 'No overdue orders. Good job!' },
}

const STATUS_ICON = {
  pending:   'schedule',
  completed: 'check_circle',
  delivered: 'local_shipping',
  cancelled: 'cancel',
}

const STATUS_COLORS = {
  pending:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  'in-progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
  completed:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)'  },
  delivered:     { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
  cancelled:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.35)'},
}

const STATUS_TEXT_COLORS = {
  pending:       '#856404',
  'in-progress': '#92400e',
  completed:     '#155724',
  delivered:     '#4B2E83',
  cancelled:     '#721C24',
}

const PRIORITY_COLORS = {
  normal: { color: 'var(--text2)',  bg: 'var(--surface2)', border: 'var(--border2)' },
  urgent: { color: '#fb923c',       bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)'  },
  vip:    { color: '#a855f7',       bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)'  },
}

// ── Order Detail Panel (bottom sheet) ─────────────────────────

function OrderDetailPanel({ order, onClose }) {
  if (!order) return null
  const overdue  = isOverdue(order)
  const due      = daysUntil(order.dueDate)
  const sc       = overdue
    ? { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' }
    : STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
  const pc       = PRIORITY_COLORS[order.priority] ?? PRIORITY_COLORS.normal
  const total    = order.price && order.qty && order.qty > 1 ? order.price * order.qty : null
  const items    = order.items || []
  const stageObj = STAGES.find(s => s.value === order.stage)

  return (
    <div className={styles.detailOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.detailPanel}>
        <div className={styles.detailHandle} />

        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderTitle}>Order Details</div>
          <button onClick={onClose} className={styles.detailCloseBtn}>
            <span className="material-icons" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>

        <div className={styles.detailBody}>

          {/* Garment images / icons row */}
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
          <div className={styles.detailTitle}>{order.desc || order.name || 'Order'}</div>

          {order.customerName && (
            <div className={styles.detailCustomer}>
              <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--text3)' }}>person</span>
              {order.customerName}
            </div>
          )}

          {/* Status + priority + stage pills */}
          <div className={styles.detailPillRow}>
            <span
              className={styles.detailPill}
              style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
            >
              {overdue ? 'Overdue' : (order.status ? order.status.replace('-', ' ') : 'Pending')}
            </span>
            {order.priority && order.priority !== 'normal' && (
              <span
                className={styles.detailPill}
                style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}
              >
                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
              </span>
            )}
            {stageObj && (
              <span className={styles.detailPill} style={{ color: 'var(--text2)', background: 'var(--surface2)', borderColor: 'var(--border2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-icons" style={{ fontSize: '0.75rem' }}>{stageObj.icon}</span>
                {stageObj.label}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Price</div>
              <div className={styles.detailCellVal}>{fmt(order.price)}</div>
            </div>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Qty</div>
              <div className={styles.detailCellVal}>{order.qty ?? 1}</div>
            </div>
            {total && (
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Total</div>
                <div className={styles.detailCellVal}>{fmt(total)}</div>
              </div>
            )}
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Placed On</div>
              <div className={styles.detailCellVal} style={{ fontSize: '0.8rem' }}>
                {order.takenAt || (order.createdAt ? formatDate(
                  typeof order.createdAt.toDate === 'function'
                    ? order.createdAt.toDate().toISOString()
                    : order.createdAt
                ) : null) || order.date || '—'}
              </div>
            </div>
            <div className={styles.detailCell} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.detailCellLabel}>Due Date</div>
              <div
                className={styles.detailCellVal}
                style={{ fontSize: '0.85rem', color: overdue ? '#ef4444' : order.dueDate ? undefined : 'var(--text3)' }}
              >
                {order.dueDate
                  ? `${formatDate(order.dueDate)}${due ? ` · ${due}` : ''}`
                  : order.due || '—'}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className={styles.detailNotes}>
              <div className={styles.detailNotesLabel}>Notes</div>
              <p>{order.notes}</p>
            </div>
          )}

          {/* Linked cloth types */}
          {order.linkedNames?.length > 0 && (
            <div className={styles.detailLinked}>
              <div className={styles.detailNotesLabel}>Cloth Types</div>
              <div className={styles.detailLinkedNames}>{order.linkedNames.join(', ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

// ── Order List Item ───────────────────────────────────────────

function OrderCard({ order, isLast, onTap }) {
  const overdue  = isOverdue(order)
  const due      = daysUntil(order.dueDate)
  const thumb    = order.items?.[0]?.imgSrc
  const sc       = overdue
    ? { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    : STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
  const stageObj = STAGES.find(s => s.value === order.stage)

  return (
    <div
      className={`${styles.orderListItem} ${isLast ? styles.orderListItemLast : ''} ${overdue ? styles.orderListItemOverdue : ''}`}
      onClick={onTap}
    >
      <div className={styles.orderListOuter}>
        <div className={styles.orderListInner}>
          {thumb
            ? <img src={thumb} alt="" className={styles.orderListThumbImg} />
            : <span className="material-icons" style={{ fontSize: '1.5rem', color: overdue ? '#ef4444' : 'var(--text3)' }}>
                {overdue ? 'alarm_on' : (STATUS_ICON[order.status] || 'assignment')}
              </span>
          }
        </div>
      </div>

      <div className={styles.orderListInfo}>
        {/* Garment name */}
        <div className={styles.orderListDesc}>{order.desc || order.name || 'Order'}</div>

        {/* Customer name */}
        <div className={styles.orderListMeta}>
          <span className="material-icons" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.orderListMetaText}>{order.customerName || '—'}</span>
        </div>

        {/* Status badge — coloured pill matching homepage style */}
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

        {/* Stage — plain text with icon, no pill box */}
        {stageObj && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <span className="material-icons" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>{stageObj.icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text2)' }}>{stageObj.label}</span>
          </div>
        )}

        {/* Due date — always red */}
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

export default function Orders({ onMenuClick }) {
  const { allOrders } = useOrders()

  const [activeTab,   setActiveTab]   = useState('all')
  const [detailOrder, setDetailOrder] = useState(null)
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

  const grouped = [...filtered]
    .sort((a, b) => {
      const da = a.dueDate || a.date || ''
      const db = b.dueDate || b.date || ''
      return db.localeCompare(da)
    })
    .reduce((acc, o) => {
      const raw = o.date || o.dueDate || ''
      const key = raw ? formatDate(raw) : 'Unknown Date'
      if (!acc[key]) acc[key] = []
      acc[key].push(o)
      return acc
    }, {})

  return (
    <div className={styles.page}>
      <Header title="Orders" onMenuClick={onMenuClick} />

      {/* Tabs */}
      <div className={styles.tabs} ref={tabsRef}>
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
      <div className={styles.listArea}>
        {filtered.length === 0 ? (
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
        />
      )}
    </div>
  )
}