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
  pending:   { bg: 'rgba(234,179,8,0.12)',   color: '#a16207', border: 'rgba(234,179,8,0.3)'   },
  completed: { bg: 'rgba(34,197,94,0.12)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'   },
  delivered: { bg: 'rgba(129,140,248,0.12)', color: '#4f46e5', border: 'rgba(129,140,248,0.3)' },
  cancelled: { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', border: 'rgba(239,68,68,0.3)'   },
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function RevenueDonut({ pct }) {
  const r = 36, cx = 44, cy = 44
  const circ   = 2 * Math.PI * r
  const filled = Math.min(Math.max(pct, 0), 100)
  const dash   = (filled / 100) * circ
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border2,#e2e8f0)" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f472b6" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#60a5fa" strokeWidth="8"
        strokeDasharray={`${circ - dash} ${circ}`} strokeDashoffset={-dash} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text)" fontSize="15" fontWeight="800">{pct}%</text>
    </svg>
  )
}

// ── Delta: renders nothing when there's no change ────────────
function Delta({ delta, positiveIsGood = true }) {
  // No change → render nothing at all
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
      {s.charAt(0).toUpperCase() + s.slice(1)}
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

  // ── Best customer (most orders) ───────────────────────────
  const bestCustomerName = (() => {
    if (!customers.length) return '—'
    const counts = {}
    allOrders.forEach(o => {
      if (o.customerId) counts[o.customerId] = (counts[o.customerId] || 0) + 1
    })
    let bestId = null, bestCount = 0
    Object.entries(counts).forEach(([id, cnt]) => {
      if (cnt > bestCount) { bestCount = cnt; bestId = id }
    })
    const best = bestId ? customers.find(c => c.id === bestId) : customers[0]
    if (!best) return '—'
    return best.name || `${best.firstName ?? ''} ${best.lastName ?? ''}`.trim() || '—'
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
  const unpaidInvoices  = allInvoices.filter(i => i.status !== 'paid' && !isInvoiceOverdue(i))
  const overdueInvoices = allInvoices.filter(i => isInvoiceOverdue(i))
  const totalUnpaid     = unpaidInvoices.length
  const totalOverdue    = overdueInvoices.length
  const invThisWeek     = allInvoices.filter(i => i.createdAt && new Date(i.createdAt) >= weekAgo).length
  const invLastWeek     = allInvoices.filter(i => {
    if (!i.createdAt) return false; const d = new Date(i.createdAt)
    return d >= twoWksAgo && d < weekAgo
  }).length

  // ── Tasks ─────────────────────────────────────────────────
  const pendingTasks     = tasks.filter(t => !t.done && !isTaskOverdue(t))
  const overdueTasks     = tasks.filter(t => isTaskOverdue(t))
  const tasksDueThisWeek = pendingTasks.filter(t => dueThisWeek(t.dueDate)).length
  const tasksThisWeek    = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= weekAgo).length
  const tasksLastWeek    = tasks.filter(t => {
    if (!t.createdAt) return false; const d = new Date(t.createdAt)
    return d >= twoWksAgo && d < weekAgo
  }).length

  // ── Appointments ──────────────────────────────────────────
  const todayCount   = todayAppointments.length
  const apptThisWeek = upcoming.filter(a => dueThisWeek(a.date)).length
  const apptLastWeek = recentAppts.filter(a => {
    if (!a.date) return false
    const d = new Date(a.date + 'T00:00:00')
    return d >= twoWksAgo && d < weekAgo
  }).length

  // ── Revenue ───────────────────────────────────────────────
  const calcRevenue = (sinceDate, beforeDate = null) => {
    if (!revenueGoal) return 0
    return allPayments.flatMap(p => {
      const insts = p.installments || []
      if (!insts.length) return []
      return insts
        .filter(inst => {
          const ds = inst.date || p.date
          if (!ds) return false
          const d = new Date(ds)
          if (d < sinceDate) return false
          if (beforeDate && d >= beforeDate) return false
          return true
        })
        .map(inst => Number(inst.amount) || 0)
    }).reduce((s, a) => s + a, 0)
  }

  const revenueEarned     = revenueGoal ? calcRevenue(getWindowStart(revenueGoal.period)) : 0
  const revenuePrevPeriod = revenueGoal ? calcRevenue(getPrevWindowStart(revenueGoal.period), getWindowStart(revenueGoal.period)) : 0
  const revenuePct        = revenueGoal?.goal > 0 ? Math.min(Math.round((revenueEarned / revenueGoal.goal) * 100), 100) : 0
  const revenueDiff       = revenueEarned - revenuePrevPeriod
  const revenueUp         = revenueDiff >= 0

  // ── Urgent items ──────────────────────────────────────────
  const urgentItems = []
  const soonAppt = upcoming.find(a => {
    if (!a.date || !a.time || a.date !== todayStr) return false
    const [hh, mm] = a.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(hh, mm, 0, 0)
    const diff = apptTime - Date.now()
    return diff > 0 && diff < 2 * 60 * 60 * 1000
  })
  if (soonAppt) {
    const [hh, mm] = soonAppt.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(hh, mm, 0, 0)
    const minsLeft = Math.round((apptTime - Date.now()) / 60000)
    urgentItems.push({
      icon:  APPT_TYPE_ICONS[soonAppt.type] || 'event',
      text:  `Appointment in ${minsLeft} min${minsLeft !== 1 ? 's' : ''}${soonAppt.customerName ? ` · ${soonAppt.customerName}` : ''}`,
      route: '/appointments',
    })
  }
  if (overdueTasks.length > 0) urgentItems.push({
    icon: 'assignment_late',
    text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
    route: '/tasks',
  })
  const ordersDueToday = pendingOrders.filter(o => (o.dueDate || o.dueRaw) === todayStr).length
  if (ordersDueToday > 0) urgentItems.push({
    icon: 'local_shipping',
    text: `${ordersDueToday} order${ordersDueToday > 1 ? 's' : ''} due today`,
    route: '/orders',
  })
  if (totalOverdue > 0) urgentItems.push({
    icon: 'receipt_long',
    text: `${totalOverdue} overdue invoice${totalOverdue > 1 ? 's' : ''}`,
    route: '/invoices',
  })

  // ── Recent lists ──────────────────────────────────────────
  const recentOrders       = [...pendingOrders].slice(0, 4)
  const recentTasks        = tasks.filter(t => !t.done).slice(0, 4)
  const recentAppointments = upcoming.slice(0, 4)
  const pastAppointments   = recentAppts.slice(0, 4)

  // ── Stat cards ────────────────────────────────────────────
  // Sub-text colour logic:
  //   • Red   → overdue / missed / alert state
  //   • Amber → approaching deadline (due this week) / warning
  //   • var(--text3) (neutral muted) → normal info (this wk count with no urgency)
  const statCards = [
    {
      desktopIcon: 'shopping_bag', bgIcon: 'shopping_bag',
      iconColor:   '#f59e0b',      value: pendingOrders.length,
      label:       'Pending Orders',
      sub:         ordersDueThisWeek > 0
                     ? `${ordersDueThisWeek} due this wk`
                     : ordersCreatedThisWeek > 0
                       ? `${ordersCreatedThisWeek} this wk`
                       : null,
      subColor:    ordersDueThisWeek > 0 ? '#fb923c' : 'var(--text3)',
      delta:       makeDelta(ordersCreatedThisWeek, ordersCreatedLastWeek),
      positiveIsGood: true,        route: '/orders',
    },
    {
      desktopIcon: 'receipt_long', bgIcon: 'receipt_long',
      iconColor:   '#ef4444',      value: totalUnpaid,
      label:       'Unpaid Invoices',
      sub:         totalOverdue > 0
                     ? `${totalOverdue} overdue`
                     : invThisWeek > 0
                       ? `${invThisWeek} this wk`
                       : null,
      subColor:    totalOverdue > 0 ? '#ef4444' : 'var(--text3)',
      delta:       makeDelta(invThisWeek, invLastWeek),
      positiveIsGood: false,       route: '/invoices',
    },
    {
      desktopIcon: 'event',        bgIcon: 'today',
      iconColor:   '#06b6d4',      value: todayCount,
      label:       "Today's Appts",
      sub:         missedCount > 0
                     ? `${missedCount} missed`
                     : upcomingThisWeek > 0
                       ? `${upcomingThisWeek} this wk`
                       : null,
      subColor:    missedCount > 0 ? '#ef4444' : 'var(--text3)',
      delta:       makeDelta(apptThisWeek, apptLastWeek),
      positiveIsGood: true,        route: '/appointments',
    },
    {
      desktopIcon: 'task_alt',     bgIcon: 'checklist',
      iconColor:   '#22c55e',      value: pendingTasks.length,
      label:       'Pending Tasks',
      sub:         tasksDueThisWeek > 0
                     ? `${tasksDueThisWeek} due this wk`
                     : tasksThisWeek > 0
                       ? `${tasksThisWeek} this wk`
                       : null,
      subColor:    tasksDueThisWeek > 0 ? '#fb923c' : 'var(--text3)',
      delta:       makeDelta(tasksThisWeek, tasksLastWeek),
      positiveIsGood: false,       route: '/tasks',
    },
  ]

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>

        {/* ── HERO — no date, emoji greeting ── */}
        <section className={styles.hero}>
          <p className={styles.welcomeLabel}>
            {greetingRef.current}
            <span className={styles.greetingEmoji}>{greetEmojiRef.current}</span>
          </p>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>{subtextRef.current}</p>
          <p className={styles.updatedAt}>
            <span className="mi" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px' }}>update</span>
            Updated at {formatUpdatedTime(updatedAtRef.current)}
          </p>
        </section>

        {/* ── NOTIFICATION BANNER ── */}
        {showBanner && <NotifBanner onEnable={handleEnable} onDismiss={handleDismiss} />}

        {/* ── URGENT STRIP ── */}
        <UrgentStrip items={urgentItems} navigate={navigate} />

        {/* 1. STAT CARDS GRID ── */}
        <section className={styles.statsGrid}>
          {statCards.map((card, i) => (
            <div key={i} className={styles.statCard} onClick={() => navigate(card.route)}>
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: card.iconColor }}>
                  {card.desktopIcon}
                </span>
              </div>
              <div className={styles.statCardBody}>
                <div className={styles.statLabel}>{card.label}</div>
                <div className={styles.statValue}>{card.value}</div>
                {/* Only render sub-text when there's something meaningful to show */}
                {card.sub && (
                  <div className={styles.statSub} style={{ color: card.subColor }}>{card.sub}</div>
                )}
                <Delta delta={card.delta} positiveIsGood={card.positiveIsGood} />
              </div>
              <span className={`mi ${styles.statBgIcon}`}>{card.bgIcon}</span>
            </div>
          ))}
        </section>

        {/* 2. REVENUE CARD — full width ── */}
        {!revenueGoal ? (
          <div className={styles.revenueCard} onClick={() => setShowGoalModal(true)}
            style={{ justifyContent: 'flex-start', gap: '20px' }}>
            <div className={styles.revenueEmptyIconWrap}>
              <span className="mi" style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>ads_click</span>
            </div>
            <div className={styles.revenueCardLeft} style={{ gap: '2px' }}>
              <div className={styles.revenueEmptyTitle}>Set your first goal</div>
              <div className={styles.revenueEmptySub}>Tap here to track your shop's revenue growth</div>
            </div>
          </div>
        ) : (
          <div className={styles.revenueCard} onClick={() => setShowGoalModal(true)}>
            <div className={styles.revenueCardLeft}>
              <div className={styles.revenueLabel}>{periodLabel(revenueGoal.period)} · Revenue</div>
              <div className={styles.revenueAmount}>
                {revenueGoal.currency}{revenueEarned.toLocaleString()}
              </div>
              <div className={styles.revenueTarget}>
                Goal: {revenueGoal.currency}{revenueGoal.goal.toLocaleString()}
              </div>
              {/* Only show vs-last-period row when there's an actual difference */}
              {revenueDiff !== 0 && (
                <div className={styles.revenueVs}>
                  <span className="mi" style={{
                    fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px',
                    color: revenueUp ? '#22c55e' : '#ef4444'
                  }}>{revenueUp ? 'arrow_upward' : 'arrow_downward'}</span>
                  <span style={{ color: revenueUp ? '#22c55e' : '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
                    {revenueGoal.currency}{Math.abs(revenueDiff).toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: '0.7rem', marginLeft: '3px' }}>
                    vs last {revenueGoal.period === 'weekly' ? 'week' : revenueGoal.period === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              )}
              {/* Sparkline removed — donut is sufficient visual */}
            </div>
            <div className={styles.revenueDonutWrap}>
              <RevenueDonut pct={revenuePct} />
            </div>
          </div>
        )}

        {/* 3. CUSTOMER INSIGHTS CARD — full width ── */}
        <div className={styles.customerCard} onClick={() => navigate('/customers')}>

          {/* Section label + chevron */}
          <div className={styles.customerCardHeader}>
            <span className={styles.customerCardSectionLabel}>Customer Insights</span>
            <span className="mi" style={{ fontSize: '0.95rem', color: 'var(--text3)' }}>chevron_right</span>
          </div>

          {/* Hero: big number + label side by side (like Stripe's summary cards) */}
          <div className={styles.customerHeroRow}>
            <div className={styles.customerHeroLeft}>
              <div className={styles.customerHeroNumber}>{totalCustomers.toLocaleString()}</div>
              <div className={styles.customerHeroLabel}>Total Customers</div>
            </div>
            <div className={styles.customerCardIconWrap}>
              <span className={styles.customerCardEmoji}>👥</span>
            </div>
          </div>

          {/* Thin horizontal rule */}
          <div className={styles.customerCardRule} />

          {/* Three stat cells */}
          <div className={styles.customerStatRow}>
            <div className={styles.customerStatCell}>
              <span className={styles.customerStatVal} style={{ color: 'var(--accent)' }}>
                {bestCustomerName}
              </span>
              <span className={styles.customerStatLbl}>Best Customer</span>
            </div>

            <div className={styles.customerStatSep} />

            <div className={styles.customerStatCell}>
              <span className={styles.customerStatVal}>{newCustThisMonth}</span>
              <span className={styles.customerStatLbl}>New This Month</span>
            </div>

            <div className={styles.customerStatSep} />

            <div className={styles.customerStatCell}>
              <span className={styles.customerStatVal}>{retentionRate}%</span>
              <span className={styles.customerStatLbl}>Retention</span>
            </div>
          </div>
        </div>

        {showGoalModal && (
          <RevenueGoalModal onSave={handleSaveGoal} onClose={() => setShowGoalModal(false)} />
        )}

        {/* ── UPCOMING APPOINTMENTS — hidden when empty ── */}
        {recentAppointments.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Upcoming Appointments</h3>
            <button className={styles.seeAllBtn} onClick={() => navigate('/appointments')}>See all</button>
          </div>
            <div className={styles.listSection}>
              <div className={styles.listDivider} />
              {recentAppointments.map((appt, idx) => {
                const isLast    = idx === recentAppointments.length - 1
                const icon      = APPT_TYPE_ICONS[appt.type] || 'event'
                const iconColor = APPT_STATUS_COLORS[appt.status] || '#818cf8'
                const isToday   = todayAppointments.some(a => a.id === appt.id)
                return (
                  <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div className={styles.listOuter}
                      style={isToday ? { borderColor: 'rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.05)' } : {}}>
                      <div className={styles.listInner}>
                        <span className="mi" style={{ fontSize: '1.3rem', color: iconColor }}>{icon}</span>
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
                      {isToday && <div className={styles.listApptToday}>Today</div>}
                    </div>
                  </div>
                )
              })}
            </div>
        </section>
        )}

        {/* ── RECENT APPOINTMENTS ── */}
        {pastAppointments.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Appointments</h3>
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

        {/* ── RECENT ORDERS — hidden when empty ── */}
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

        {/* ── RECENT TASKS — hidden when empty ── */}
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
