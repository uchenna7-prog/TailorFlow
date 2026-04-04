// src/pages/Reports/Reports.jsx
// Pulls live data from existing contexts — no new service needed.
// Sections: Performance · Orders · Tasks · Payments · Customers

import { useState, useMemo } from 'react'
import { useOrders }    from '../../contexts/OrdersContext'
import { useTasks }     from '../../contexts/TaskContext'
import { usePayments }  from '../../contexts/PaymentContext'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import styles from './Reports.module.css'

// ── Period helpers ────────────────────────────────────────────

const PERIODS = [
  { id: 'week',  label: 'This week'  },
  { id: 'month', label: 'This month' },
  { id: '3mo',   label: 'Last 3 months' },
  { id: 'year',  label: 'This year'  },
  { id: 'all',   label: 'All time'   },
]

function periodStart(id) {
  const now = new Date()
  switch (id) {
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay())
      d.setHours(0,0,0,0)
      return d
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    case '3mo': {
      return new Date(now.getFullYear(), now.getMonth() - 2, 1)
    }
    case 'year': {
      return new Date(now.getFullYear(), 0, 1)
    }
    default: return null  // all time
  }
}

function parseItemDate(item) {
  // Try createdAt (Firestore Timestamp), then date string
  if (item.createdAt?.toDate) return item.createdAt.toDate()
  if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000)
  if (item.date) return new Date(item.date)
  return null
}

function inPeriod(item, start) {
  if (!start) return true
  const d = parseItemDate(item)
  if (!d) return false
  return d >= start
}

// ── Donut Chart (pure CSS/SVG, no lib) ───────────────────────

function DonutChart({ segments, total, centerLabel, centerSub }) {
  // segments: [{ value, color }]
  const R  = 54
  const CX = 64
  const CY = 64
  const circumference = 2 * Math.PI * R

  const sum = segments.reduce((s, seg) => s + seg.value, 0)
  let offset = 0
  const arcs = segments.map(seg => {
    const pct  = sum > 0 ? seg.value / sum : 0
    const dash = pct * circumference
    const arc  = { dash, gap: circumference - dash, offset: circumference - offset, color: seg.color }
    offset += dash
    return arc
  })

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className={styles.donutSvg}>
      {/* Track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="var(--border)"
        strokeWidth="16"
      />
      {/* Segments */}
      {sum === 0 ? (
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="var(--border2)"
          strokeWidth="16"
        />
      ) : (
        arcs.map((arc, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth="16"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        ))
      )}
      {/* Center text */}
      <text x={CX} y={CY - 6} textAnchor="middle" className={styles.donutNum}>
        {centerLabel}
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" className={styles.donutSub}>
        {centerSub}
      </text>
    </svg>
  )
}

// ── Bar Chart (7-day or monthly sparkbar) ────────────────────

function BarChart({ bars, maxVal, color = 'var(--accent)' }) {
  if (!bars.length) return null
  const max = maxVal || Math.max(...bars.map(b => b.value), 1)
  return (
    <div className={styles.barChart}>
      {bars.map((bar, i) => (
        <div key={i} className={styles.barCol}>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                height: `${Math.max(3, (bar.value / max) * 100)}%`,
                background: color,
              }}
            />
          </div>
          <div className={styles.barLabel}>{bar.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Period Selector ───────────────────────────────────────────

function PeriodSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = PERIODS.find(p => p.id === value)
  return (
    <div className={styles.periodWrap}>
      <button className={styles.periodBtn} onClick={() => setOpen(p => !p)}>
        {current.label}
        <span className="mi" style={{ fontSize: '0.9rem' }}>expand_more</span>
      </button>
      {open && (
        <div className={styles.periodDropdown}>
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`${styles.periodOption} ${value === p.id ? styles.periodOptionActive : ''}`}
              onClick={() => { onChange(p.id); setOpen(false) }}
            >
              {p.label}
              {value === p.id && <span className="mi" style={{ fontSize: '0.9rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────

function Section({ title, period, onPeriodChange, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>{title}</div>
        <PeriodSelector value={period} onChange={onPeriodChange} />
      </div>
      {children}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${color}18`, color }}>
        <span className="mi" style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <div className={styles.statInfo}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Legend dot ────────────────────────────────────────────────

function Legend({ items }) {
  return (
    <div className={styles.legend}>
      {items.map((item, i) => (
        <div key={i} className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: item.color }} />
          <div>
            <div className={styles.legendVal}>{item.value}</div>
            <div className={styles.legendLabel}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Build payment bars (daily for week, weekly for month, monthly for year) ──

function buildPaymentBars(installments, period) {
  const now   = new Date()
  const start = periodStart(period)

  if (period === 'week' || period === 'month') {
    // Group by day label
    const map = {}
    installments.forEach(inst => {
      const d = new Date(inst.date)
      if (!d || isNaN(d)) return
      if (start && d < start) return
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      map[key] = (map[key] || 0) + (parseFloat(inst.amount) || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value })).slice(-14)
  }

  if (period === '3mo' || period === 'year' || period === 'all') {
    // Group by month
    const map = {}
    installments.forEach(inst => {
      const d = new Date(inst.date)
      if (!d || isNaN(d)) return
      if (start && d < start) return
      const key = d.toLocaleDateString('en-US', { month: 'short', year: period === 'all' ? '2-digit' : undefined })
      map[key] = (map[key] || 0) + (parseFloat(inst.amount) || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  }

  return []
}

function fmt(amount) {
  const n = parseFloat(amount) || 0
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(1)}K`
  return `₦${n.toLocaleString('en-NG')}`
}

// ── MAIN PAGE ─────────────────────────────────────────────────

export default function Reports({ onMenuClick }) {
  const { allOrders }  = useOrders()      // array from OrdersContext
  const { tasks }      = useTasks()
  const { allPayments } = usePayments()
  const { customers }  = useCustomers()

  const [perfPeriod,  setPerfPeriod]  = useState('month')
  const [orderPeriod, setOrderPeriod] = useState('month')
  const [taskPeriod,  setTaskPeriod]  = useState('month')
  const [payPeriod,   setPayPeriod]   = useState('month')
  const [custPeriod,  setCustPeriod]  = useState('month')

  // ── Orders stats ──────────────────────────────────────────
  const orderStats = useMemo(() => {
    const start    = periodStart(orderPeriod)
    // allOrders may be flat or per-customer — normalise
    const flat     = Array.isArray(allOrders) ? allOrders : []
    const filtered = flat.filter(o => inPeriod(o, start))
    const delivered   = filtered.filter(o => o.status === 'delivered').length
    const inProgress  = filtered.filter(o => o.status === 'pending' || o.status === 'in_progress').length
    const completed   = filtered.filter(o => o.status === 'completed').length
    const overdue     = filtered.filter(o => {
      if (!o.due) return false
      return new Date(o.due + 'T23:59:59') < new Date() && o.status !== 'delivered' && o.status !== 'completed'
    }).length
    return { total: filtered.length, delivered, inProgress, completed, overdue }
  }, [allOrders, orderPeriod])

  // ── Tasks stats ───────────────────────────────────────────
  const taskStats = useMemo(() => {
    const start    = periodStart(taskPeriod)
    const filtered = tasks.filter(t => inPeriod(t, start))
    const done      = filtered.filter(t => t.done).length
    const pending   = filtered.filter(t => !t.done && new Date(t.dueDate + 'T23:59:59') >= new Date()).length
    const overdue   = filtered.filter(t => {
      if (!t.dueDate || t.done) return false
      return new Date(t.dueDate + 'T23:59:59') < new Date()
    }).length
    return { total: filtered.length, done, pending, overdue }
  }, [tasks, taskPeriod])

  // ── Payment / earnings stats ──────────────────────────────
  const payStats = useMemo(() => {
    const start = periodStart(payPeriod)
    // Flatten all installments from all payments
    const installments = []
    allPayments.forEach(p => {
      ;(p.installments || []).forEach(inst => installments.push({ ...inst, paymentStatus: p.status }))
    })
    const filtered = installments.filter(inst => {
      const d = new Date(inst.date)
      return !isNaN(d) && (!start || d >= start)
    })
    const totalReceived = filtered.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const unpaidCount   = allPayments.filter(p => p.status === 'not_paid').length
    const partCount     = allPayments.filter(p => p.status === 'part').length
    const paidCount     = allPayments.filter(p => p.status === 'paid').length
    const bars          = buildPaymentBars(filtered, payPeriod)
    return { totalReceived, unpaidCount, partCount, paidCount, bars }
  }, [allPayments, payPeriod])

  // ── Performance (total sales = sum of all paid order prices) ─
  const perfStats = useMemo(() => {
    const start   = periodStart(perfPeriod)
    const flat    = Array.isArray(allOrders) ? allOrders : []
    const filtered = flat.filter(o => inPeriod(o, start))
    const totalSales = filtered.reduce((s, o) => s + (parseFloat(o.price) || 0), 0)

    // Payment received = sum of installments in period
    const instStart = periodStart(perfPeriod)
    let payReceived = 0
    allPayments.forEach(p => {
      ;(p.installments || []).forEach(inst => {
        const d = new Date(inst.date)
        if (!isNaN(d) && (!instStart || d >= instStart)) {
          payReceived += parseFloat(inst.amount) || 0
        }
      })
    })
    return { totalSales, payReceived }
  }, [allOrders, allPayments, perfPeriod])

  // ── Customer stats ────────────────────────────────────────
  const custStats = useMemo(() => {
    const start     = periodStart(custPeriod)
    const newClients = customers.filter(c => inPeriod(c, start)).length
    return { total: customers.length, newClients }
  }, [customers, custPeriod])

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="Reports" />

      <div className={styles.scrollArea}>

        {/* ── PERFORMANCE ── */}
        <Section title="Performance" period={perfPeriod} onPeriodChange={setPerfPeriod}>
          <div className={styles.statGrid}>
            <StatCard
              icon="shopping_cart"
              label="Total Sales"
              value={fmt(perfStats.totalSales)}
              color="#818cf8"
            />
            <StatCard
              icon="account_balance_wallet"
              label="Payment Received"
              value={fmt(perfStats.payReceived)}
              color="#22c55e"
            />
          </div>
        </Section>

        {/* ── ORDERS ── */}
        <Section title="Orders" period={orderPeriod} onPeriodChange={setOrderPeriod}>
          <div className={styles.chartCard}>
            <Legend items={[
              { label: 'Delivered',   value: orderStats.delivered,  color: 'var(--accent)' },
              { label: 'In Progress', value: orderStats.inProgress, color: 'var(--border2)' },
              { label: 'Overdue',     value: orderStats.overdue,    color: '#ef4444' },
            ]} />
            <div className={styles.donutWrap}>
              <DonutChart
                segments={[
                  { value: orderStats.delivered,  color: 'var(--accent)' },
                  { value: orderStats.inProgress, color: 'var(--border2)' },
                  { value: orderStats.completed,  color: '#22c55e' },
                  { value: orderStats.overdue,    color: '#ef4444' },
                ]}
                centerLabel={orderStats.total}
                centerSub="Orders"
              />
            </div>
          </div>
        </Section>

        {/* ── TASKS ── */}
        <Section title="Tasks" period={taskPeriod} onPeriodChange={setTaskPeriod}>
          <div className={styles.chartCard}>
            <Legend items={[
              { label: 'Completed',   value: taskStats.done,    color: 'var(--accent)' },
              { label: 'In Progress', value: taskStats.pending, color: 'var(--border2)' },
              { label: 'Overdue',     value: taskStats.overdue, color: '#ef4444' },
            ]} />
            <div className={styles.donutWrap}>
              <DonutChart
                segments={[
                  { value: taskStats.done,    color: 'var(--accent)' },
                  { value: taskStats.pending, color: 'var(--border2)' },
                  { value: taskStats.overdue, color: '#ef4444' },
                ]}
                centerLabel={taskStats.total}
                centerSub="Tasks"
              />
            </div>
          </div>
        </Section>

        {/* ── PAYMENTS ── */}
        <Section title="Payments" period={payPeriod} onPeriodChange={setPayPeriod}>
          <div className={styles.chartCard}>
            <div className={styles.payStatRow}>
              <div className={styles.payStat}>
                <div className={styles.payStatVal} style={{ color: '#22c55e' }}>{fmt(payStats.totalReceived)}</div>
                <div className={styles.payStatLabel}>Received</div>
              </div>
              <div className={styles.payStatDivider} />
              <div className={styles.payStat}>
                <div className={styles.payStatVal} style={{ color: '#fb923c' }}>{payStats.partCount}</div>
                <div className={styles.payStatLabel}>Partial</div>
              </div>
              <div className={styles.payStatDivider} />
              <div className={styles.payStat}>
                <div className={styles.payStatVal} style={{ color: '#ef4444' }}>{payStats.unpaidCount}</div>
                <div className={styles.payStatLabel}>Unpaid</div>
              </div>
            </div>
            {payStats.bars.length > 0 ? (
              <BarChart bars={payStats.bars} color="var(--accent)" />
            ) : (
              <div className={styles.noData}>No payment data for this period</div>
            )}
          </div>
        </Section>

        {/* ── CUSTOMERS ── */}
        <Section title="Customers" period={custPeriod} onPeriodChange={setCustPeriod}>
          <div className={styles.statGrid}>
            <StatCard
              icon="people"
              label="Total Clients"
              value={custStats.total}
              color="var(--accent)"
            />
            <StatCard
              icon="person_add"
              label="New This Period"
              value={custStats.newClients}
              color="#818cf8"
            />
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
