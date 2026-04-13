import { useState } from 'react'
import InvoiceView from './InvoiceView'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../components/Header/Header'
import styles from './InvoiceTab.module.css'

function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

const STATUS_LABELS = {
  unpaid:    'Unpaid',
  part_paid: 'Part Payment',
  paid:      'Full Payment',
  overdue:   'Overdue',
}

const STATUS_STYLES = {
  paid:      { bg: 'rgba(34,197,94,0.12)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'   },
  part_paid: { bg: 'rgba(251,146,60,0.12)',  color: '#c2410c', border: 'rgba(251,146,60,0.3)'  },
  unpaid:    { bg: 'rgba(234,179,8,0.12)',   color: '#a16207', border: 'rgba(234,179,8,0.3)'   },
  overdue:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', border: 'rgba(239,68,68,0.3)'   },
}

// ─────────────────────────────────────────────────────────────
// Invoice card
// ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap, isLast }) {
  const total = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(invoice.price) || 0)

  const statusKey   = invoice.status || 'unpaid'
  const statusLabel = STATUS_LABELS[statusKey] || invoice.status
  const sty         = STATUS_STYLES[statusKey] || STATUS_STYLES.unpaid
  const pieceCount  = invoice.items?.length > 0 ? invoice.items.length : (invoice.qty || null)

  return (
    <div
      className={`${styles.invoiceListItem} ${isLast ? styles.invoiceListItemLast : ''}`}
      onClick={onTap}
    >
      {/* Left: grey outer box with white inner box */}
      <div className={styles.invoiceListOuter}>
        <div className={styles.invoiceListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>receipt_long</span>
        </div>
      </div>

      {/* Info */}
      <div className={styles.invoiceListInfo}>
        <div className={styles.invoiceListDesc}>{invoice.orderDesc || 'Order'}</div>
        <div className={styles.invoiceListSub}>Generated on {invoice.date}</div>
        <span style={{
          display: 'inline-block',
          marginTop: '4px',
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 600,
          border: `1px solid ${sty.border}`,
          background: sty.bg,
          color: sty.color,
        }}>
          {statusLabel}
        </span>
        <div className={styles.invoiceListAmount}>
          {fmt(currency, total)}
          {pieceCount && (
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text3)', marginLeft: '5px' }}>
              ({pieceCount} {pieceCount === 1 ? 'pc' : 'pcs'})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={styles.empty}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt_long</span>
      <p className={styles.emptyTitle}>No invoices yet</p>
      <p className={styles.emptySub}>
        Go to the Orders tab and tap{' '}
        <strong>Generate Invoice</strong> on any order.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main InvoiceTab
// ─────────────────────────────────────────────────────────────

export default function InvoiceTab({
  invoices = [],
  customer,
  onStatusChange,
  onDelete,
  showToast,
}) {
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  const currency = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
      return s.invoiceCurrency || '₦'
    } catch { return '₦' }
  })()

  const confirmDelete = () => {
    onDelete(deleteTarget)
    showToast('Invoice deleted')
    setDeleteTarget(null)
    if (viewingInvoice?.id === deleteTarget) setViewingInvoice(null)
  }

  const handleStatusChange = (id, newStatus) => {
    onStatusChange(id, newStatus)
    showToast(`Marked as ${STATUS_LABELS[newStatus] || newStatus}`)
    if (viewingInvoice?.id === id) {
      setViewingInvoice(prev => ({ ...prev, status: newStatus }))
    }
  }

  // Group invoices by date
  const grouped = invoices.reduce((acc, inv) => {
    const key = inv.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(inv)
    return acc
  }, {})

  if (invoices.length === 0) return <EmptyState />

  return (
    <>
      {Object.entries(grouped).map(([date, dateInvoices]) => (
        <div key={date} className={styles.invoiceGroup}>
          <div className={styles.invoiceGroupDate}>{date}</div>
          <div className={styles.invoiceGroupDivider} />

          {dateInvoices.map((inv, idx) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              currency={currency}
              isLast={idx === dateInvoices.length - 1}
              onTap={() => setViewingInvoice(inv)}
            />
          ))}
        </div>
      ))}

      {viewingInvoice && (
        <div className={styles.modalOverlay}>
          <Header 
            type="back"
            title="Invoice Details"
            onBackClick={() => setViewingInvoice(null)}
            customActions={[
              { icon: 'delete_outline', label: 'Delete', onClick: () => setDeleteTarget(viewingInvoice.id), color: 'var(--danger)' }
            ]}
          />
          <InvoiceView
            invoice={viewingInvoice}
            customer={customer}
            onClose={() => setViewingInvoice(null)}
            onStatusChange={handleStatusChange}
            onDelete={(id) => setDeleteTarget(id)}
            showToast={showToast}
          />
        </div>
      )}

      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this invoice?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
