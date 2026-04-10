import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers }     from '../../contexts/CustomerContext'
import { useOrders }        from '../../contexts/OrdersContext'
import { useTasks }         from '../../contexts/TaskContext'
import { useInvoices }      from '../../contexts/InvoiceContext'
import { useAppointments }  from '../../contexts/AppointmentContext'
import { useAuth }          from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
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

// ── Push notification banner ──────────────────────────────────
function NotifBanner({ onEnable, onDismiss }) {
  return (
    <div className={styles.notifBanner}>
      <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)', flexShrink: 0 }}>notifications</span>
      <div className={styles.notifBannerText}>
        <div className={styles.notifBannerTitle}>Enable Notifications</div>
        <div className={styles.notifBannerSub}>Get alerts for orders, invoices & birthdays</div>
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

      {/* Add Order — regular button, same style */}
      <button className={styles.mobileQuickBtn} onClick={() => navigate('/orders')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>add_shopping_cart</span>
        <span className={styles.mobileQuickLabel}>Add Order</span>
      </button>

      <button className={styles.mobileQuickBtn} onClick={() => navigate('/tasks')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>assignment</span>
        <span className={styles.mobileQuickLabel}>Add Task</span>
      </button>

      <button className={styles.mobileQuickBtn} onClick={() => navigate('/customers')}>
        <span className="mi" style={{ fontSize: '1.45rem' }}>groups</span>
        <span className={styles.mobileQuickLabel}>Customers</span>
      </button>

    </nav>
  )
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

  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('tf_notif_dismissed') === 'true'
  )

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

  // ── Display name (second name preferred) ─────────────────
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

  // ── Recent lists ──────────────────────────────────────────
  const recentOrders       = [...pendingOrders].slice(0, 4)
  const recentTasks        = tasks.filter(t => !t.done).slice(0, 4)
  const recentAppointments = upcoming.slice(0, 4)
  const pastAppointments   = recentAppts.slice(0, 4)

  // ── Stat card definitions ─────────────────────────────────
  // bgIcon: representative Material Icon for each card's watermark
  const statCards = [
    {
      desktopIcon: 'groups',
      bgIcon:      'groups',           // people silhouette — customers
      iconColor:   '#818cf8',
      value:       customers.length,
      label:       'Total Customers',
      sub:         `+${newCustomersThisMonth} this month`,
      subColor:    undefined,
      route:       '/customers',
    },
    {
      desktopIcon: 'content_cut',
      bgIcon:      'shopping_bag',     // shopping bag — orders (matches reference)
      iconColor:   '#fb923c',
      value:       pendingOrders.length,
      label:       'Pending Orders',
      sub:         `${ordersDueThisWeek} due this wk`,
      subColor:    ordersDueThisWeek > 0 ? 'var(--warning)' : undefined,
      route:       '/orders',
    },
    {
      desktopIcon: 'receipt_long',
      bgIcon:      'receipt_long',     // receipt — invoices
      iconColor:   '#ef4444',
      value:       totalUnpaid,
      label:       'Unpaid Invoices',
      sub:         `${totalOverdueInvoice} overdue`,
      subColor:    totalOverdueInvoice > 0 ? 'var(--danger)' : undefined,
      route:       '/invoices',
    },
    {
      desktopIcon: 'task_alt',
      bgIcon:      'checklist',        // checklist — tasks
      iconColor:   '#22c55e',
      value:       pendingTasks.length,
      label:       'Pending Tasks',
      sub:         `${tasksDueThisWeek} due this wk`,
      subColor:    tasksDueThisWeek > 0 ? 'var(--warning)' : undefined,
      route:       '/tasks',
    },
    {
      desktopIcon: 'event',
      bgIcon:      'today',            // calendar today — today's appts
      iconColor:   '#06b6d4',
      value:       todayCount,
      label:       "Today's Appts",
      sub:         missedCount > 0 ? `${missedCount} missed` : `${upcomingThisWeek} this wk`,
      subColor:    missedCount > 0 ? 'var(--danger)' : undefined,
      route:       '/appointments',
    },
    {
      desktopIcon: 'calendar_month',
      bgIcon:      'calendar_month',   // monthly calendar — weekly appts
      iconColor:   '#a855f7',
      value:       upcomingThisWeek,
      label:       'Appts This Wk',
      sub:         `${missedCount} missed`,
      subColor:    missedCount > 0 ? 'var(--danger)' : undefined,
      route:       '/appointments',
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

        {/* STATS
            Desktop → 2-col grid with coloured icon on left
            Mobile  → 1-col full-width cards styled like reference image */}
        <section className={styles.statsGrid}>
          {statCards.map((card, i) => (
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
                {/* Label at the top */}
                <div className={styles.statLabel}>{card.label}</div>

                {/* Big number + sub on same baseline row */}
                <div className={styles.statValueRow}>
                  <div className={styles.statValue}>{card.value}</div>
                  <div
                    className={styles.statSub}
                    style={card.subColor ? { color: card.subColor } : undefined}
                  >
                    {card.sub}
                  </div>
                </div>
              </div>

              {/* Background watermark icon — uncoloured, shown on mobile only */}
              <span className={`mi ${styles.statBgIcon}`}>{card.bgIcon}</span>
            </div>
          ))}
        </section>

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
