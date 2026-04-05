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
  { id: 'all',       label: 'All',       icon: 'assignment'     },
  { id: 'pending',   label: 'Pending',   icon: 'schedule'       },
  { id: 'completed', label: 'Completed', icon: 'check_circle'   },
  { id: 'delivered', label: 'Delivered', icon: 'local_shipping'  },
  { id: 'cancelled', label: 'Cancelled', icon: 'cancel'         },
  { id: 'overdue',   label: 'Overdue',   icon: 'alarm_on'       },
]

const EMPTY_CONFIG = {
  all:       { icon: 'assignment',     text: 'No orders yet.' },
  pending:   { icon: 'schedule',       text: 'No pending orders.' },
  completed: { icon: 'check_circle',   text: 'No completed orders yet.' },
  delivered: { icon: 'local_shipping', text: 'No delivered orders yet.' },
  cancelled: { icon: 'cancel',         text: 'No cancelled orders.' },
  overdue:   { icon: 'alarm_on',       text: 'No overdue orders. Good job!' },
}

const STATUS_ICON = {
  pending:   'schedule',
  completed: 'check_circle',
  delivered: 'local_shipping',
  cancelled: 'cancel',
}

const STATUS_COLORS = {
  pending:   { color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.3)'  },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)'   },
  delivered: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)'  },
  cancelled: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' },
}

const STATUS_TEXT_COLORS = {
  pending:   '#856404',
  completed: '#155724',
  delivered: '#4B2E83',
  cancelled: '#721C24',
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
  const sc       = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
  const pc       = PRIORITY_COLORS[order.priority] ?? PRIORITY_COLORS.normal
  const total    = order.price && order.qty ? order.price * order.qty : order.price

  return (
    <div className={styles.detailOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.detailPanel}>
        <div className={styles.detailHandle} />

        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderTitle}>Order Details</div>
          <button onClick={onClose} className={styles.detailCloseBtn}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>

        <div className={styles.detailBody}>
          {/* Title + customer */}
          <div className={styles.detailTitle}>{order.desc || order.name || 'Order'}</div>

          {order.customerName && (
            <div className={styles.detailCustomer}>
              <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>person</span>
              {order.customerName}
            </div>
          )}

          {/* Status + priority pills */}
          <div className={styles.detailPillRow}>
            <span
              className={styles.detailPill}
              style={{ color: overdue ? '#ef4444' : sc.color, background: overdue ? 'rgba(239,68,68,0.1)' : sc.bg, borderColor: overdue ? 'rgba(239,68,68,0.3)' : sc.border }}
            >
              {overdue ? 'Overdue' : (order.status || 'Pending')}
            </span>
            {order.priority && order.priority !== 'normal' && (
              <span
                className={styles.detailPill}
                style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}
              >
                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
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
            {total && order.qty > 1 && (
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Total</div>
                <div className={styles.detailCellVal}>{fmt(total)}</div>
              </div>
            )}
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Placed On</div>
              <div className={styles.detailCellVal} style={{ fontSize: '0.8rem' }}>{order.date || '—'}</div>
            </div>
            {order.dueDate && (
              <div className={styles.detailCell} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.detailCellLabel}>Due Date</div>
                <div
                  className={styles.detailCellVal}
                  style={{ fontSize: '0.85rem', color: overdue ? '#ef4444' : undefined }}
                >
                  {formatDate(order.dueDate)}{due ? ` · ${due}` : ''}
                </div>
              </div>
            )}
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

// ── Order List Item ───────────────────────────────────────────

function OrderCard({ order, isLast, onTap }) {
  const overdue = isOverdue(order)
  const due     = daysUntil(order.dueDate)
  const thumb   = order.items?.[0]?.imgSrc

  return (
    <div
      className={`${styles.orderListItem} ${isLast ? styles.orderListItemLast : ''} ${overdue ? styles.orderListItemOverdue : ''}`}
      onClick={onTap}
    >
      <div className={styles.orderListOuter}>
        <div className={styles.orderListInner}>
          {thumb
            ? <img src={thumb} alt="" className={styles.orderListThumbImg} />
            : <span className="mi" style={{ fontSize: '1.5rem', color: overdue ? '#ef4444' : 'var(--text3)' }}>
                {overdue ? 'alarm_on' : (STATUS_ICON[order.status] || 'assignment')}
              </span>
          }
        </div>
      </div>

      <div className={styles.orderListInfo}>
        <div className={styles.orderListDesc}>{order.desc || order.name || 'Order'}</div>
        <div className={styles.orderListMeta}>
          <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.orderListMetaText}>{order.customerName || '—'}</span>
        </div>
        {order.status && (
          <div className={styles.orderListMeta}>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>autorenew</span>
            <span
              className={styles.orderListMetaText}
              style={{ color: overdue ? '#8A4B00' : (STATUS_TEXT_COLORS[order.status] ?? undefined) }}
            >
              {overdue ? 'overdue' : order.status}
            </span>
          </div>
        )}
        {order.dueDate && (
          <div className={`${styles.orderListDue} ${overdue ? styles.orderListDueOverdue : ''}`}>
            Due On {formatDate(order.dueDate)}{due ? ` · ${due}` : ''}
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
    if (activeTab === 'all')       return true
    if (activeTab === 'pending')   return !['completed','delivered','cancelled'].includes(o.status) && !isOverdue(o)
    if (activeTab === 'completed') return o.status === 'completed'
    if (activeTab === 'delivered') return o.status === 'delivered'
    if (activeTab === 'cancelled') return o.status === 'cancelled'
    if (activeTab === 'overdue')   return isOverdue(o)
    return true
  })

  const counts = {
    all:       allOrders.length,
    pending:   allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status) && !isOverdue(o)).length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    overdue:   allOrders.filter(o => isOverdue(o)).length,
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
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>
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
