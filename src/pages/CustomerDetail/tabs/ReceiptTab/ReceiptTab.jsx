// src/pages/CustomerDetail/tabs/ReceiptTab.jsx

import { useState } from 'react'
import ReceiptViewer from '../../../../components/ReceiptViewer/ReceiptViewer'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import styles from './ReceiptTab.module.css'

function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
// ─────────────────────────────────────────────────────────────
function OrderMosaic({ orderItems, fallbackIcon, fallbackColor }) {
  const covers = (orderItems || [])
    .map(item => item.imgSrc ?? null)
    .filter(Boolean)

  const total = (orderItems || []).length

  if (covers.length === 0) {
    return (
      <div className={styles.invoiceListOuter}>
        <div className={styles.invoiceListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: fallbackColor || 'var(--text3)' }}>
            {fallbackIcon || 'receipt'}
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

// ── Receipt card ──────────────────────────────────────────────

function ReceiptCard({ receipt, currency, onTap, isLast, orderItems }) {
  const thisPaymentAmount = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

  const cumulativePaid = receipt.cumulativePaid != null
    ? parseFloat(receipt.cumulativePaid)
    : thisPaymentAmount

  const orderTotal  = parseFloat(receipt.orderPrice) || cumulativePaid
  const isFullPay   = cumulativePaid >= orderTotal && orderTotal > 0
  const statusLabel = isFullPay ? 'Paid in Full' : 'Part Payment'

  const statusStyle = isFullPay
    ? { bg: 'rgba(34,197,94,0.12)',  color: '#15803d', border: 'rgba(34,197,94,0.3)'  }
    : { bg: 'rgba(251,146,60,0.12)', color: '#c2410c', border: 'rgba(251,146,60,0.3)' }

  return (
    <div
      className={`${styles.invoiceListItem} ${isLast ? styles.invoiceListItemLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic
        orderItems={orderItems}
        fallbackIcon="receipt"
        fallbackColor={isFullPay ? '#22c55e' : '#fb923c'}
      />

      {/* Centre: order name + date */}
      <div className={styles.invoiceListInfo}>
        <div className={styles.invoiceListDesc}>{receipt.orderDesc || 'Payment'}</div>
        <div className={styles.invoiceListSub}>Generated {receipt.date}</div>
      </div>

      {/* Right: status badge + amount */}
      <div className={styles.invoiceListRight}>
        <span
          className={styles.invoiceListStatusBadge}
          style={{
            background:   statusStyle.bg,
            color:        statusStyle.color,
            borderColor:  statusStyle.border,
          }}
        >
          {statusLabel}
        </span>
        <div className={styles.invoiceListAmount}>{fmt(currency, thisPaymentAmount)}</div>
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
  orders = [],
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

  const orderItemsMap = {}
  for (const order of orders) {
    if (order.id && order.items?.length > 0) {
      orderItemsMap[order.id] = order.items
    }
  }

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
          {dateReceipts.map((r, idx) => {
            const orderItems = orderItemsMap[r.orderId] ?? r.orderItems ?? []
            return (
              <ReceiptCard
                key={r.id}
                receipt={r}
                currency={currency}
                isLast={idx === dateReceipts.length - 1}
                onTap={() => setViewingReceipt(r)}
                orderItems={orderItems}
              />
            )
          })}
        </div>
      ))}

      {viewingReceipt && (
        <ReceiptViewer
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