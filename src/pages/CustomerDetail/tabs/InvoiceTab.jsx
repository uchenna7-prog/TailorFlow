import { useState } from 'react'
import InvoiceView from './InvoiceView'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './InvoiceTab.module.css'



function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const STATUS_LABELS = { unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue' }
const STATUS_NEXT   = { unpaid: 'paid', paid: 'unpaid', overdue: 'paid' }

// ─────────────────────────────────────────────────────────────
// Invoice card
// ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap, onStatusChange, onDelete }) {
  const total = (parseFloat(invoice.price) || 0) * (parseFloat(invoice.qty) || 1)

  return (
    <div className={styles.card} onClick={onTap}>
      <div className={styles.cardTop}>
        <div className={styles.cardNum}>{invoice.number}</div>
        <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
          {STATUS_LABELS[invoice.status] || invoice.status}
        </div>
      </div>

      <div className={styles.cardDesc}>{invoice.orderDesc || 'Order'}</div>

      <div className={styles.cardMeta}>
        <span className={styles.cardDate}>{invoice.date}</span>
        <span className={styles.cardAmount}>{fmt(currency, total)}</span>
      </div>

      {/* Quick actions — stop propagation so they don't open the view */}
      <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
        <button
          className={styles.actionBtn}
          onClick={() => onStatusChange(invoice.id, STATUS_NEXT[invoice.status] || 'paid')}
        >
          <span className="mi" style={{ fontSize: '0.9rem' }}>
            {invoice.status === 'paid' ? 'undo' : 'check_circle'}
          </span>
          {invoice.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => onDelete(invoice.id)}>
          <span className="mi" style={{ fontSize: '0.9rem' }}>delete</span>
          Delete
        </button>
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

  // Read currency from settings via localStorage directly
  // (avoids prop drilling — BrandContext handles the full brand for InvoiceView)
  const currency = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
      return s.invoiceCurrency || '₦'
    } catch { return '₦' }
  })()

  const handleDelete = (id) => setDeleteTarget(id)

  const confirmDelete = () => {
    onDelete(deleteTarget)
    showToast('Invoice deleted')
    setDeleteTarget(null)
    // Close view if we deleted the one being viewed
    if (viewingInvoice?.id === deleteTarget) setViewingInvoice(null)
  }

  const handleStatusChange = (id, newStatus) => {
    onStatusChange(id, newStatus)
    showToast(`Marked as ${newStatus}`)
    // Update the viewing invoice if it's the one being changed
    if (viewingInvoice?.id === id) {
      setViewingInvoice(prev => ({ ...prev, status: newStatus }))
    }
  }

  if (invoices.length === 0) return <EmptyState />

  return (
    <>
      <div className={styles.list}>
        {invoices.map(inv => (
          <InvoiceCard
            key={inv.id}
            invoice={inv}
            currency={currency}
            onTap={() => setViewingInvoice(inv)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Full-screen invoice renderer */}
      {viewingInvoice && (
        <InvoiceView
          invoice={viewingInvoice}
          customer={customer}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this invoice?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
