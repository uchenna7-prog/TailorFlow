// src/pages/CustomerDetail/tabs/ReceiptTab.jsx

import { useState } from 'react'
import ReceiptView from './ReceiptView'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './InvoiceTab.module.css'   // reuse InvoiceTab styles — identical card design

function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

// ── Receipt card (same layout as InvoiceCard) ─────────────────

function ReceiptCard({ receipt, currency, onTap, isLast }) {
  const totalPaid = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const orderTotal = parseFloat(receipt.orderPrice) || totalPaid
  const isFullPay  = totalPaid >= orderTotal && orderTotal > 0
  const statusLabel = isFullPay ? 'Paid in Full' : 'Part Payment'

  return (
    <div
      className={`${styles.invoiceListItem} ${isLast ? styles.invoiceListItemLast : ''}`}
      onClick={onTap}
    >
      <div className={styles.invoiceListOuter}>
        <div className={styles.invoiceListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: isFullPay ? '#22c55e' : '#fb923c' }}>
            receipt
          </span>
        </div>
      </div>

      <div className={styles.invoiceListInfo}>
        <div className={styles.invoiceListDesc}>{receipt.orderDesc || 'Payment'}</div>
        <div className={styles.invoiceListSub}>Generated on {receipt.date}</div>
        <div className={styles.invoiceListStatusRow}>
          <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)', verticalAlign: 'middle' }}>
            {isFullPay ? 'check_circle' : 'pending'}
          </span>
          <span className={styles.invoiceListStatusText} style={{ color: isFullPay ? '#22c55e' : '#fb923c' }}>
            {statusLabel}
          </span>
        </div>
        <div className={styles.invoiceListAmount}>{fmt(currency, totalPaid)}</div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={styles.empty}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt</span>
      <p className={styles.emptyTitle}>No receipts yet</p>
      <p className={styles.emptySub}>
        Go to the Payments tab, open a payment, and tap{' '}
        <strong>Generate Receipt</strong>.
      </p>
    </div>
  )
}

// ── Main ReceiptTab ───────────────────────────────────────────

export default function ReceiptTab({
  receipts = [],
  customer,
  onDelete,
  showToast,
}) {
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  const currency = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
      return s.invoiceCurrency || '₦'
    } catch { return '₦' }
  })()

  const confirmDelete = () => {
    onDelete(deleteTarget)
    showToast('Receipt deleted')
    setDeleteTarget(null)
    if (viewingReceipt?.id === deleteTarget) setViewingReceipt(null)
  }

  const grouped = receipts.reduce((acc, r) => {
    const key = r.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  if (receipts.length === 0) return <EmptyState />

  return (
    <>
      {Object.entries(grouped).map(([date, dateReceipts]) => (
        <div key={date} className={styles.invoiceGroup}>
          <div className={styles.invoiceGroupDate}>{date}</div>
          <div className={styles.invoiceGroupDivider} />
          {dateReceipts.map((r, idx) => (
            <ReceiptCard
              key={r.id}
              receipt={r}
              currency={currency}
              isLast={idx === dateReceipts.length - 1}
              onTap={() => setViewingReceipt(r)}
            />
          ))}
        </div>
      ))}

      {viewingReceipt && (
        <ReceiptView
          receipt={viewingReceipt}
          customer={customer}
          onClose={() => setViewingReceipt(null)}
          onDelete={(id) => setDeleteTarget(id)}
          showToast={showToast}
        />
      )}

      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this receipt?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
