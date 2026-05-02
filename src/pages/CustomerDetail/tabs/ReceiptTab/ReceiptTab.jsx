// src/pages/CustomerDetail/tabs/ReceiptTab/ReceiptTab.jsx

import { useState, useEffect, useRef } from 'react'
import ReceiptViewer from '../../../../components/ReceiptViewer/ReceiptViewer'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
import styles from './ReceiptTab.module.css'


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatMoney(currency = '₦', amount) {
  const number = parseFloat(amount) || 0
  return `${currency}${number.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function getCurrency() {
  try {
    const settings = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
    return settings.invoiceCurrency || '₦'
  } catch {
    return '₦'
  }
}

function groupReceiptsByDate(receipts) {
  return receipts.reduce((groups, receipt) => {
    const date = receipt.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(receipt)
    return groups
  }, {})
}

function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of orders) {
    if (order.id && order.items?.length > 0) {
      map[order.id] = order.items
    }
  }
  return map
}

function getPaymentStatus(receipt) {
  const thisPayment  = (receipt.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid    = receipt.cumulativePaid != null ? parseFloat(receipt.cumulativePaid) : thisPayment
  const orderTotal   = parseFloat(receipt.orderPrice) || totalPaid
  const isPaidInFull = totalPaid >= orderTotal && orderTotal > 0

  return {
    thisPayment,
    isPaidInFull,
    label: isPaidInFull ? 'Paid in Full' : 'Part Payment',
    badgeStyle: isPaidInFull
      ? { background: 'rgba(34,197,94,0.12)',  color: '#15803d', borderColor: 'rgba(34,197,94,0.3)'  }
      : { background: 'rgba(251,146,60,0.12)', color: '#c2410c', borderColor: 'rgba(251,146,60,0.3)' },
  }
}

function getTotalPaid(installments) {
  return (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
}

function capitalise(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ orderItems, fallbackIcon, fallbackColor, size = 68 }) {
  const images     = (orderItems || []).map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = (orderItems || []).length
  const innerSize  = Math.round(size * 0.74)
  const radius     = Math.round(size * 0.176)
  const innerRadius = Math.round(innerSize * 0.18)

  const outerStyle = {
    width: size, height: size, borderRadius: radius,
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  const innerStyle = {
    width: innerSize, height: innerSize, borderRadius: innerRadius,
    background: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  }

  if (images.length === 0) {
    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          <span className="mi" style={{ fontSize: '1.4rem', color: fallbackColor || 'var(--text3)' }}>
            {fallbackIcon || 'receipt'}
          </span>
        </div>
      </div>
    )
  }

  if (totalItems === 1) {
    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
    )
  }

  const extraCount = totalItems > 3 ? totalItems - 3 : 0
  const splitStyle = { ...innerStyle, padding: 0, flexDirection: 'row', alignItems: 'stretch' }

  if (totalItems === 2) {
    return (
      <div style={outerStyle}>
        <div style={splitStyle}>
          <div style={{ flex: '0 0 60%', overflow: 'hidden' }}>
            <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ width: 1.5, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {images[1]
              ? <img src={images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={outerStyle}>
      <div style={splitStyle}>
        <div style={{ flex: '0 0 60%', overflow: 'hidden' }}>
          {images[0]
            ? <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div style={{ width: 1.5, background: 'var(--border)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {images[1]
              ? <img src={images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div style={{ height: 1.5, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {images[2]
              ? <img src={images[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.6rem', fontWeight: 800,
              }}>
                +{extraCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// RECEIPT PICKER MODAL
// Full-screen — two steps: pick order → pick installment.
// Uses the Header component. Tapping an installment shows an
// inline "Generating…" spinner on that card while the receipt
// is being created, then the modal closes.
// ─────────────────────────────────────────────────────────────

function ReceiptPickerModal({ isOpen, onClose, orders, payments, receipts, onSelectPayment, generating }) {
  // step: 'order' | 'payment'
  const [step,          setStep]          = useState('order')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search,        setSearch]        = useState('')
  const searchRef                         = useRef(null)
  const currency                          = getCurrency()

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 350)
    } else {
      setStep('order')
      setSelectedOrder(null)
      setSearch('')
    }
  }, [isOpen])

  function handlePickOrder(order) {
    setSelectedOrder(order)
    setSearch('')
    setStep('payment')
  }

  function handleBack() {
    setStep('order')
    setSelectedOrder(null)
    setSearch('')
  }

  // ── Step 1: order list ──────────────────────────────────────

  const ordersWithPayments = orders.filter(order =>
    payments.some(p => String(p.orderId) === String(order.id))
  )

  const filteredOrders = ordersWithPayments.filter(order => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (order.desc    || '').toLowerCase().includes(q) ||
      (order.status  || '').toLowerCase().includes(q) ||
      (order.due     || '').toLowerCase().includes(q) ||
      (order.takenAt || '').toLowerCase().includes(q) ||
      (order.items   || []).some(i => (i.name || '').toLowerCase().includes(q))
    )
  })

  // ── Step 2: installment list ────────────────────────────────

  const orderPayment = selectedOrder
    ? payments.find(p => String(p.orderId) === String(selectedOrder.id))
    : null

  const installments = orderPayment?.installments || []

  const receiptedInstallmentIds = new Set(
    receipts
      .filter(r => String(r.paymentId) === String(orderPayment?.id))
      .flatMap(r => r.installmentIds || [])
  )

  const filteredInstallments = installments.filter(inst => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (inst.date   || '').toLowerCase().includes(q) ||
      (inst.method || '').toLowerCase().includes(q) ||
      String(inst.amount).includes(q)
    )
  })

  const totalPaid  = getTotalPaid(installments)
  const fullPrice  = parseFloat(orderPayment?.orderPrice) || 0
  const balance    = fullPrice > 0 ? Math.max(0, fullPrice - totalPaid) : 0
  const orderItems = selectedOrder?.items || []

  // Header back/close action
  const handleHeaderBack = step === 'payment' ? handleBack : onClose

  return (
    <div className={`${styles.pickerOverlay} ${isOpen ? styles.pickerOverlay_open : ''}`}>

      {/* Full-screen header using the shared Header component */}
      <Header
        type="back"
        title={step === 'order' ? 'New Receipt' : 'Select Payment'}
        onBackClick={generating ? undefined : handleHeaderBack}
      />

      {/* Subtitle + optional breadcrumb */}
      <div className={styles.pickerSubtitleBar}>
        {step === 'order'
          ? 'Choose an order to generate a receipt from'
          : (
            <>
              <span className={styles.pickerBreadcrumb}>{selectedOrder?.desc || 'Order'}</span>
              {' · '}Choose a payment to receipt
            </>
          )
        }
      </div>

      {/* Order summary strip — step 2 only */}
      {step === 'payment' && orderPayment && (
        <div className={styles.pickerOrderSummary}>
          <OrderMosaic orderItems={orderItems} fallbackIcon="receipt" size={44} />
          <div className={styles.pickerOrderSummaryInfo}>
            <div className={styles.pickerOrderSummaryTitle}>{selectedOrder?.desc}</div>
            <div className={styles.pickerOrderSummaryMeta}>
              {formatMoney(currency, totalPaid)} paid
              {fullPrice > 0 && ` · ${formatMoney(currency, fullPrice)} total`}
              {balance > 0 && (
                <span style={{ color: '#ef4444', marginLeft: 4 }}>
                  · {formatMoney(currency, balance)} balance
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className={styles.pickerSearchWrap}>
        <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
        <input
          ref={searchRef}
          type="text"
          className={styles.pickerSearchInput}
          placeholder={
            step === 'order'
              ? 'Search orders…'
              : 'Search by amount, method, date…'
          }
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search.length > 0 && (
          <button className={styles.pickerSearchClear} onClick={() => setSearch('')}>
            <span className="mi" style={{ fontSize: '1rem' }}>close</span>
          </button>
        )}
      </div>

      {/* Count line */}
      <div className={styles.pickerCountLine}>
        {step === 'order'
          ? `${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'} with payments${search.trim() ? ` matching "${search}"` : ''}`
          : `${filteredInstallments.length} ${filteredInstallments.length === 1 ? 'payment' : 'payments'}${search.trim() ? ` matching "${search}"` : ''} — tap one to receipt`
        }
      </div>

      {/* ── STEP 1: Order list ── */}
      {step === 'order' && (
        <div className={styles.pickerList}>

          {ordersWithPayments.length === 0 && (
            <div className={styles.pickerEmpty}>
              <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>payments</span>
              <p>No payments recorded yet.</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>
                Go to the Payments tab to record a payment first.
              </p>
            </div>
          )}

          {ordersWithPayments.length > 0 && filteredOrders.length === 0 && (
            <div className={styles.pickerEmpty}>
              <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
              <p>No orders match your search</p>
            </div>
          )}

          {filteredOrders.map((order, index) => {
            const payment      = payments.find(p => String(p.orderId) === String(order.id))
            const installs     = payment?.installments || []
            const paid         = getTotalPaid(installs)
            const price        = parseFloat(order.price) || 0
            const bal          = price > 0 ? Math.max(0, price - paid) : 0
            const isFullyPaid  = price > 0 && paid >= price
            const installCount = installs.length
            const isLast       = index === filteredOrders.length - 1
            const garmentNames = (order.items || []).map(i => i.name).filter(Boolean).join(' · ')

            return (
              <div
                key={order.id}
                className={`${styles.pickerOrderCard} ${isLast ? styles.pickerOrderCard_last : ''}`}
                onClick={() => handlePickOrder(order)}
              >
                <OrderMosaic orderItems={order.items || []} fallbackIcon="receipt" size={56} />

                <div className={styles.pickerOrderInfo}>
                  {/* Row 1: title + total price */}
                  <div className={styles.pickerOrderTop}>
                    <span className={styles.pickerOrderTitle}>{order.desc || 'Untitled Order'}</span>
                    <span className={styles.pickerOrderPrice}>{formatMoney(currency, price)}</span>
                  </div>

                  {/* Row 2: garment names or item count */}
                  {garmentNames ? (
                    <div className={styles.pickerGarmentNames}>{garmentNames}</div>
                  ) : installCount > 0 ? (
                    <div className={styles.pickerGarmentNames}>
                      {installCount} {installCount === 1 ? 'payment' : 'payments'} recorded
                    </div>
                  ) : null}

                  {/* Row 3: paid + balance/fully paid badge */}
                  <div className={styles.pickerOrderBadges}>
                    <span className={styles.pickerPaidChip}>
                      {formatMoney(currency, paid)} paid
                    </span>
                    {isFullyPaid ? (
                      <span className={styles.pickerFullPaidBadge}>
                        <span className="mi" style={{ fontSize: '0.65rem' }}>check_circle</span>
                        Fully Paid
                      </span>
                    ) : (
                      <span className={styles.pickerBalanceBadge}>
                        {formatMoney(currency, bal)} balance
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.pickerChevron}>
                  <span className="mi" style={{ fontSize: '1.2rem', color: 'var(--text3)' }}>chevron_right</span>
                </div>
              </div>
            )
          })}

          <div style={{ height: 40 }} />
        </div>
      )}

      {/* ── STEP 2: Installment list ── */}
      {step === 'payment' && orderPayment && (
        <div className={styles.pickerList}>

          {filteredInstallments.length === 0 && (
            <div className={styles.pickerEmpty}>
              <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
              <p>No payments match your search</p>
            </div>
          )}

          {filteredInstallments.map((inst, index) => {
            const isReceiptedAlready = receiptedInstallmentIds.has(String(inst.id))
            const isGenerating       = generating === inst.id
            const isLast             = index === filteredInstallments.length - 1
            const paidBefore         = getTotalPaid(installments.slice(0, index))
            const paidAfter          = paidBefore + (parseFloat(inst.amount) || 0)
            const balAfter           = fullPrice > 0 ? Math.max(0, fullPrice - paidAfter) : null

            return (
              <div
                key={inst.id ?? index}
                className={`
                  ${styles.pickerInstallCard}
                  ${isReceiptedAlready ? styles.pickerInstallCard_receipted : ''}
                  ${isGenerating       ? styles.pickerInstallCard_generating : ''}
                  ${isLast             ? styles.pickerInstallCard_last : ''}
                `}
                onClick={() => !isGenerating && onSelectPayment(orderPayment, inst)}
              >
                {/* Left: payment number circle */}
                <div className={styles.pickerInstallNumber}>
                  <span>{index + 1}</span>
                </div>

                {/* Centre: amount + date + method + balance */}
                <div className={styles.pickerInstallInfo}>
                  <div className={styles.pickerInstallTop}>
                    <span className={styles.pickerInstallAmount}>
                      {formatMoney(currency, inst.amount)}
                    </span>

                    {/* Right-side tag — generating / receipted / generate */}
                    {isGenerating ? (
                      <div className={styles.pickerCreatingTag}>
                        <div className={styles.pickerSpinner} />
                        <span>Generating</span>
                      </div>
                    ) : isReceiptedAlready ? (
                      <div className={styles.pickerReceiptedTag}>
                        <span className="mi" style={{ fontSize: '0.75rem' }}>receipt_long</span>
                        <span>Receipted</span>
                      </div>
                    ) : (
                      <div className={styles.pickerGenerateTag}>
                        <span className="mi" style={{ fontSize: '0.75rem' }}>add_circle</span>
                        <span>Generate</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.pickerInstallMeta}>
                    {inst.date && (
                      <span className={styles.pickerMetaDate}>
                        {inst.date}
                      </span>
                    )}
                    {inst.method && (
                      <span className={styles.pickerMethodPill}>
                        {capitalise(inst.method)}
                      </span>
                    )}
                  </div>

                  {balAfter !== null && (
                    <div className={styles.pickerInstallBalance}>
                      Balance after:{' '}
                      <span style={{ color: balAfter > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                        {balAfter > 0 ? formatMoney(currency, balAfter) : 'Fully Paid'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div style={{ height: 40 }} />
        </div>
      )}

      {/* Edge case: no payment found for selected order */}
      {step === 'payment' && !orderPayment && (
        <div className={styles.pickerEmpty} style={{ marginTop: 40 }}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>error_outline</span>
          <p>No payment record found for this order.</p>
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// RECEIPT CARD — one row in the list
// ─────────────────────────────────────────────────────────────

function ReceiptCard({ receipt, currency, onTap, isLast, orderItems }) {
  const { thisPayment, isPaidInFull, label, badgeStyle } = getPaymentStatus(receipt)

  return (
    <div
      className={`${styles.receiptRow} ${isLast ? styles.receiptRowLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic
        orderItems={orderItems}
        fallbackIcon="receipt"
        fallbackColor={isPaidInFull ? '#22c55e' : '#fb923c'}
        size={68}
      />

      <div className={styles.receiptRowInfo}>
        <div className={styles.receiptRowTitle}>{receipt.orderDesc || 'Payment'}</div>
        <div className={styles.receiptRowDate}>Generated {receipt.date}</div>
      </div>

      <div className={styles.receiptRowRight}>
        <span className={styles.receiptStatusBadge} style={badgeStyle}>
          {label}
        </span>
        <div className={styles.receiptRowAmount}>
          {formatMoney(currency, thisPayment)}
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt</span>
      <p className={styles.emptyStateTitle}>No receipts yet</p>
      <p className={styles.emptyStateSubtitle}>
        Tap <strong>+</strong> to generate a receipt from a recorded payment,
        or open a payment on the Payments tab.
      </p>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// RECEIPT TAB — main export
// ─────────────────────────────────────────────────────────────

export default function ReceiptTab({
  receipts         = [],
  orders           = [],
  payments         = [],
  customer,
  onDelete,
  onGenerateReceipt,
  showToast,
}) {
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [pickerOpen,     setPickerOpen]     = useState(false)
  // generating holds the installment id currently being processed, or null
  const [generating,     setGenerating]     = useState(null)

  const currency      = getCurrency()
  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupReceiptsByDate(receipts)

  // Listen for FAB click from CustomerDetail
  useEffect(() => {
    const openPicker = () => setPickerOpen(true)
    document.addEventListener('openReceiptModal', openPicker)
    return () => document.removeEventListener('openReceiptModal', openPicker)
  }, [])

  async function handleSelectPayment(payment, installment) {
    // Show inline spinner on this specific installment card, keep modal open
    setGenerating(installment.id)
    try {
      await onGenerateReceipt(payment, installment)
      // Brief pause so user sees the generating state resolve before close
      setTimeout(() => {
        setPickerOpen(false)
        setGenerating(null)
      }, 400)
    } catch {
      setGenerating(null)
      showToast('Failed to generate receipt. Try again.')
    }
  }

  function handleConfirmDelete() {
    onDelete(deleteTarget)
    showToast('Receipt deleted')
    setDeleteTarget(null)
    if (viewingReceipt?.id === deleteTarget) setViewingReceipt(null)
  }

  return (
    <>
      {/* Empty state */}
      {receipts.length === 0 && (
        <EmptyState />
      )}

      {/* Receipt list grouped by date */}
      {receipts.length > 0 && Object.entries(groupedByDate).map(([date, dateReceipts]) => (
        <div key={date} className={styles.dateGroup}>
          <div className={styles.dateGroupLabel}>{date}</div>
          <div className={styles.dateGroupDivider} />

          {dateReceipts.map((receipt, index) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              currency={currency}
              isLast={index === dateReceipts.length - 1}
              onTap={() => setViewingReceipt(receipt)}
              orderItems={orderItemsMap[receipt.orderId] ?? receipt.orderItems ?? []}
            />
          ))}
        </div>
      ))}

      {/* Two-step picker modal — full screen */}
      <ReceiptPickerModal
        isOpen={pickerOpen}
        onClose={() => {
          if (generating) return  // prevent closing mid-generation
          setPickerOpen(false)
        }}
        orders={orders}
        payments={payments}
        receipts={receipts}
        onSelectPayment={handleSelectPayment}
        generating={generating}
      />

      {/* Receipt viewer */}
      {viewingReceipt && (
        <ReceiptViewer
          receipt={viewingReceipt}
          customer={customer}
          onClose={() => setViewingReceipt(null)}
          onDelete={(id) => setDeleteTarget(id)}
          showToast={showToast}
        />
      )}

      {/* Delete confirm */}
      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this receipt?"
        message="This can't be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}