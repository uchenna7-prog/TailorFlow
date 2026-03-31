import { useState } from 'react'
import InvoiceView from './InvoiceView'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './InvoiceTab.module.css'

function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const STATUS_LABELS = { unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue' }

// ─────────────────────────────────────────────────────────────
// Invoice card
// ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap }) {
  const total = (parseFloat(invoice.price) || 0) * (parseFloat(invoice.qty) || 1)

  return (
    <div className={styles.card} onClick={onTap}>
      <div className={styles.cardLeft}>
        <div className={styles.cardIcon}>
          <span className="mi">receipt_long</span>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardDesc}>{invoice.orderDesc || 'Order'}</div>
        <div className={styles.cardSub}>
          {invoice.date}
          <span className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
            {STATUS_LABELS[invoice.status] || invoice.status}
          </span>
        </div>
      </div>
      <div className={styles.cardRight}>
        <div className={styles.cardAmount}>{fmt(currency, total)}</div>
        {invoice.qty > 1 && (
          <div className={styles.cardQty}>×{invoice.qty}</div>
        )}
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
    showToast(`Marked as ${newStatus}`)
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
          />
        ))}
      </div>

      {viewingInvoice && (
        <InvoiceView
          invoice={viewingInvoice}
          customer={customer}
          onClose={() => setViewingInvoice(null)}
          onStatusChange={handleStatusChange}
          onDelete={(id) => setDeleteTarget(id)}
          showToast={showToast}
        />
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
