import { useState } from 'react'
import InvoiceViewer from '../../../../components/InvoiceViewer/InvoiceViewer'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
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
// ORDER MOSAIC THUMBNAIL  (shared pattern with OrdersTab)
// items = order.items[] — each has imgSrc
// Layout:
//   0 imgs  → icon placeholder
//   1 img   → single full thumb
//   2 imgs  → left half | right half
//   3+ imgs → large left | right column (top + bottom stacked)
//             4+ shows "+N" overlay on bottom-right
// ─────────────────────────────────────────────────────────────
function OrderMosaic({ orderItems, fallbackIcon }) {
  const covers = (orderItems || [])
    .map(item => item.imgSrc ?? null)
    .filter(Boolean)

  const total = (orderItems || []).length

  if (covers.length === 0) {
    return (
      <div className={styles.invoiceListOuter}>
        <div className={styles.invoiceListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>
            {fallbackIcon || 'receipt_long'}
          </span>
        </div>
      </div>
    )
  }

  if (total === 1) {
    return (
      <div className={styles.invoiceListOuter}>
        <div className={styles.invoiceListInner}>
          <img src={covers[0]} alt="" className={styles.orderImg} />
        </div>
      </div>
    )
  }

  if (total === 2) {
    return (
      <div className={styles.invoiceListOuter}>
        <div className={`${styles.invoiceListInner} ${styles.mosaicInner}`}>
          <div className={styles.mosaicLeft}>
            <img src={covers[0]} alt="" className={styles.mosaicImg} />
          </div>
          <div className={styles.mosaicDividerV} />
          <div className={styles.mosaicRight}>
            <div className={styles.mosaicRightCell}>
              {covers[1]
                ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3+ items → large left + two stacked right
  const extra = total > 3 ? total - 3 : 0

  return (
    <div className={styles.invoiceListOuter}>
      <div className={`${styles.invoiceListInner} ${styles.mosaicInner}`}>
        <div className={styles.mosaicLeft}>
          {covers[0]
            ? <img src={covers[0]} alt="" className={styles.mosaicImg} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDividerV} />
        <div className={styles.mosaicRight}>
          <div className={styles.mosaicRightCell}>
            {covers[1]
              ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDividerH} />
          <div className={`${styles.mosaicRightCell} ${extra > 0 ? styles.mosaicOverlayWrap : ''}`}>
            {covers[2]
              ? <img src={covers[2]} alt="" className={styles.mosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extra > 0 && (
              <div className={styles.mosaicOverlay}>+{extra}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Invoice card
// ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap, isLast, orderItems }) {
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
      {/* Left: mosaic thumbnail */}
      <OrderMosaic orderItems={orderItems} fallbackIcon="receipt_long" />

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
          {fmt('₦', total)}
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
  orders = [],
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

  // Build order items lookup: orderId → items[]
  // We pass the full items array so the mosaic can use all cover images
  const orderItemsMap = {}
  for (const order of orders) {
    if (order.id && order.items?.length > 0) {
      orderItemsMap[order.id] = order.items
    }
  }

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
              orderItems={orderItemsMap[inv.orderId] ?? []}
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
          <InvoiceViewer
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
