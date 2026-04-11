import { useState, useEffect, useMemo } from 'react'
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

// ── Helpers ───────────────────────────────────────────────────

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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getGreetingEmoji() {
  const h = new Date().getHours()
  if (h < 12) return '☀️'
  if (h < 17) return '👋'
  return '🌙'
}

// Last‑7‑days window for stats trend
function lastWeekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

const PRIORITY_COLORS = {
  low:    '#94a3b8',
  normal: '#818cf8',
  high:   '#fb923c',
  urgent: '#ef4444',
}

const CATEGORY_ICONS = {
  general: 'assignment', sewing: 'content_cut', delivery: 'local_shipping',
  payment: 'payments',   fitting: 'checkroom',  shopping: 'shopping_cart',
}

const APPT_TYPE_ICONS = {
  fitting:      'checkroom',
  measurement:  'straighten',
  delivery:     'local_shipping',
  consultation: 'chat_bubble_outline',
  pickup:       'inventory_2',
  other:        'event',
}

const APPT_STATUS_COLORS = {
  scheduled: '#818cf8',
  confirmed: '#22c55e',
  completed: '#94a3b8',
  cancelled: '#ef4444',
  missed:    '#ef4444',
}

const ORDER_STATUS_TEXT_COLORS = {
  pending:   '#856404',
  completed: '#155724',
  delivered: '#4B2E83',
  cancelled: '#721C24',
}

// Week days for mini calendar strip
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Revenue donut SVG ─────────────────────────────────────────
function RevenueDonut({ pct }) {
  const r     = 36
  const cx    = 44
  const cy    = 44
  const circ  = 2 * Math.PI * r
  const filled = Math.min(Math.max(pct, 0), 100)
  const dash  = (filled / 100) * circ

  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border2, #e2e8f0)" strokeWidth="8" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#f472b6" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#60a5fa" strokeWidth="8"
        strokeDasharray={`${circ - dash} ${circ}`} strokeDashoffset={-(dash)} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text)" fontSize="15" fontWeight="800"
      >
        {pct}%
      </text>
    </svg>
  )
}

// ── Revenue Goal Modal ────────────────────────────────────────
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
            {['weekly', 'monthly', 'yearly'].map(p => (
              <button
                key={p}
                className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.modalSection}>
          <div className={styles.modalSectionLabel}>Revenue target</div>
          <div className={styles.goalInputRow}>
            <select
              className={styles.currencySelect}
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              <option value="₦">₦ NGN</option>
              <option value="$">$ USD</option>
              <option value="£">£ GBP</option>
              <option value="€">€ EUR</option>
            </select>
            <input
              className={styles.goalInput}
              type="number"
              placeholder="e.g. 500000"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className={styles.periodHint}>
          {period === 'weekly'  && '📅 Resets every Monday'}
          {period === 'monthly' && '📅 Resets on the 1st of each month'}
          {period === 'yearly'  && '📅 Resets on January 1st each year'}
        </div>

        <button
          className={styles.modalSaveBtn}
          onClick={handleSave}
          disabled={!goalInput || Number(goalInput) <= 0}
        >
          Save Goal
        </button>
        <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

// ── Push notification banner ──────────────────────────────────
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

// ── Overdue Alert Banner ──────────────────────────────────────
function OverdueBanner({ overdueInvoices, missedCount, navigate }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const invoiceAmt = overdueInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0)
  const parts = []
  if (overdueInvoices.length > 0)
    parts.push(`${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} · ₦${invoiceAmt.toLocaleString()} at risk`)
  if (missedCount > 0)
    parts.push(`${missedCount} missed appointment${missedCount > 1 ? 's' : ''}`)

  if (parts.length === 0) return null

  return (
    <div className={styles.overdueBanner}>
      <span className="mi" style={{ fontSize: '1.1rem', color: '#ef4444', flexShrink: 0 }}>warning</span>
      <div className={styles.overdueBannerText}>
        <div className={styles.overdueBannerTitle}>Needs attention</div>
        {parts.map((p, i) => (
          <div key={i} className={styles.overdueBannerLine}>{p}</div>
        ))}
      </div>
      <div className={styles.overdueBannerActions}>
        <button className={styles.overdueBannerBtn} onClick={() => navigate('/invoices')}>View</button>
        <button className={styles.overdueBannerDismiss} onClick={() => setDismissed(true)}>✕</button>
      </div>
    </div>
  )
}

// ── Today's Schedule Strip ────────────────────────────────────
function TodaySchedule({ appointments, navigate }) {
  if (appointments.length === 0) return null
  const sorted = [...appointments].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  return (
    <div className={styles.scheduleWrap}>
      <div className={styles.scheduleHeader}>
        <span className={styles.scheduleTitle}>Today's Schedule</span>
        <button className={styles.seeAllBtn} style={{ marginBottom: 0 }} onClick={() => navigate('/appointments')}>See all</button>
      </div>
      <div className={styles.scheduleScroll}>
        {sorted.map(appt => {
          const icon = APPT_TYPE_ICONS[appt.type] || 'event'
          const color = APPT_STATUS_COLORS[appt.status] || '#818cf8'
          return (
            <div key={appt.id} className={styles.scheduleCard} style={{ borderTopColor: color }}>
              <div className={styles.scheduleTime}>{appt.time || '—'}</div>
              <div className={styles.scheduleIconWrap} style={{ background: `${color}18` }}>
                <span className="mi" style={{ fontSize: '1rem', color }}>{icon}</span>
              </div>
              <div className={styles.scheduleName}>{appt.customerName || 'Client'}</div>
              <div className={styles.scheduleType}>{appt.type || 'Appt'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week at a Glance ──────────────────────────────────────────
function WeekGlance({ allAppointments, allOrders }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = isoDate(d)
    const appts  = allAppointments.filter(a => a.date === iso).length
    const orders = allOrders.filter(o => (o.dueDate || o.dueRaw) === iso).length
    return { d, iso, appts, orders, isToday: i === 0 }
  })

  return (
    <div className={styles.weekGlance}>
      <div className={styles.weekGlanceLabel}>This Week</div>
      <div className={styles.weekGlanceDays}>
        {days.map(({ d, appts, orders, isToday }) => {
          const total = appts + orders
          return (
            <div key={d.toISOString()} className={`${styles.weekDay} ${isToday ? styles.weekDayToday : ''}`}>
              <div className={styles.weekDayName}>{WEEK_DAYS[d.getDay()]}</div>
              <div className={styles.weekDayNum}>{d.getDate()}</div>
              {total > 0
                ? <div className={styles.weekDayDot} style={{ background: appts > 0 ? '#06b6d4' : '#fb923c' }}>{total}</div>
                : <div className={styles.weekDayEmpty} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Birthday Card ─────────────────────────────────────────────
function BirthdayCard({ customers }) {
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return customers
      .filter(c => c.dob)
      .map(c => {
        const dob  = new Date(c.dob + 'T00:00:00')
        const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        if (next < today) next.setFullYear(today.getFullYear() + 1)
        const diff = Math.round((next - today) / 86400000)
        return { ...c, daysUntil: diff }
      })
      .filter(c => c.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [customers])

  if (upcoming.length === 0) return null
  const first = upcoming[0]

  return (
    <div className={styles.birthdayCard}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🎂</span>
      <div className={styles.birthdayText}>
        <div className={styles.birthdayName}>{first.name}'s birthday</div>
        <div className={styles.birthdaySub}>
          {first.daysUntil === 0 ? 'Today! 🎉' : first.daysUntil === 1 ? 'Tomorrow' : `In ${first.daysUntil} days`}
          {upcoming.length > 1 && ` · +${upcoming.length - 1} more this week`}
        </div>
      </div>
      <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', flexShrink: 0 }}>chevron_right</span>
    </div>
  )
}

// ── Top Customer Card ─────────────────────────────────────────
function TopCustomerCard({ customers, allOrders }) {
  const top = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const counts = {}
    allOrders.forEach(o => {
      if (!o.customerId) return
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0)
      if (created >= monthStart) counts[o.customerId] = (counts[o.customerId] || 0) + 1
    })
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (!topId) return null
    const customer = customers.find(c => c.id === topId[0])
    if (!customer) return null
    return { ...customer, orderCount: topId[1] }
  }, [customers, allOrders])

  if (!top) return null

  return (
    <div className={styles.topCustomerCard}>
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⭐</span>
      <div className={styles.topCustomerText}>
        <div className={styles.topCustomerName}>Top client: {top.name}</div>
        <div className={styles.topCustomerSub}>{top.orderCount} order{top.orderCount > 1 ? 's' : ''} this month</div>
      </div>
    </div>
  )
}

// ── Mobile bottom quick-actions nav ──────────────────────────
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

// ── Revenue helpers ───────────────────────────────────────────
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

function periodLabel(period) {
  if (period === 'weekly')  return 'This week'
  if (period === 'monthly') return 'This month'
  return 'This year'
}

// ─────────────────────────────────────────────────────────────

function Home({ onMenuClick }) {
  const navigate = useNavigate()
  const { user }          = useAuth()
  const { customers }     = useCustomers()
  const { allOrders }     = useOrders()
  const { tasks }         = useTasks()
  const { allInvoices }   = useInvoices()
  const {
    upcoming,
    todayAppointments,
    recent:          recentAppts,
    missedCount,
    upcomingThisWeek,
  } = useAppointments()
  const { pushEnabled, requestPushPermission } = useNotifications()
  const { settings } = useSettings()
  const { allPayments } = usePayments()

  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('tf_notif_dismissed') === 'true'
  )
  const [lastSynced, setLastSynced] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setLastSynced(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  // ── Revenue goal state ────────────────────────────────────
  const [revenueGoal, setRevenueGoal] = useState(() => {
    try {
      const raw = localStorage.getItem(REVENUE_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [showGoalModal, setShowGoalModal] = useState(false)

  const handleSaveGoal = (goalData) => {
    setRevenueGoal(goalData)
    localStorage.setItem(REVENUE_STORAGE_KEY, JSON.stringify(goalData))
    setShowGoalModal(false)
  }

  const showBanner = !pushEnabled
    && !bannerDismissed
    && 'Notification' in window
    && Notification.permission !== 'denied'

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
    if (full) {
      const parts = full.split(/\s+/)
      return parts.length >= 2 ? parts[1] : parts[0]
    }
    return user?.email?.split('@')[0] ?? 'there'
  })()

  // ── Stats ─────────────────────────────────────────────────
  const now = new Date()

  const newCustomersThisMonth = customers.filter(c => {
    if (!c.date) return false
    const d = new Date(c.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const pendingOrders     = allOrders.filter(o => !['completed', 'delivered', 'cancelled'].includes(o.status))
  const ordersDueThisWeek = pendingOrders.filter(o => dueThisWeek(o.dueDate || o.dueRaw)).length

  const unpaidInvoices      = allInvoices.filter(i => i.status !== 'paid' && !isInvoiceOverdue(i))
  const overdueInvoices     = allInvoices.filter(i => isInvoiceOverdue(i))
  const totalUnpaid         = unpaidInvoices.length
  const totalOverdueInvoice = overdueInvoices.length

  const pendingTasks     = tasks.filter(t => !t.done && !isTaskOverdue(t))
  const tasksDueThisWeek = pendingTasks.filter(t => dueThisWeek(t.dueDate)).length

  const todayCount = todayAppointments.length

  // ── Trend deltas (vs last 7 days) ─────────────────────────
  const lwStart = lastWeekStart()
  const ordersLastWeek = allOrders.filter(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0)
    return d >= lwStart && !['completed', 'delivered', 'cancelled'].includes(o.status)
  }).length
  const orderDelta = pendingOrders.length - ordersLastWeek

  const invoicesLastWeek = allInvoices.filter(i => {
    const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || 0)
    return d >= lwStart && i.status !== 'paid' && !isInvoiceOverdue(i)
  }).length
  const invoiceDelta = totalUnpaid - invoicesLastWeek

  const tasksLastWeek = tasks.filter(t => {
    const d = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt || 0)
    return d >= lwStart && !t.done && !isTaskOverdue(t)
  }).length
  const taskDelta = pendingTasks.length - tasksLastWeek

  // ── Revenue calculation ───────────────────────────────────
  const revenueEarned = (() => {
    if (!revenueGoal) return 0
    const windowStart = getWindowStart(revenueGoal.period)
    return allPayments
      .flatMap(p => {
        const installments = p.installments || []
        if (installments.length === 0) return []
        return installments
          .filter(inst => {
            const dateStr = inst.date || p.date
            if (!dateStr) return false
            return new Date(dateStr).getTime() >= windowStart.getTime()
          })
          .map(inst => Number(inst.amount) || 0)
      })
      .reduce((sum, amt) => sum + amt, 0)
  })()

  const revenuePct = revenueGoal && revenueGoal.goal > 0
    ? Math.min(Math.round((revenueEarned / revenueGoal.goal) * 100), 100)
    : 0

  // ── Recent lists ──────────────────────────────────────────
  const recentOrders       = [...pendingOrders].slice(0, 4)
  const recentTasks        = tasks.filter(t => !t.done).slice(0, 4)
  const recentAppointments = upcoming.slice(0, 4)
  const pastAppointments   = recentAppts.slice(0, 4)

  // ── Last sync label ───────────────────────────────────────
  const syncLabel = (() => {
    const diff = Math.floor((new Date() - lastSynced) / 60000)
    if (diff < 1) return 'Updated just now'
    if (diff < 60) return `Updated ${diff}m ago`
    return `Updated ${Math.floor(diff / 60)}h ago`
  })()

  // ── Status cards ─────────────────────────────────────────
  const statusCards = [
    {
      desktopIcon: 'shopping_bag',
      bgIcon:      'content_cut',
      iconColor:   '#fb923c',
      accentColor: '#fb923c',
      value:       pendingOrders.length,
      label:       'Pending Orders',
      sub:         `${ordersDueThisWeek} due this wk`,
      subColor:    ordersDueThisWeek > 0 ? '#fb923c' : 'var(--text3)',
      route:       '/orders',
      delta:       orderDelta,
    },
    {
      desktopIcon: 'receipt_long',
      bgIcon:      'request_quote',
      iconColor:   '#ef4444',
      accentColor: '#ef4444',
      value:       totalUnpaid,
      label:       'Unpaid Invoices',
      sub:         `${totalOverdueInvoice} overdue`,
      subColor:    totalOverdueInvoice > 0 ? '#ef4444' : 'var(--text3)',
      route:       '/invoices',
      delta:       invoiceDelta,
    },
    {
      desktopIcon: 'event',
      bgIcon:      'calendar_month',
      iconColor:   '#06b6d4',
      accentColor: '#06b6d4',
      value:       todayCount,
      label:       "Today's Appts",
      sub:         missedCount > 0
        ? `${missedCount} missed`
        : `${upcomingThisWeek} this wk`,
      subColor:    missedCount > 0 ? '#ef4444' : '#06b6d4',
      route:       '/appointments',
      delta:       null,
    },
    {
      desktopIcon: 'task_alt',
      bgIcon:      'checklist',
      iconColor:   '#22c55e',
      accentColor: '#22c55e',
      value:       pendingTasks.length,
      label:       'Pending Tasks',
      sub:         `${tasksDueThisWeek} due this wk`,
      subColor:    tasksDueThisWeek > 0 ? '#fb923c' : 'var(--text3)',
      route:       '/tasks',
      delta:       taskDelta,
    },
  ]

  // ── Context line under greeting ───────────────────────────
  const contextLine = (() => {
    if (todayCount > 0 && pendingOrders.length > 0)
      return `${todayCount} appointment${todayCount > 1 ? 's' : ''} today · ${pendingOrders.length} pending order${pendingOrders.length > 1 ? 's' : ''}`
    if (todayCount > 0)
      return `You have ${todayCount} appointment${todayCount > 1 ? 's' : ''} today`
    if (pendingOrders.length > 0)
      return `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} waiting — let's get to work`
    return "Here's what's happening in your shop today."
  })()

  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <p className={styles.welcomeLabel}>{getGreeting()} {getGreetingEmoji()}</p>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>{contextLine}</p>
          <p className={styles.syncLabel}>{syncLabel}</p>
        </section>

        {/* NOTIFICATION BANNER */}
        {showBanner && (
          <NotifBanner onEnable={handleEnable} onDismiss={handleDismiss} />
        )}

        {/* OVERDUE ALERT BANNER */}
        {(overdueInvoices.length > 0 || missedCount > 0) && (
          <OverdueBanner
            overdueInvoices={overdueInvoices}
            missedCount={missedCount}
            navigate={navigate}
          />
        )}

        {/* BIRTHDAY CARD */}
        <BirthdayCard customers={customers} />

        {/* STATUS CARDS — 2×2 grid */}
        <section className={styles.statsGrid}>
          {statusCards.map((card, i) => (
            <div
              key={i}
              className={styles.statCard}
              style={{ '--card-accent': card.accentColor }}
              onClick={() => navigate(card.route)}
            >
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: card.iconColor }}>
                  {card.desktopIcon}
                </span>
              </div>

              <div className={styles.statCardBody}>
                <div className={styles.statLabel}>{card.label}</div>
                <div className={styles.statValueRow}>
                  <div className={styles.statValue}>{card.value}</div>
                  {card.delta !== null && card.delta !== undefined && card.delta !== 0 && (
                    <span
                      className={styles.statDelta}
                      style={{ color: card.delta > 0 ? '#ef4444' : '#22c55e' }}
                    >
                      {card.delta > 0 ? '↑' : '↓'}{Math.abs(card.delta)}
                    </span>
                  )}
                </div>
                {card.sub && (
                  <div className={styles.statSub} style={{ color: card.subColor }}>
                    {card.sub}
                  </div>
                )}
              </div>

              <span className={`mi ${styles.statBgIcon}`}>{card.bgIcon}</span>
            </div>
          ))}
        </section>

        {/* WEEK AT A GLANCE */}
        <WeekGlance allAppointments={[...upcoming, ...recentAppts]} allOrders={allOrders} />

        {/* TODAY'S SCHEDULE STRIP */}
        {todayAppointments.length > 0 && (
          <TodaySchedule appointments={todayAppointments} navigate={navigate} />
        )}

        {/* TOP CUSTOMER */}
        <TopCustomerCard customers={customers} allOrders={allOrders} />

        {/* REVENUE CARD */}
        {!revenueGoal ? (
          <div
            className={styles.revenueCard}
            onClick={() => setShowGoalModal(true)}
            style={{ justifyContent: 'flex-start', gap: '20px' }}
          >
            <div className={styles.revenueEmptyIconWrap}>
              <span className="mi" style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>ads_click</span>
            </div>
            <div className={styles.revenueCardLeft} style={{ gap: '2px' }}>
              <div className={styles.revenueEmptyTitle}>Set your first goal</div>
              <div className={styles.revenueEmptySub}>Click here to track your shop's revenue growth</div>
            </div>
          </div>
        ) : (
          <div className={styles.revenueCard} onClick={() => setShowGoalModal(true)}>
            <div className={styles.revenueCardLeft}>
              <div className={styles.revenueLabel}>
                {periodLabel(revenueGoal.period)} · Revenue
              </div>
              <div className={styles.revenueAmount}>
                {revenueGoal.currency}{revenueEarned.toLocaleString()}
              </div>
              <div className={styles.revenueTarget}>
                Goal: {revenueGoal.currency}{revenueGoal.goal.toLocaleString()}
              </div>
            </div>
            <div className={styles.revenueDonutWrap}>
              <RevenueDonut pct={revenuePct} />
            </div>
          </div>
        )}

        {/* REVENUE GOAL MODAL */}
        {showGoalModal && (
          <RevenueGoalModal
            onSave={handleSaveGoal}
            onClose={() => setShowGoalModal(false)}
          />
        )}

        {/* UPCOMING APPOINTMENTS */}
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
                    <div
                      className={styles.listOuter}
                      style={isToday ? { borderColor: 'rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.05)' } : {}}
                    >
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

        {/* RECENT APPOINTMENTS */}
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
                const icon      = APPT_TYPE_ICONS[appt.type] || 'event'
                const iconColor = appt.status === 'completed' ? '#22c55e'
                  : appt.status === 'cancelled' ? '#94a3b8'
                  : '#ef4444'
                return (
                  <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div
                      className={styles.listOuter}
                      style={
                        appt.status === 'completed'
                          ? { borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.04)' }
                          : appt.status === 'cancelled'
                          ? { borderColor: 'rgba(148,163,184,0.3)' }
                          : { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }
                      }
                    >
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
                        <span className={styles.listMetaText} style={{ color: appt.status === 'missed' ? '#ef4444' : undefined }}>
                          {formatApptDate(appt.date, appt.time)}
                        </span>
                      </div>
                      <div className={styles.listApptStatus} style={{ color: iconColor, borderColor: `${iconColor}40`, background: `${iconColor}12` }}>
                        {appt.status === 'completed' ? 'Completed' : appt.status === 'cancelled' ? 'Cancelled' : 'Missed'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* QUICK ACTIONS — desktop only */}
        <section className={styles.quickActionsDesktop}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
          <div className={styles.statsGrid}>
            <div className={styles.actionCard} onClick={() => navigate('/customers')}>
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>person_add</span>
              </div>
              <div className={styles.actionCardText}>
                <div className={styles.statValue} style={{ fontSize: '0.82rem' }}>Add</div>
                <div className={styles.statLabel}>Customer</div>
              </div>
            </div>
            <div className={styles.actionCard} onClick={() => navigate('/appointments')}>
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>event</span>
              </div>
              <div className={styles.actionCardText}>
                <div className={styles.statValue} style={{ fontSize: '0.82rem' }}>Book</div>
                <div className={styles.statLabel}>Appointment</div>
              </div>
            </div>
            <div className={styles.actionCard} onClick={() => navigate('/tasks')}>
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>assignment</span>
              </div>
              <div className={styles.actionCardText}>
                <div className={styles.statValue} style={{ fontSize: '0.82rem' }}>New</div>
                <div className={styles.statLabel}>Task</div>
              </div>
            </div>
            <div className={styles.actionCard} onClick={() => navigate('/customers')}>
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>arrow_forward</span>
              </div>
              <div className={styles.actionCardText}>
                <div className={styles.statValue} style={{ fontSize: '0.82rem' }}>View All</div>
                <div className={styles.statLabel}>Customers</div>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT ORDERS */}
        {recentOrders.length > 0 ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Orders</h3>
              <button className={styles.seeAllBtn} onClick={() => navigate('/orders')}>See all</button>
            </div>
            <div className={styles.listSection}>
              <div className={styles.listDivider} />
              {recentOrders.map((order, idx) => {
                const isLast   = idx === recentOrders.length - 1
                const priceStr = order.price !== null && order.price !== undefined
                  ? `₦${Number(order.price).toLocaleString()}` : '—'
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
                      <div className={styles.listMeta}>
                        <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>autorenew</span>
                        <span className={styles.listMetaText} style={{ color: ORDER_STATUS_TEXT_COLORS[order.status] ?? undefined }}>{order.status || 'Pending'}</span>
                      </div>
                      {(order.due || order.dueRaw) && (
                        <div className={styles.listDue}>Due On {order.due || formatDate(order.dueRaw)}</div>
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
        ) : (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.2rem', color: 'var(--text3)' }}>content_cut</span>
            <div className={styles.emptyStateTitle}>No pending orders</div>
            <div className={styles.emptyStateSub}>Orders you create will appear here</div>
          </div>
        )}

        {/* RECENT TASKS */}
        {recentTasks.length > 0 ? (
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
                    <div
                      className={styles.listOuter}
                      style={overdue ? { borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.05)' } : {}}
                    >
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
                        <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>autorenew</span>
                        <span className={styles.listMetaText} style={{ color: overdue ? '#ef4444' : undefined }}>
                          {overdue ? 'Overdue' : (task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Normal')}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className={styles.listDue} style={{ color: '#ef4444' }}>
                          Due On {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.2rem', color: 'var(--text3)' }}>checklist</span>
            <div className={styles.emptyStateTitle}>No pending tasks</div>
            <div className={styles.emptyStateSub}>You're all caught up</div>
          </div>
        )}

      </main>

      {/* MOBILE BOTTOM QUICK ACTIONS */}
      <MobileQuickActions navigate={navigate} />

    </div>
  )
}

export default Home
