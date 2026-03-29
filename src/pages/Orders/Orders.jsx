import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import styles from './Orders.module.css'

// ── STORAGE ──
const ORDERS_KEY = 'tailorbook_orders'

function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// ── HELPERS ──
function isOverdue(order) {
  if (!order.dueDate || order.status === 'completed') return false
  return new Date(order.dueDate + 'T23:59:59') < new Date()
}

function daysUntil(dateStr) {
  if (!dateStr) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24))

  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `${diff}d left`
}

// ── TABS ──
const TABS = [
  { id: 'all', label: 'All', icon: 'assignment' },
  { id: 'pending', label: 'Pending', icon: 'schedule' },
  { id: 'completed', label: 'Completed', icon: 'check_circle' },
  { id: 'overdue', label: 'Overdue', icon: 'alarm_on' },
]

// ── ORDER CARD ──
function OrderCard({ order }) {
  const overdue = isOverdue(order)
  const due = daysUntil(order.dueDate)

  return (
    <div className={`${styles.card} ${overdue ? styles.overdue : ''}`}>
      <div className={styles.cardContent}>
        <div className={styles.cardTitle}>{order.desc}</div>

        <div className={styles.cardMeta}>
          <span className={styles.metaChip}>
            <span className="mi">person</span>
            {order.customerName}
          </span>

          {order.dueDate && (
            <span className={`${styles.metaChip} ${overdue ? styles.metaOverdue : ''}`}>
              <span className="mi">schedule</span>
              {due}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function Orders({ onMenuClick }) {
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    setOrders(loadOrders())
  }, [])

  // ── FILTER ──
  const filtered = orders.filter(o => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return o.status !== 'completed' && !isOverdue(o)
    if (activeTab === 'completed') return o.status === 'completed'
    if (activeTab === 'overdue') return isOverdue(o)
    return true
  })

  // ── COUNTS ──
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status !== 'completed' && !isOverdue(o)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    overdue: orders.filter(o => isOverdue(o)).length,
  }

  // ── EMPTY STATE CONFIG ──
  const EMPTY_CONFIG = {
    all: {
      icon: 'assignment',
      text: 'No orders yet.'
    },
    pending: {
      icon: 'schedule',
      text: 'No pending orders.'
    },
    completed: {
      icon: 'check_circle',
      text: 'No completed orders yet.'
    },
    overdue: {
      icon: 'alarm_on',
      text: 'No overdue orders. Good job!'
    }
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      {/* ── TABS ── */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mi">{tab.icon}</span>
            {tab.label}

            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'overdue' ? styles.badgeOverdue : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── LIST ── */}
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
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  )
}