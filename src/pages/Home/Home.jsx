import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers }     from '../../contexts/CustomerContext'
import { useOrders }        from '../../contexts/OrdersContext'
import { useTasks }         from '../../contexts/TaskContext'
import { useInvoices }      from '../../contexts/InvoiceContext'
import { useAppointments }  from '../../contexts/AppointmentContext'
import { useAuth }          from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useSettings }      from '../../contexts/SettingsContext'
import { usePayments }      from '../../contexts/PaymentContext'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function isTaskOverdue(task) {
  if (!task.dueDate || task.done) return false
  return new Date(task.dueDate + 'T23:59:59') < new Date()
}

function isInvoiceOverdue(inv) {
  if (inv.status === 'paid') return false
  if (!inv.due) return false
  return new Date(inv.due + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatApptDate(dateStr, timeStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return timeStr ? `${datePart} · ${timeStr}` : datePart
}

function dueThisWeek(dateStr) {
  if (!dateStr) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end   = new Date(today); end.setDate(today.getDate() + 7)
  const due   = new Date(dateStr + 'T00:00:00')
  return due >= today && due <= end
}

function isDateInLastMonth(dateStr) {
  if (!dateStr) return false
  const now          = new Date()
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const d = new Date(dateStr)
  return d >= lastMonth && d <= lastMonthEnd
}

// ── Compact naira formatter: ₦30k, ₦1.2m, ₦500 ───────────────
function formatNairaCompact(amount) {
  if (!amount || amount <= 0) return null
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return `₦${amount.toLocaleString()}`
}

// ── Timely greeting with emoji ────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Good night'
}
function getGreetingEmoji() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return '☀️'
  if (h >= 12 && h < 17) return '👋'
  if (h >= 17 && h < 21) return '🌙'
  return '😴'
}
function formatUpdatedTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ── Random subtexts ───────────────────────────────────────────
const SUBTEXTS = [
  "Here's what's happening in your shop today.",
  "Let's see how your shop is doing right now.",
  "Your shop summary is ready, take a look.",
  "Stay on top of your shop with today's snapshot.",
  "Everything at a glance, your shop, your day.",
  "Here's your daily shop overview. Let's get to work.",
  "Check in on your orders, tasks and appointments.",
  "A fresh look at what needs your attention today.",
  "Your shop is waiting, here's what's on the list.",
  "Quick recap: here's where things stand today.",
]
function getRandomSubtext() {
  return SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)]
}

// ── Delta helper ──────────────────────────────────────────────
function makeDelta(current, previous) {
  const diff = current - previous
  if (diff > 0) return { value: diff, direction: 'up'   }
  if (diff < 0) return { value: Math.abs(diff), direction: 'down' }
  return             { value: 0,    direction: 'same'  }
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  low: '#94a3b8', normal: '#818cf8', high: '#fb923c', urgent: '#ef4444',
}
const CATEGORY_ICONS = {
  general: 'assignment', sewing: 'content_cut', delivery: 'local_shipping',
  payment: 'payments', fitting: 'checkroom', shopping: 'shopping_cart',
}
const APPT_TYPE_ICONS = {
  fitting: 'checkroom', measurement: 'straighten', delivery: 'local_shipping',
  consultation: 'chat_bubble_outline', pickup: 'inventory_2', other: 'event',
}
const APPT_STATUS_COLORS = {
  scheduled: '#818cf8', confirmed: '#22c55e', completed: '#94a3b8',
  cancelled: '#ef4444', missed: '#ef4444',
}
const ORDER_STATUS_STYLES = {
  pending:     { bg: 'rgba(234,179,8,0.12)',   color: '#a16207', border: 'rgba(234,179,8,0.3)'   },
  'in-progress':{ bg: 'rgba(59,130,246,0.12)', color: '#2563eb', border: 'rgba(59,130,246,0.3)'  },
  completed:   { bg: 'rgba(34,197,94,0.12)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'   },
  delivered:   { bg: 'rgba(129,140,248,0.12)', color: '#4f46e5', border: 'rgba(129,140,248,0.3)' },
  cancelled:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', border: 'rgba(239,68,68,0.3)'   },
}

// Production stages — must match OrdersTab
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

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function RevenueDonut({ pct }) {
  const r = 36, cx = 44, cy = 44
  const circ    = 2 * Math.PI * r
  const filled  = Math.min(Math.max(pct, 0), 100)
  const blueDash = (filled / 100) * circ
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth="8" />
      {filled > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#60a5fa" strokeWidth="8"
          strokeDasharray={`${blueDash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text)" fontSize="15" fontWeight="800">{pct}%</text>
    </svg>
  )
}

function Delta({ delta, positiveIsGood = true }) {
  if (!delta || delta.direction === 'same') return null
  const isPositive = delta.direction === 'up'
  const isGood     = positiveIsGood ? isPositive : !isPositive
  return (
    <span className={isGood ? styles.deltaUp : styles.deltaDown}>
      <span className="mi" style={{ fontSize: '0.62rem', verticalAlign: 'middle' }}>
        {isPositive ? 'arrow_upward' : 'arrow_downward'}
      </span>
      {' '}{delta.value} vs last wk
    </span>
  )
}

function StatusPill({ status }) {
  const s   = (status || 'pending').toLowerCase()
  const sty = ORDER_STATUS_STYLES[s] || ORDER_STATUS_STYLES.pending
  return (
    <span className={styles.statusPill}
      style={{ background: sty.bg, color: sty.color, borderColor: sty.border }}>
      {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

function UrgentStrip({ items, navigate }) {
  if (!items || items.length === 0) return null
  return (
    <div className={styles.urgentStrip}>
      <div className={styles.urgentStripHeader}>
        <span className={`mi ${styles.urgentStripHeaderIcon}`}>warning_amber</span>
        <span className={styles.urgentStripTitle}>Needs attention</span>
      </div>
      <div className={styles.urgentStripItems}>
        {items.map((item, i) => (
          <button key={i} className={styles.urgentItem} onClick={() => navigate(item.route)}>
            <span className={`mi ${styles.urgentItemIcon}`}>{item.icon}</span>
            <span className={styles.urgentItemText}>{item.text}</span>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', marginLeft: 'auto', flexShrink: 0 }}>chevron_right</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function RevenueGoalModal({ onSave, onClose }) {
  const [period, setPeriod]       = useState('monthly')
  const [goalInput, setGoalInput] = useState('')
  const [currency, setCurrency]   = useState('₦')

  const handleSave = () => {
    const amount = Number(goalInput.replace(/,/g, ''))
    if (!amount || amount <= 0) return
    onSave({ period, goal: amount, currency })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Set Revenue Goal</h2>
          <p className={styles.modalSub}>Choose your tracking period and target amount</p>
        </div>
        <div className={styles.modalSection}>
          <div className={styles.modalSectionLabel}>Track by</div>
          <div className={styles.periodTabs}>
            {['weekly','monthly','yearly'].map(p => (
              <button key={p}
                className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalSection}>
          <div className={styles.modalSectionLabel}>Revenue target</div>
          <div className={styles.goalInputRow}>
            <select className={styles.currencySelect} value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="₦">₦ NGN</option>
              <option value="$">$ USD</option>
              <option value="£">£ GBP</option>
              <option value="€">€ EUR</option>
            </select>
            <input className={styles.goalInput} type="number" placeholder="e.g. 500000"
              value={goalInput} onChange={e => setGoalInput(e.target.value)} min="1" />
          </div>
        </div>
        <div className={styles.periodHint}>
          {period === 'weekly'  && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>date_range</span>Resets every Monday</>}
          {period === 'monthly' && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>calendar_month</span>Resets on the 1st of each month</>}
          {period === 'yearly'  && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>event_repeat</span>Resets on January 1st each year</>}
        </div>
        <button className={styles.modalSaveBtn} onClick={handleSave}
          disabled={!goalInput || Number(goalInput) <= 0}>Save Goal</button>
        <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function NotifBanner({ onEnable, onDismiss }) {
  return (
    <div className={styles.notifBanner}>
      <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)', flexShrink: 0 }}>notifications</span>
      <div className={styles.notifBannerText}>
        <div className={styles.notifBannerTitle}>Enable Notifications</div>
        <div className={styles.notifBannerSub}>Get alerts for orders, invoices &amp; birthdays</div>
      </div>
      <div className={styles.notifBannerActions}>
        <button className={styles.notifBannerEnable} onClick={onEnable}>Allow</button>
        <button className={styles.notifBannerDismiss} onClick={onDismiss}>Not now</button>
      </div>
    </div>
  )
}

function MobileQuickActions({ navigate }) {
  return (
    <nav className={styles.mobileQuickNav}>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/customers')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>groups</span>
        <span className={styles.mobileQuickLabel}>Customers</span>
      </button>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/appointments')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>event</span>
        <span className={styles.mobileQuickLabel}>Appointments</span>
      </button>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/orders')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>shopping_cart</span>
        <span className={styles.mobileQuickLabel}>Orders</span>
      </button>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/tasks')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>assignment</span>
        <span className={styles.mobileQuickLabel}>Tasks</span>
      </button>
    </nav>
  )
}

function EmptyState({ icon, message, sub }) {
  return (
    <div className={styles.emptyState}>
      <span className={`mi ${styles.emptyStateIcon}`}>{icon}</span>
      <p className={styles.emptyStateMsg}>{message}</p>
      {sub && <p className={styles.emptyStateSub}>{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REVENUE HELPERS
// ─────────────────────────────────────────────────────────────
const REVENUE_STORAGE_KEY = 'tf_revenue_goal'

function getWindowStart(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(now.getFullYear(), 0, 1)
}

function getPrevWindowStart(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return new Date(now.getFullYear() - 1, 0, 1)
}

function periodLabel(period) {
  if (period === 'weekly')  return 'This week'
  if (period === 'monthly') return 'This month'
  return 'This year'
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
function Home({ onMenuClick }) {
  const navigate = useNavigate()
  const { user }          = useAuth()
  const { customers }     = useCustomers()
  const { allOrders }     = useOrders()
  const { tasks }         = useTasks()
  const { allInvoices }   = useInvoices()
  const {
    upcoming, todayAppointments, recent: recentAppts, missedCount, upcomingThisWeek,
  } = useAppointments()
  const { pushEnabled, requestPushPermission } = useNotifications()
  const { settings }    = useSettings()
  const { allPayments } = usePayments()

  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('tf_notif_dismissed') === 'true'
  )
  const [revenueGoal, setRevenueGoal] = useState(() => {
    try { const r = localStorage.getItem(REVENUE_STORAGE_KEY); return r ? JSON.parse(r) : null }
    catch { return null }
  })
  const [showGoalModal, setShowGoalModal] = useState(false)

  const greetingRef   = useRef(getGreeting())
  const greetEmojiRef = useRef(getGreetingEmoji())
  const subtextRef    = useRef(getRandomSubtext())
  const updatedAtRef  = useRef(new Date())

  const handleSaveGoal = data => {
    setRevenueGoal(data)
    localStorage.setItem(REVENUE_STORAGE_KEY, JSON.stringify(data))
    setShowGoalModal(false)
  }

  const showBanner = !pushEnabled && !bannerDismissed
    && 'Notification' in window && Notification.permission !== 'denied'

  const handleEnable = async () => {
    await requestPushPermission()
    setBannerDismissed(true)
    localStorage.setItem('tf_notif_dismissed', 'true')
  }
  const handleDismiss = () => {
    setBannerDismissed(true)
    localStorage.setItem('tf_notif_dismissed', 'true')
  }

  // ── Display name ──────────────────────────────────────────
  const displayName = (() => {
    const full = user?.displayName?.trim()
    if (full) { const p = full.split(/\s+/); return p.length >= 2 ? p[1] : p[0] }
    return user?.email?.split('@')[0] ?? 'there'
  })()

  // ── Date boundaries ───────────────────────────────────────
  const now       = new Date()
  const todayStr  = now.toISOString().slice(0, 10)
  const weekAgo   = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWksAgo = new Date(now); twoWksAgo.setDate(twoWksAgo.getDate() - 14)

  // ── Customers ─────────────────────────────────────────────
  const totalCustomers   = customers.length
  const newCustThisMonth = customers.filter(c => {
    if (!c.date) return false
    const d = new Date(c.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const newCustLastMonth = customers.filter(c => c.date && isDateInLastMonth(c.date)).length

  // ── Top customer (most orders + total spend) ──────────────
  const topCustomer = (() => {
    if (!customers.length) return { name: '—', orderCount: 0, totalSpend: 0 }
    const counts = {}
    const spend  = {}
    allOrders.forEach(o => {
      if (!o.customerId) return
      counts[o.customerId] = (counts[o.customerId] || 0) + 1
      spend[o.customerId]  = (spend[o.customerId]  || 0) + (Number(o.price) || 0)
    })
    let bestId = null, bestCount = 0
    Object.entries(counts).forEach(([id, cnt]) => {
      if (cnt > bestCount) { bestCount = cnt; bestId = id }
    })
    const best = bestId ? customers.find(c => c.id === bestId) : customers[0]
    if (!best) return { name: '—', orderCount: 0, totalSpend: 0 }
    return {
      name:       best.name || `${best.firstName ?? ''} ${best.lastName ?? ''}`.trim() || '—',
      orderCount: counts[best.id] || 0,
      totalSpend: spend[best.id]  || 0,
    }
  })()

  // ── Retention rate ────────────────────────────────────────
  const retentionRate = (() => {
    if (!totalCustomers) return 0
    const orderCounts = {}
    allOrders.forEach(o => {
      if (o.customerId) orderCounts[o.customerId] = (orderCounts[o.customerId] || 0) + 1
    })
    const returning = Object.values(orderCounts).filter(c => c > 1).length
    return Math.round((returning / totalCustomers) * 100)
  })()

  // ── Orders ────────────────────────────────────────────────
  const pendingOrders         = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))
  const ordersDueThisWeek     = pendingOrders.filter(o => dueThisWeek(o.dueDate || o.dueRaw)).length
  const ordersCreatedThisWeek = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= weekAgo).length
  const ordersCreatedLastWeek = allOrders.filter(o => {
    if (!o.createdAt) return false; const d = new Date(o.createdAt)
    return d >= twoWksAgo && d < weekAgo
  }).length

  // ── Invoices ──────────────────────────────────────────────
  const getInvDueDate = (i) => {
    const explicit = i.due || i.dueDate || i.due_date || i.dueOn
    if (explicit) return explicit
    let ms = null
    const ca = i.createdAt
    if (!ca) return null
    if (typeof ca.toMillis === 'function')       ms = ca.toMillis()
    else if (typeof ca.toDate === 'function')     ms = ca.toDate().getTime()
    else if (typeof ca.seconds === 'number')      ms = ca.seconds * 1000
    else if (typeof ca === 'number')              ms = ca
    else if (typeof ca === 'string')              ms = new Date(ca).getTime()
    else if (ca instanceof Date)                  ms = ca.getTime()
    if (!ms || isNaN(ms)) return null
    const dueDays = settings.invoiceDueDays ?? 7
    return new Date(ms + dueDays * 86400000).toISOString().slice(0, 10)
  }
  const isInvOverdue = (i) => {
    if (i.status === 'paid') return false
    const due = getInvDueDate(i)
    if (!due) return false
    return new Date(due + 'T23:59:59') < new Date()
  }
  const unpaidInvoices  = allInvoices.filter(i => i.status !== 'paid' && !isInvOverdue(i))
  const overdueInvoices = allInvoices.filter(i => isInvOverdue(i))
  const totalUnpaid     = unpaidInvoices.length
  const totalOverdue    = overdueInvoices.length
  const invThisWeek     = allInvoices.filter(i => i.createdAt && new Date(i.createdAt) >= weekAgo).length
  const invLastWeek     = allInvoices.filter(i => {
    if (!i.createdAt) return false; const d = new Date(i.createdAt)
    return d >= twoWksAgo && d < weekAgo
  }).length
  const invoicesDueThisWeek = unpaidInvoices.filter(i => dueThisWeek(getInvDueDate(i))).length

  // ── Revenue ───────────────────────────────────────────────
  const revenueOrders = allOrders.filter(o => ['completed','delivered'].includes(o.status))
  const windowStart   = revenueGoal ? getWindowStart(revenueGoal.period) : null
  const prevStart     = revenueGoal ? getPrevWindowStart(revenueGoal.period) : null
  const earnedInWindow = revenueGoal
    ? revenueOrders.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt) : null
        return d && d >= windowStart
      }).reduce((sum, o) => sum + (Number(o.price) || 0), 0)
    : 0
  const earnedInPrevWindow = revenueGoal
    ? revenueOrders.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt) : null
        return d && d >= prevStart && d < windowStart
      }).reduce((sum, o) => sum + (Number(o.price) || 0), 0)
    : 0
  const pct = revenueGoal ? Math.min(Math.round((earnedInWindow / revenueGoal.goal) * 100), 100) : 0

  // ── Recent lists ──────────────────────────────────────────
  const recentOrders = [...allOrders]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5)

  const recentTasks = [...tasks]
    .filter(t => !t.done)
    .sort((a, b) => {
      const aOver = isTaskOverdue(a), bOver = isTaskOverdue(b)
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      return 0
    })
    .slice(0, 5)

  const pastAppointments = [...(recentAppts || [])]
    .filter(a => ['completed','cancelled','missed'].includes(a.status))
    .slice(0, 3)

  // ── Urgent items ──────────────────────────────────────────
  const urgentItems = []
  if (ordersDueThisWeek > 0)
    urgentItems.push({ icon: 'shopping_bag', text: `${ordersDueThisWeek} order${ordersDueThisWeek > 1 ? 's' : ''} due this week`, route: '/orders' })
  if (totalOverdue > 0)
    urgentItems.push({ icon: 'receipt_long', text: `${totalOverdue} overdue invoice${totalOverdue > 1 ? 's' : ''}`, route: '/invoices' })
  if (missedCount > 0)
    urgentItems.push({ icon: 'event_busy', text: `${missedCount} missed appointment${missedCount > 1 ? 's' : ''}`, route: '/appointments' })

  // ── Order/invoice delta ───────────────────────────────────
  const orderDelta  = makeDelta(ordersCreatedThisWeek, ordersCreatedLastWeek)
  const invoiceDelta = makeDelta(invThisWeek, invLastWeek)

  return (
    <div className={styles.pageWrapper}>
      <Header type="menu" title="Dashboard" onMenuClick={onMenuClick} showNotifications />

      {showGoalModal && (
        <RevenueGoalModal onSave={handleSaveGoal} onClose={() => setShowGoalModal(false)} />
      )}

      <main className={styles.main}>

        {/* ── HERO ── */}
        <div className={styles.hero}>
          <p className={styles.welcomeLabel}>
            {greetingRef.current}
            <span className={styles.greetingEmoji}>{greetEmojiRef.current}</span>
          </p>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>{subtextRef.current}</p>
          <div className={styles.updatedAt}>
            <span className="mi" style={{ fontSize: '0.72rem' }}>schedule</span>
            Updated at {formatUpdatedTime(updatedAtRef.current)}
          </div>
        </div>

        {/* ── NOTIFICATION BANNER ── */}
        {showBanner && <NotifBanner onEnable={handleEnable} onDismiss={handleDismiss} />}

        {/* ── URGENT STRIP ── */}
        <UrgentStrip items={urgentItems} navigate={navigate} />

        {/* ── STAT CARDS ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => navigate('/orders')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>shopping_bag</span>
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statValue}>{pendingOrders.length}</div>
              <div className={styles.statLabel}>Active Orders</div>
              <Delta delta={orderDelta} />
              {ordersDueThisWeek > 0 && (
                <div className={styles.statSub} style={{ color: '#ef4444' }}>
                  {ordersDueThisWeek} due this week
                </div>
              )}
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/invoices')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>receipt_long</span>
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statValue}>{totalUnpaid}</div>
              <div className={styles.statLabel}>Unpaid Invoices</div>
              <Delta delta={invoiceDelta} positiveIsGood={false} />
              {totalOverdue > 0 && (
                <div className={styles.statSub} style={{ color: '#ef4444' }}>
                  {totalOverdue} overdue
                </div>
              )}
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/appointments')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>event</span>
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statValue}>{upcoming.length}</div>
              <div className={styles.statLabel}>Upcoming Appts</div>
              {upcomingThisWeek > 0 && (
                <div className={styles.statSub} style={{ color: 'var(--accent)' }}>
                  {upcomingThisWeek} this week
                </div>
              )}
              {missedCount > 0 && (
                <div className={styles.statSub} style={{ color: '#ef4444' }}>
                  {missedCount} missed
                </div>
              )}
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/tasks')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>assignment</span>
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statValue}>{recentTasks.length}</div>
              <div className={styles.statLabel}>Open Tasks</div>
              {recentTasks.filter(isTaskOverdue).length > 0 && (
                <div className={styles.statSub} style={{ color: '#ef4444' }}>
                  {recentTasks.filter(isTaskOverdue).length} overdue
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── REVENUE CARD ── */}
        <div className={styles.revenueCard} onClick={() => setShowGoalModal(true)}>
          {revenueGoal ? (
            <>
              <div className={styles.revenueCardLeft}>
                <div className={styles.revenueLabel}>{periodLabel(revenueGoal.period)} Revenue</div>
                <div className={styles.revenueAmount}>
                  {revenueGoal.currency}{earnedInWindow.toLocaleString()}
                </div>
                <div className={styles.revenueTarget}>
                  Goal: {revenueGoal.currency}{revenueGoal.goal.toLocaleString()}
                </div>
                <div className={styles.revenueVs}>
                  <Delta delta={makeDelta(earnedInWindow, earnedInPrevWindow)} />
                </div>
              </div>
              <div className={styles.revenueDonutWrap}>
                <RevenueDonut pct={pct} />
              </div>
            </>
          ) : (
            <>
              <div className={styles.revenueCardLeft}>
                <div className={styles.revenueEmptyTitle}>Set a Revenue Goal</div>
                <div className={styles.revenueEmptySub}>Track weekly, monthly or yearly progress</div>
              </div>
              <div className={styles.revenueEmptyIconWrap}>
                <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>track_changes</span>
              </div>
            </>
          )}
        </div>

        {/* ── CUSTOMER INSIGHTS ── */}
        <div className={styles.customerCard} onClick={() => navigate('/customers')}>
          <div className={styles.customerCardHeader}>
            <span className={styles.customerCardSectionLabel}>Customer Insights</span>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>chevron_right</span>
          </div>
          <div className={styles.customerHeroBlock}>
            <div className={styles.customerHeroNumber}>{totalCustomers}</div>
            <div className={styles.customerHeroLabel}>Total Customers</div>
          </div>
          <div className={styles.customerCardRule} />
          <div className={styles.customerStatStack}>
            <div className={styles.customerStatRow}>
              <span className={styles.customerStatLbl}>New this month</span>
              <span className={styles.customerStatVal}>{newCustThisMonth}</span>
            </div>
            <div className={styles.customerStatRow}>
              <span className={styles.customerStatLbl}>Retention rate</span>
              <span className={styles.customerStatVal}>{retentionRate}%</span>
            </div>
            <div className={styles.customerStatRow}>
              <span className={styles.customerStatLbl}>Top customer</span>
              <div className={styles.customerTopVal}>
                {topCustomer.name}
                {topCustomer.orderCount > 0 && (
                  <span className={styles.customerTopMeta}>
                    {topCustomer.orderCount} orders · {formatNairaCompact(topCustomer.totalSpend) || '₦0'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TODAY'S APPOINTMENTS ── */}
        {todayAppointments && todayAppointments.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Today's Appointments</h3>
              <button className={styles.seeAllBtn} onClick={() => navigate('/appointments')}>See all</button>
            </div>
            <div className={styles.listSection}>
              <div className={styles.listDivider} />
              {todayAppointments.map((appt, idx) => {
                const isLast    = idx === todayAppointments.length - 1
                const iconColor = APPT_STATUS_COLORS[appt.status] || '#818cf8'
                return (
                  <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div className={styles.listOuter} style={{ borderColor: `${iconColor}40`, background: `${iconColor}08` }}>
                      <div className={styles.listInner}>
                        <span className="mi" style={{ fontSize: '1.3rem', color: iconColor }}>
                          {APPT_TYPE_ICONS[appt.type] || 'event'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.listInfo}>
                      <div className={styles.listDesc}>{appt.title || appt.type || 'Appointment'}</div>
                      {appt.customerName && (
                        <div className={styles.listMeta}>
                          <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                          <span className={styles.listMetaText}>{appt.customerName}</span>
                        </div>
                      )}
                      <div className={styles.listMeta}>
                        <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>schedule</span>
                        <span className={styles.listMetaText}>{formatApptDate(appt.date, appt.time)}</span>
                      </div>
                      <span className={styles.listApptToday}>Today</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── PAST APPOINTMENTS ── */}
        {pastAppointments.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Past Appointments</h3>
              <button className={styles.seeAllBtn} onClick={() => navigate('/appointments')}>See all</button>
            </div>
            <div className={styles.listSection}>
              <div className={styles.listDivider} />
              {pastAppointments.map((appt, idx) => {
                const isLast    = idx === pastAppointments.length - 1
                const iconColor = appt.status === 'completed' ? '#22c55e'
                  : appt.status === 'cancelled' ? '#94a3b8' : '#ef4444'
                return (
                  <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div className={styles.listOuter} style={
                      appt.status === 'completed'
                        ? { borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.04)' }
                        : appt.status === 'cancelled'
                        ? { borderColor: 'rgba(148,163,184,0.3)' }
                        : { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }
                    }>
                      <div className={styles.listInner}>
                        <span className="mi" style={{ fontSize: '1.3rem', color: iconColor }}>
                          {APPT_TYPE_ICONS[appt.type] || 'event'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.listInfo}>
                      <div className={styles.listDesc}>{appt.title || appt.type || 'Appointment'}</div>
                      {appt.customerName && (
                        <div className={styles.listMeta}>
                          <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                          <span className={styles.listMetaText}>{appt.customerName}</span>
                        </div>
                      )}
                      <div className={styles.listMeta}>
                        <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>schedule</span>
                        <span className={styles.listMetaText}
                          style={{ color: appt.status === 'missed' ? '#ef4444' : undefined }}>
                          {formatApptDate(appt.date, appt.time)}
                        </span>
                      </div>
                      <div className={styles.listApptStatus}
                        style={{ color: iconColor, borderColor: `${iconColor}40`, background: `${iconColor}12` }}>
                        {appt.status === 'completed' ? 'Completed' : appt.status === 'cancelled' ? 'Cancelled' : 'Missed'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── QUICK ACTIONS — desktop only ── */}
        <section className={styles.quickActionsDesktop}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
          <div className={styles.statsGrid}>
            {[
              { icon: 'person_add', label: 'Add Customer',     route: '/customers'    },
              { icon: 'event',      label: 'Book Appointment', route: '/appointments' },
              { icon: 'assignment', label: 'New Task',         route: '/tasks'        },
              { icon: 'receipt',    label: 'New Invoice',      route: '/invoices'     },
            ].map(a => (
              <div key={a.label} className={styles.actionCard} onClick={() => navigate(a.route)}>
                <div className={styles.statIconWrap}>
                  <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>{a.icon}</span>
                </div>
                <div className={styles.actionCardText}>
                  <div className={styles.actionLabel}>{a.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT ORDERS ── */}
        {recentOrders.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Orders</h3>
              <button className={styles.seeAllBtn} onClick={() => navigate('/orders')}>See all</button>
            </div>
            <div className={styles.listSection}>
              <div className={styles.listDivider} />
              {recentOrders.map((order, idx) => {
                const isLast   = idx === recentOrders.length - 1
                const priceStr = order.price != null ? `₦${Number(order.price).toLocaleString()}` : '—'
                const thumb    = order.items?.[0]?.imgSrc
                const stageObj = STAGES.find(s => s.value === order.stage)
                return (
                  <div key={order.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div className={styles.listOuter}>
                      <div className={styles.listInner}>
                        {thumb
                          ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} />
                          : <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--text3)' }}>content_cut</span>
                        }
                      </div>
                    </div>
                    <div className={styles.listInfo}>
                      <div className={styles.listDesc}>{order.desc ?? 'Order'}</div>
                      <div className={styles.listMeta}>
                        <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                        <span className={styles.listMetaText}>{order.customerName || '—'}</span>
                      </div>
                      <StatusPill status={order.status} />
                      {stageObj && (
                        <div className={styles.listStageLine}>
                          <span className="mi" style={{ fontSize: '0.78rem' }}>{stageObj.icon}</span>
                          {stageObj.label}
                        </div>
                      )}
                      {(order.due || order.dueRaw) && (
                        <div className={styles.listDue}>Due {order.due || formatDate(order.dueRaw)}</div>
                      )}
                    </div>
                    <div className={styles.listRight}>
                      <div className={styles.listPrice}>{priceStr}</div>
                      {order.qty > 1 && <div className={styles.listQty}>×{order.qty}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── RECENT TASKS ── */}
        {recentTasks.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Tasks</h3>
              <button className={styles.seeAllBtn} onClick={() => navigate('/tasks')}>See all</button>
            </div>
            <div className={styles.listSection}>
              <div className={styles.listDivider} />
              {recentTasks.map((task, idx) => {
                const isLast    = idx === recentTasks.length - 1
                const overdue   = isTaskOverdue(task)
                const iconColor = overdue ? '#ef4444' : (PRIORITY_COLORS[task.priority] || '#818cf8')
                const catIcon   = CATEGORY_ICONS[task.category] || 'assignment'
                return (
                  <div key={task.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div className={styles.listOuter}
                      style={overdue ? { borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.05)' } : {}}>
                      <div className={styles.listInner}>
                        <span className="mi" style={{ fontSize: '1.3rem', color: iconColor }}>{catIcon}</span>
                      </div>
                    </div>
                    <div className={styles.listInfo}>
                      <div className={styles.listDesc}>{task.desc}</div>
                      {task.customerName && (
                        <div className={styles.listMeta}>
                          <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                          <span className={styles.listMetaText}>{task.customerName}</span>
                        </div>
                      )}
                      <div className={styles.listMeta}>
                        <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>flag</span>
                        <span className={styles.listMetaText} style={{ color: overdue ? '#ef4444' : undefined }}>
                          {overdue ? 'Overdue' : (task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Normal')}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className={styles.listDue}>Due {formatDate(task.dueDate)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>

      <MobileQuickActions navigate={navigate} />
    </div>
  )
}

export default Home
