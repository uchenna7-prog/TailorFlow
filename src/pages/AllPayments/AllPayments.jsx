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
    const fullPrice    = parseFloat(p.orderPrice) || 0

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
      // Each installment row gets its OWN snapshot:
      //   - totalPaid = cumulative sum UP TO AND INCLUDING this installment
      //   - paymentStatus = derived from that running total, not the parent's final status
      // This way earlier part-payments stay "Part Payment" even after the last
      // installment tips the overall payment to "paid".
      let runningTotal = 0
      installments.forEach((inst, idx) => {
        const previousPaid = runningTotal  // what was paid BEFORE this installment
        runningTotal += parseFloat(inst.amount) || 0

        // Every installment row always shows 'part' status and a partial bar —
        // even the last one that clears the balance. The N/N badge already
        // signals it's the final payment; the status pill stays "Part Payment"
        // so each row is independent and self-consistent.
        const rowStatus = 'part'

        // previousInstallments = all installments before this one (for detail sheet)
        const previousInstallments = installments.slice(0, idx).map(i => ({
          amount: i.amount,
          method: i.method || 'cash',
          date:   i.date || p.date || '',
        }))

        rows.push({
          rowKey:                `${p.id}__${inst.id ?? idx}`,
          paymentId:             p.id,
          customerId:            p.customerId,
          customerName:          p.customerName,
          orderId:               p.orderId,
          orderDesc:             p.orderDesc,
          orderPrice:            p.orderPrice,
          paymentStatus:         rowStatus,
          amount:                inst.amount,
          method:                inst.method || 'cash',
          date:                  inst.date || p.date || 'Unknown Date',
          installIndex:          idx + 1,
          totalInstallments:     installments.length,
          totalPaid:             runningTotal,
          previousPaid,
          previousInstallments,
          notes:                 p.notes,
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
  const sm        = STATUS_META[row.paymentStatus] ?? STATUS_META.not_paid
  const mIcon     = METHOD_ICONS[row.method] ?? 'payments'
  const mLabel    = METHOD_LABELS[row.method] ?? 'Cash'
  const fullPrice = parseFloat(row.orderPrice) || 0

  // Progress bar shows cumulative up to this installment (not 100% even for last)
  const pct = fullPrice > 0 && row.totalPaid > 0
    ? Math.min(99, (row.totalPaid / fullPrice) * 100)  // cap at 99% — each row is a part payment
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

  const sm              = STATUS_META[row.paymentStatus] ?? STATUS_META.not_paid
  const mLabel          = METHOD_LABELS[row.method] ?? '—'
  const fullPrice       = parseFloat(row.orderPrice) || 0
  const thisAmount      = parseFloat(row.amount) || 0
  const previousPaid    = parseFloat(row.previousPaid) || 0
  const totalPaid       = parseFloat(row.totalPaid) || 0
  const balanceBefore   = fullPrice > 0 ? Math.max(0, fullPrice - previousPaid) : 0
  const balanceAfter    = fullPrice > 0 ? Math.max(0, fullPrice - totalPaid)    : 0
  const hasPrevious     = (row.previousInstallments?.length > 0) || previousPaid > 0
  const pct             = fullPrice > 0 ? Math.min(99, (totalPaid / fullPrice) * 100) : 0

  const cellStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
  }
  const cellLbl = {
    fontSize: '0.58rem', fontWeight: 800, color: 'var(--text3)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  }
  const cellVal = {
    fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3,
  }

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

          {/* ── Amount hero ── */}
          <div className={styles.amountHero}>
            <div className={styles.heroAmount} style={{ color: sm.color }}>
              {row.amount !== null ? fmt(row.amount) : '₦ —'}
            </div>
            <div
              className={styles.heroPill}
              style={{ background: `${sm.color}18`, color: sm.color, borderColor: `${sm.color}40` }}
            >
              {sm.label}
              {row.totalInstallments > 1 && ` · ${row.installIndex}/${row.totalInstallments}`}
            </div>
          </div>

          {/* ── Info cells ── */}
          <div className={styles.cellGrid}>
            <div style={cellStyle}>
              <div style={cellLbl}>Customer</div>
              <div style={cellVal}>{row.customerName}</div>
            </div>
            <div style={cellStyle}>
              <div style={cellLbl}>Date</div>
              <div style={cellVal}>{row.date}</div>
            </div>
            <div style={cellStyle}>
              <div style={cellLbl}>Order</div>
              <div style={cellVal}>{row.orderDesc || '—'}</div>
            </div>
            <div style={cellStyle}>
              <div style={cellLbl}>Method</div>
              <div style={cellVal}>{row.method ? mLabel : '—'}</div>
            </div>
          </div>

          {/* ── Smart payment breakdown (like ReceiptView) ── */}
          {fullPrice > 0 && (
            <div className={styles.progressSection}>

              {/* Order value */}
              <div className={styles.progressLabelRow}>
                <span className={styles.progressLabel}>Order Value</span>
                <span className={styles.progressFigure} style={{ color: 'var(--text)', fontWeight: 700 }}>
                  {fmt(row.orderPrice)}
                </span>
              </div>

              {/* Previous payments (2nd installment onwards) */}
              {hasPrevious && (
                <>
                  {(row.previousInstallments || []).map((p, i) => (
                    <div key={i} className={styles.progressLabelRow} style={{ marginTop: 6 }}>
                      <span className={styles.progressLabel} style={{ color: '#6b7280' }}>
                        Payment {i + 1} · {p.date}{p.method ? ` · ${p.method.charAt(0).toUpperCase() + p.method.slice(1)}` : ''}
                      </span>
                      <span className={styles.progressFigure} style={{ color: '#6b7280' }}>
                        {fmt(p.amount)}
                      </span>
                    </div>
                  ))}
                  {/* Balance before this payment */}
                  <div className={styles.progressLabelRow} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span className={styles.progressLabel}>Balance Before This Payment</span>
                    <span className={styles.progressFigure} style={{ color: '#f59e0b', fontWeight: 700 }}>
                      {fmt(balanceBefore)}
                    </span>
                  </div>
                </>
              )}

              {/* This payment */}
              <div className={styles.progressLabelRow} style={{ marginTop: 8 }}>
                <span className={styles.progressLabel}>This Payment</span>
                <span className={styles.progressFigure} style={{ color: '#22c55e', fontWeight: 700 }}>
                  {fmt(thisAmount)}
                </span>
              </div>

              {/* Balance remaining after this payment */}
              {balanceAfter > 0 && (
                <div className={styles.progressLabelRow} style={{ marginTop: 6 }}>
                  <span className={styles.progressLabel}>Balance Remaining</span>
                  <span className={styles.progressFigure} style={{ color: '#ef4444', fontWeight: 700 }}>
                    {fmt(balanceAfter)}
                  </span>
                </div>
              )}
              {balanceAfter === 0 && (
                <div className={styles.progressLabelRow} style={{ marginTop: 6 }}>
                  <span className={styles.progressLabel}>Balance Remaining</span>
                  <span className={styles.progressFigure} style={{ color: '#22c55e', fontWeight: 700 }}>
                    Fully Paid ✓
                  </span>
                </div>
              )}

              {/* Progress bar — cumulative up to this installment */}
              <div className={styles.progressTrack} style={{ marginTop: 12 }}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${pct}%`, background: sm.color }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>
                  {fmt(totalPaid)} paid
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>
                  {fmt(fullPrice)} total
                </span>
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