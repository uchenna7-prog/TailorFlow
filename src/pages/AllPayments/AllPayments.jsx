// src/pages/AllPayments/AllPayments.jsx
// ─────────────────────────────────────────────────────────────
// Global payments feed — every installment from every customer
// appears as its own row, grouped by date.
//
// Data shape reminder:
//   payment (Firestore doc) {
//     id, customerId, customerName,
//     orderId, orderDesc, orderPrice,
//     status, date (payment creation date),
//     installments: [{ id, amount, method, date }]
//   }
//
// Each installment row = one real money movement on a specific day.
// Two installments for the same order on different days → two rows.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import { useNavigate }  from 'react-router-dom'
import { usePayments }  from '../../contexts/PaymentContext'
import Header           from '../../components/Header/Header'
import Toast            from '../../components/Toast/Toast'
import styles from './AllPayments.module.css'

// ── Helpers ───────────────────────────────────────────────────

function fmt(amount) {
  if (amount === null || amount === undefined || amount === '') return '—'
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

const METHOD_ICONS = {
  cash:     'payments',
  transfer: 'swap_horiz',
  card:     'credit_card',
  other:    'more_horiz',
}

const METHOD_LABELS = {
  cash: 'Cash', transfer: 'Transfer', card: 'Card', other: 'Other',
}

const STATUS_META = {
  paid:     { label: 'Paid',         color: '#15803d', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
  part:     { label: 'Part Payment', color: '#c2410c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  not_paid: { label: 'Not Paid',     color: '#dc2626', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
}

// ── Flatten all payments into individual installment rows ─────
//
// Each row:
// {
//   rowKey       — unique key for React
//   paymentId    — parent payment doc id
//   customerId
//   customerName
//   orderId
//   orderDesc
//   orderPrice
//   paymentStatus — overall payment status (paid/part/not_paid)
//   amount        — this installment's amount
//   method        — this installment's method
//   date          — this installment's date (for grouping)
//   installIndex  — position in parent installments array
//   totalInstallments — how many installments total for this payment
//   totalPaid     — running total across all installments
// }
//
// If a payment has NO installments (status = not_paid), we still
// show one row so it's visible in the feed.
// ─────────────────────────────────────────────────────────────

function flattenPayments(allPayments) {
  const rows = []

  for (const p of allPayments) {
    const installments = p.installments || []
    const totalPaid = installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

    if (installments.length === 0) {
      // No money has moved yet — show a placeholder row on creation date
      rows.push({
        rowKey:            `${p.id}__none`,
        paymentId:         p.id,
        customerId:        p.customerId,
        customerName:      p.customerName,
        orderId:           p.orderId,
        orderDesc:         p.orderDesc,
        orderPrice:        p.orderPrice,
        paymentStatus:     p.status,
        amount:            null,
        method:            null,
        date:              p.date || 'Unknown Date',
        installIndex:      0,
        totalInstallments: 0,
        totalPaid:         0,
        notes:             p.notes,
      })
    } else {
      installments.forEach((inst, idx) => {
        rows.push({
          rowKey:            `${p.id}__${inst.id ?? idx}`,
          paymentId:         p.id,
          customerId:        p.customerId,
          customerName:      p.customerName,
          orderId:           p.orderId,
          orderDesc:         p.orderDesc,
          orderPrice:        p.orderPrice,
          paymentStatus:     p.status,
          amount:            inst.amount,
          method:            inst.method || 'cash',
          date:              inst.date || p.date || 'Unknown Date',
          installIndex:      idx + 1,
          totalInstallments: installments.length,
          totalPaid,
          notes:             p.notes,
        })
      })
    }
  }

  return rows
}

// ── Sort rows newest-first by date ────────────────────────────
function sortRows(rows) {
  return [...rows].sort((a, b) => {
    // Try to parse as a real date for comparison
    const parseD = (str) => {
      if (!str || str === 'Unknown Date') return 0
      const d = new Date(str)
      return isNaN(d) ? 0 : d.getTime()
    }
    return parseD(b.date) - parseD(a.date)
  })
}

// ── TABS ──────────────────────────────────────────────────────
const TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'paid',     label: 'Paid'     },
  { id: 'part',     label: 'Partial'  },
  { id: 'not_paid', label: 'Not Paid' },
]

// ── PAYMENT ROW ───────────────────────────────────────────────

function PaymentRow({ row, isLast, onTap }) {
  const sm     = STATUS_META[row.paymentStatus] ?? STATUS_META.not_paid
  const mIcon  = METHOD_ICONS[row.method] ?? 'payments'
  const mLabel = METHOD_LABELS[row.method] ?? 'Cash'
  const fullPrice = parseFloat(row.orderPrice) || 0
  const pct    = fullPrice > 0 && row.totalPaid > 0
    ? Math.min(100, (row.totalPaid / fullPrice) * 100)
    : 0

  const isPartInstall = row.totalInstallments > 1
  const isPending     = row.amount === null

  return (
    <div
      className={`${styles.row} ${isLast ? styles.rowLast : ''}`}
      onClick={() => onTap(row)}
    >
      {/* ── Icon box ── */}
      <div
        className={styles.iconOuter}
        style={{
          borderColor: !isPending ? sm.border : undefined,
          background:  !isPending ? sm.bg     : undefined,
        }}
      >
        <div className={styles.iconInner}>
          <span className="mi" style={{ fontSize: '1.4rem', color: isPending ? '#94a3b8' : sm.color }}>
            {isPending ? 'hourglass_empty' : mIcon}
          </span>
        </div>
      </div>

      {/* ── Info ── */}
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <span className={styles.desc}>{row.orderDesc || 'Payment'}</span>
          {isPartInstall && (
            <span className={styles.installBadge}>
              {row.installIndex}/{row.totalInstallments}
            </span>
          )}
        </div>

        {/* Customer name */}
        <div className={styles.metaRow}>
          <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>person</span>
          <span className={styles.metaText}>{row.customerName}</span>
        </div>

        {/* Status pill — sits under customer name like inventory */}
        <span
          className={styles.statusPill}
          style={{ background: sm.bg, color: sm.color, borderColor: sm.border }}
        >
          {sm.label}
        </span>

        {/* Method */}
        {row.method && (
          <div className={styles.metaRow} style={{ marginTop: 4 }}>
            <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{mIcon}</span>
            <span className={styles.metaText}>{mLabel}</span>
          </div>
        )}

        {/* Progress bar */}
        {fullPrice > 0 && row.totalInstallments > 0 && (
          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{ width: `${pct}%`, background: sm.color }}
            />
          </div>
        )}
      </div>

      {/* ── Amount (right column — amount only) ── */}
      <div className={styles.amountCol}>
        <div
          className={styles.amount}
          style={{ color: isPending ? 'var(--text3)' : sm.color }}
        >
          {isPending ? '—' : fmt(row.amount)}
        </div>
      </div>
    </div>
  )
}

// ── ROW DETAIL SHEET ──────────────────────────────────────────

function PaymentDetail({ row, onClose, onNavigateToCustomer }) {
  if (!row) return null

  const sm        = STATUS_META[row.paymentStatus] ?? STATUS_META.not_paid
  const mLabel    = METHOD_LABELS[row.method] ?? '—'
  const fullPrice = parseFloat(row.orderPrice) || 0
  const pct       = fullPrice > 0 && row.totalPaid > 0
    ? Math.min(100, (row.totalPaid / fullPrice) * 100)
    : 0

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />

        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Payment Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', display: 'flex', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>

        <div className={styles.sheetBody}>

          {/* Amount hero */}
          <div className={styles.amountHero}>
            <div className={styles.heroAmount} style={{ color: sm.color }}>
              {row.amount !== null ? fmt(row.amount) : '₦ —'}
            </div>
            <div
              className={styles.heroPill}
              style={{ background: `${sm.color}18`, color: sm.color, borderColor: `${sm.color}40` }}
            >
              {sm.label}
            </div>
          </div>

          {/* Cells grid */}
          <div className={styles.cellGrid}>
            <div className={styles.cell}>
              <div className={styles.cellLabel}>Customer</div>
              <div className={styles.cellVal}>{row.customerName}</div>
            </div>
            <div className={styles.cell}>
              <div className={styles.cellLabel}>Date</div>
              <div className={styles.cellVal}>{row.date}</div>
            </div>
            <div className={styles.cell}>
              <div className={styles.cellLabel}>Order</div>
              <div className={styles.cellVal}>{row.orderDesc || '—'}</div>
            </div>
            <div className={styles.cell}>
              <div className={styles.cellLabel}>Method</div>
              <div className={styles.cellVal}>{row.method ? mLabel : '—'}</div>
            </div>
            {fullPrice > 0 && (
              <div className={styles.cell}>
                <div className={styles.cellLabel}>Order Value</div>
                <div className={styles.cellVal}>{fmt(row.orderPrice)}</div>
              </div>
            )}
            {row.totalInstallments > 1 && (
              <div className={styles.cell}>
                <div className={styles.cellLabel}>Instalment</div>
                <div className={styles.cellVal}>{row.installIndex} of {row.totalInstallments}</div>
              </div>
            )}
          </div>

          {/* Progress — total paid vs order price */}
          {fullPrice > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressLabelRow}>
                <span className={styles.progressLabel}>Total Paid</span>
                <span className={styles.progressFigure}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(row.totalPaid)}</span>
                  <span style={{ color: 'var(--text3)' }}> of {fmt(row.orderPrice)}</span>
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${pct}%`, background: sm.color }}
                />
              </div>
            </div>
          )}

          {row.notes && (
            <div className={styles.notesBox}>
              <div className={styles.notesLabel}>Notes</div>
              <p className={styles.notesText}>{row.notes}</p>
            </div>
          )}

          {/* Navigate to customer */}
          <button
            className={styles.viewCustomerBtn}
            onClick={() => { onClose(); onNavigateToCustomer(row.customerId) }}
          >
            <span className="mi" style={{ fontSize: '1rem' }}>open_in_new</span>
            View {row.customerName}'s Profile
          </button>

        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────

export default function AllPayments({ onMenuClick }) {
  const navigate         = useNavigate()
  const { allPayments }  = usePayments()

  const [activeTab,  setActiveTab]  = useState('all')
  const [detailRow,  setDetailRow]  = useState(null)
  const [toastMsg,   setToastMsg]   = useState('')
  const [search,     setSearch]     = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── Flatten → sort ────────────────────────────────────────
  const allRows = sortRows(flattenPayments(allPayments))

  // ── Filter by tab ─────────────────────────────────────────
  const tabFiltered = allRows.filter(r => {
    if (activeTab === 'all')      return true
    if (activeTab === 'paid')     return r.paymentStatus === 'paid'
    if (activeTab === 'part')     return r.paymentStatus === 'part'
    if (activeTab === 'not_paid') return r.paymentStatus === 'not_paid'
    return true
  })

  // ── Search by customer name or order desc ─────────────────
  const filtered = search.trim()
    ? tabFiltered.filter(r =>
        r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        r.orderDesc?.toLowerCase().includes(search.toLowerCase())
      )
    : tabFiltered

  // ── Tab counts ────────────────────────────────────────────
  const counts = {
    all:      allRows.length,
    paid:     allRows.filter(r => r.paymentStatus === 'paid').length,
    part:     allRows.filter(r => r.paymentStatus === 'part').length,
    not_paid: allRows.filter(r => r.paymentStatus === 'not_paid').length,
  }

  // ── Total received across visible rows ────────────────────
  const totalReceived = filtered
    .filter(r => r.amount !== null)
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  // ── Group by date ─────────────────────────────────────────
  const grouped = filtered.reduce((acc, row) => {
    const key = row.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="Payments" />

      {/* ── Search + filter ── */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search client or order…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer', padding: 0 }}
                onClick={() => setSearch('')}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
          <button
            className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(p => !p)}
          >
            <span className="mi" style={{ fontSize: '1.2rem' }}>tune</span>
          </button>
        </div>

        {/* Total received — sits under search bar */}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total Received</span>
          <span className={styles.totalVal} style={{ color: '#15803d' }}>{fmt(totalReceived)}</span>
        </div>

        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Filter by Status</div>
            {[{ id: 'all', label: 'All Statuses' }, ...TABS.slice(1)].map(t => (
              <button
                key={t.id}
                className={`${styles.filterOption} ${filterStatus === t.id ? styles.filterOptionActive : ''}`}
                onClick={() => { setFilterStatus(t.id); setActiveTab(t.id); setFilterOpen(false) }}
              >
                <span className="mi" style={{ fontSize: '1.1rem' }}>
                  {t.id === 'paid' ? 'check_circle' : t.id === 'part' ? 'pending' : t.id === 'not_paid' ? 'cancel' : 'payments'}
                </span>
                {t.label || 'All Statuses'}
                {filterStatus === t.id && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'not_paid' ? styles.badgeRed : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── List ── */}
      <div className={styles.listArea}>

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>
              {activeTab === 'paid' ? 'check_circle' : activeTab === 'not_paid' ? 'pending' : 'payments'}
            </span>
            <p>
              {search
                ? `No results for "${search}"`
                : activeTab === 'all'
                  ? 'No payments recorded yet.'
                  : `No ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()} payments.`}
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([date, rows]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateLabel}>{date}</div>
            <div className={styles.dateDivider} />

            {rows.map((row, idx) => (
              <PaymentRow
                key={row.rowKey}
                row={row}
                isLast={idx === rows.length - 1}
                onTap={setDetailRow}
              />
            ))}
          </div>
        ))}

        <div style={{ height: 32 }} />
      </div>

      {/* ── Detail sheet ── */}
      {detailRow && (
        <PaymentDetail
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onNavigateToCustomer={(id) => navigate(`/customers/${id}`)}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  )
}