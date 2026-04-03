import { useNavigate } from 'react-router-dom'
import { useCustomers }     from '../../contexts/CustomerContext'
import { useOrders }        from '../../contexts/OrdersContext'
import { useTasks }         from '../../contexts/TaskContext'
import { useInvoices }      from '../../contexts/InvoiceContext'
import { useAppointments }  from '../../contexts/AppointmentContext'
import { useAuth }          from '../../contexts/AuthContext'
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
  fitting:     'checkroom',
  measurement: 'straighten',
  delivery:    'local_shipping',
  consultation:'chat_bubble_outline',
  pickup:      'inventory_2',
  other:       'event',
}

const APPT_STATUS_COLORS = {
  scheduled:  '#818cf8',
  confirmed:  '#22c55e',
  completed:  '#94a3b8',
  cancelled:  '#ef4444',
  missed:     '#ef4444',
}

// ─────────────────────────────────────────────────────────────

function Home({ onMenuClick }) {
  const navigate = useNavigate()
  const { user }              = useAuth()
  const { customers }         = useCustomers()
  const { allOrders }         = useOrders()
  const { tasks }             = useTasks()
  const { allInvoices }       = useInvoices()
  const {
    upcoming,
    todayAppointments,
    recent:       recentAppts,
    missedCount,
    upcomingThisWeek,
  } = useAppointments()

  // ── Second name logic ─────────────────────────────────────
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

  // ── Appointment stat ──────────────────────────────────────
  const todayCount = todayAppointments.length

  // ── Recent lists ──────────────────────────────────────────
  const recentOrders       = [...pendingOrders].slice(0, 4)
  const recentTasks        = tasks.filter(t => !t.done).slice(0, 4)
  const recentAppointments = upcoming.slice(0, 4)
  const pastAppointments   = recentAppts.slice(0, 4)

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

        {/* STATS */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => navigate('/customers')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.3rem', color: '#818cf8' }}>groups</span>
            </div>
            <div>
              <div className={styles.statValue}>{customers.length}</div>
              <div className={styles.statLabel}>Total Customers</div>
              <div className={styles.statSub}>{`+${newCustomersThisMonth} this month`}</div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/orders')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.3rem', color: '#fb923c' }}>content_cut</span>
            </div>
            <div>
              <div className={styles.statValue}>{pendingOrders.length}</div>
              <div className={styles.statLabel}>Pending Orders</div>
              <div className={styles.statSub} style={{ color: ordersDueThisWeek > 0 ? '#fb923c' : undefined }}>
                {`${ordersDueThisWeek} due this wk`}
              </div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/invoices')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.3rem', color: '#ef4444' }}>receipt_long</span>
            </div>
            <div>
              <div className={styles.statValue}>{totalUnpaid}</div>
              <div className={styles.statLabel}>Unpaid Invoices</div>
              <div className={styles.statSub} style={{ color: totalOverdueInvoice > 0 ? '#ef4444' : undefined }}>
                {`${totalOverdueInvoice} overdue`}
              </div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/tasks')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.3rem', color: '#22c55e' }}>task_alt</span>
            </div>
            <div>
              <div className={styles.statValue}>{pendingTasks.length}</div>
              <div className={styles.statLabel}>Pending Tasks</div>
              <div className={styles.statSub} style={{ color: tasksDueThisWeek > 0 ? '#fb923c' : undefined }}>
                {`${tasksDueThisWeek} due this wk`}
              </div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/appointments')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.3rem', color: '#06b6d4' }}>event</span>
            </div>
            <div>
              <div className={styles.statValue}>{todayCount}</div>
              <div className={styles.statLabel}>Today's Appts</div>
              <div className={styles.statSub} style={{ color: missedCount > 0 ? '#ef4444' : undefined }}>
                {missedCount > 0 ? `${missedCount} missed` : `${upcomingThisWeek} this wk`}
              </div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/appointments')}>
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.3rem', color: '#a855f7' }}>calendar_month</span>
            </div>
            <div>
              <div className={styles.statValue}>{upcomingThisWeek}</div>
              <div className={styles.statLabel}>Appts This Wk</div>
              <div className={styles.statSub} style={{ color: missedCount > 0 ? '#ef4444' : undefined }}>
                {`${missedCount} missed`}
              </div>
            </div>
          </div>
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
                        <span className={styles.listMetaText}>{formatApptDate(appt.date, appt.time)}</span>
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

        {/* QUICK ACTIONS */}
        <section className={styles.section}>
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
                <div className={styles.statLabel}>Appt</div>
              </div>
            </div>

            <div className={styles.actionCard} onClick={() => navigate('/tasks')}>
              <div className={styles.statIconWrap}>
                <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>add_circle_outline</span>
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
                return (
                  <div key={order.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                    <div className={styles.listOuter}>
                      <div className={styles.listInner}>
                        <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--text3)' }}>content_cut</span>
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
                        <span className={styles.listMetaText}>{order.status || 'Pending'}</span>
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
                        <div className={styles.listDue} style={{ color: overdue ? '#ef4444' : 'var(--text2)' }}>
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
    </div>
  )
}

export default Home
