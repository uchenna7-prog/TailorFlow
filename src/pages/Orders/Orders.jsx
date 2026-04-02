// src/pages/Orders/Orders.jsx
// ─────────────────────────────────────────────────────────────
// Displays ALL orders across ALL customers.
// Pulls customers from CustomerContext, then subscribes to
// each customer's orders subcollection in real-time.
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import Header from '../../components/Header/Header'
import styles from './Orders.module.css'
import {useOrders} from '../../contexts/OrdersContext'

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
  const due   = new Date(dateStr + 'T00:00:00')
  const diff  = Math.round((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `${diff}d left`
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
  all:       { icon: 'assignment',    text: 'No orders yet.' },
  pending:   { icon: 'schedule',      text: 'No pending orders.' },
  completed: { icon: 'check_circle',  text: 'No completed orders yet.' },
  delivered: { icon: 'local_shipping',text: 'No delivered orders yet.' },
  cancelled: { icon: 'cancel',        text: 'No cancelled orders.' },
  overdue:   { icon: 'alarm_on',      text: 'No overdue orders. Good job!' },
}

// ── Order Card ────────────────────────────────────────────────

function OrderCard({ order }) {
  const overdue = isOverdue(order)
  const due     = daysUntil(order.dueDate)

  return (
    <div className={`${styles.card} ${overdue ? styles.overdue : ''}`}>
      <div className={styles.cardContent}>
        <div className={styles.cardTitle}>{order.desc || order.name || 'Order'}</div>
        <div className={styles.cardMeta}>
          <span className={styles.metaChip}>
            <span className="mi">person</span>
            {order.customerName || '—'}
          </span>
          {order.dueDate && (
            <span className={`${styles.metaChip} ${overdue ? styles.metaOverdue : ''}`}>
              <span className="mi">schedule</span>
              {due}
            </span>
          )}
          {order.status && (
            <span className={styles.metaChip}>
              <span className="mi">info</span>
              {order.status}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Orders({ onMenuClick }) {
  const { allOrders } = useOrders()

  const [activeTab,  setActiveTab]  = useState('all')
  const tabsRef = useRef(null)

  // ── Tab scroll helper ────────────────────────────────────
  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  // ── Filter ───────────────────────────────────────────────
  const filtered = allOrders.filter(o => {
    if (activeTab === 'all')       return true
    if (activeTab === 'pending')   return !['completed','delivered','cancelled'].includes(o.status) && !isOverdue(o)
    if (activeTab === 'completed') return o.status === 'completed'
    if (activeTab === 'delivered') return o.status === 'delivered'
    if (activeTab === 'cancelled') return o.status === 'cancelled'
    if (activeTab === 'overdue')   return isOverdue(o)
    return true
  })

  // ── Counts ───────────────────────────────────────────────
  const counts = {
    all:       allOrders.length,
    pending:   allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status) && !isOverdue(o)).length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    overdue:   allOrders.filter(o => isOverdue(o)).length,
  }

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
          filtered.map(order => (
            <OrderCard key={`${order.customerId}-${order.id}`} order={order} />
          ))
        )}
      </div>
    </div>
  )
}
