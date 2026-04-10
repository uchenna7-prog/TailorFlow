import { useState, useEffect } from 'react'
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border2, #e2e8f0)" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#f472b6" strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#60a5fa" strokeWidth="10"
        strokeDasharray={`${circ - dash} ${circ}`} strokeDashoffset={-(dash)} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  )
}

// ── Revenue Goal Modal ────────────────────────────────────────
function RevenueGoalModal({ onSave, onClose }) {
  const [period, setPeriod]     = useState('monthly')
  const [goalInput, setGoalInput] = useState('')
  const [currency, setCurrency] = useState('₦')

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

        {/* Period selector */}
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

        {/* Currency + Goal amount */}
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

        {/* Period hint */}
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

// ── Mobile bottom quick-actions nav ──────────────────────────
function MobileQuickActions({ navigate }) {
  return (
    <nav className={styles.mobileQuickNav}>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/customers')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>person_add</span>
        <span className={styles.mobileQuickLabel}>New Customer</span>
      </button>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/appointments')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>event</span>
        <span className={styles.mobileQuickLabel}>Book Appt</span>
      </button>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/orders')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>add_shopping_cart</span>
        <span className={styles.mobileQuickLabel}>Add Order</span>
      </button>
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/tasks')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>assignment</span>
        <span className={styles.mobileQuickLabel}>Add Task</span>
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
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  // yearly
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

  // ── Revenue calculation from PaymentContext ───────────────
  // Uses allPayments from PaymentContext — same data source as AllPayments page.
  // Sums all installment amounts within the goal's time window.
  const revenueEarned = (() => {
    if (!revenueGoal) return 0
    const windowStart = getWindowStart(revenueGoal.period)

    return allPayments
      .flatMap(p => {
        // Each payment may have installments — sum those with a date in the window
        const installments = p.installments || []
        if (installments.length === 0) return []

        return installments
          .filter(inst => {
            const dateStr = inst.date || p.date
            if (!dateStr) return false
            const ms = new Date(dateStr).getTime()
            return ms >= windowStart.getTime()
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

  // ── Status cards ─────────────────────────────────────────
  const statusCards = [
    {
      desktopIcon: 'shopping_bag',
      bgIcon:      'shopping_bag',
      iconColor:   '#fb923c',
      value:       pendingOrders.length,
      label:       'Pending Orders',
      sub:         `${ordersDueThisWeek} due this wk`,
      // Orange when there are orders due this week, muted otherwise
      subColor:    ordersDueThisWeek > 0 ? '#fb923c' : 'var(--text3)',
      route:       '/orders',
    },
    {
      desktopIcon: 'receipt_long',
      bgIcon:      'receipt_long',
      iconColor:   '#ef4444',
      value:       totalUnpaid,
      label:       'Unpaid Invoices',
      sub:         `${totalOverdueInvoice} overdue`,
      subColor:    totalOverdueInvoice > 0 ? '#ef4444' : 'var(--text3)',
      route:       '/invoices',
    },
    {
      desktopIcon: 'event',
      bgIcon:      'today',
      iconColor:   '#06b6d4',
      value:       todayCount,
      label:       "Today's Appts",
      sub:         missedCount > 0
        ? `${missedCount} missed`
        : `${upcomingThisWeek} this wk`,
      // Red for missed, cyan for upcoming this week (matches the card's icon colour)
      subColor:    missedCount > 0 ? '#ef4444' : '#06b6d4',
      route:       '/appointments',
    },
    {
      desktopIcon: 'task_alt',
      bgIcon:      'checklist',
      iconColor:   '#22c55e',
      value:       pendingTasks.length,
      label:       'Pending Tasks',
      sub:         `${tasksDueThisWeek} due this wk`,
      // Orange when tasks are due this week
      subColor:    tasksDueThisWeek > 0 ? '#fb923c' : 'var(--text3)',
      route:       '/tasks',
    },
  ]

  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <p className={styles.welcomeLabel}>Welcome 👋</p>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>Here's what's happening in your shop today.</p>
        </section>

        {/* NOTIFICATION BANNER */}
        {showBanner && (
          <NotifBanner onEnable={handleEnable} onDismiss={handleDismiss} />
        )}

        {/* STATUS CARDS — 2×2 grid */}
        <section className={styles.statsGrid}>
          {statusCards.map((card, i) => (
            <div
              key={i}
              className={styles.statCard}
              onClick={() => navigate(card.route)}
            >
              {/* Desktop left icon */}
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: card.iconColor }}>
                  {card.desktopIcon}
                </span>
              </div>

              {/* Card body */}
              <div className={styles.statCardBody}>
                <div className={styles.statLabel}>{card.label}</div>
                {/* Number on its own line */}
                <div className={styles.statValue}>{card.value}</div>
                {/* Sub text below, smaller, coloured */}
                {card.sub && (
                  <div
                    className={styles.statSub}
                    style={{ color: card.subColor }}
                  >
                    {card.sub}
                  </div>
                )}
              </div>

              {/* Background watermark icon — partially cut off bottom-right */}
              <span className={`mi ${styles.statBgIcon}`}>{card.bgIcon}</span>
            </div>
          ))}
        </section>

        {/* REVENUE CARD */}
        {!revenueGoal ? (
          /* ── Empty state: no graph, just add prompt ── */
          <div
            className={styles.revenueCard}
            onClick={() => setShowGoalModal(true)}
          >
            <div className={styles.revenueCardLeft}>
              <div className={styles.revenueEmptyIconRow}>
                <div className={styles.revenueEmptyIconWrap}>
                  <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>add_circle</span>
                </div>
              </div>
              <div className={styles.revenueEmptyTitle}>Set a goal</div>
              <div className={styles.revenueEmptySub}>Track weekly, monthly or yearly revenue</div>
            </div>
            {/* No donut here — only shown when a goal exists */}
          </div>
        ) : (
          /* ── Active revenue card — donut reflects real payment data ── */
          <div
            className={styles.revenueCard}
            onClick={() => setShowGoalModal(true)}
          >
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
              <div className={styles.revenuePercent}>
                {revenuePct}% achieved
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
        )}

        {/* RECENT TASKS */}
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
        )}

      </main>

      {/* MOBILE BOTTOM QUICK ACTIONS */}
      <MobileQuickActions navigate={navigate} />

    </div>
  )
}

export default Home
