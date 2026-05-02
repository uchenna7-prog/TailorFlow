// src/pages/CustomerDetail/tabs/PaymentsTab/PaymentsTab.jsx

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import {
  subscribeToPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from '../../../../services/paymentService'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
import styles from './PaymentsTab.module.css'


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PAYMENT_STATUSES = [
  { value: 'not_paid', label: 'Not Paid',     color: '#dc2626', background: 'rgba(239,68,68,0.12)',  borderColor: 'rgba(239,68,68,0.3)'  },
  { value: 'part',     label: 'Part Payment', color: '#c2410c', background: 'rgba(251,146,60,0.12)', borderColor: 'rgba(251,146,60,0.3)' },
  { value: 'paid',     label: 'Paid',         color: '#15803d', background: 'rgba(34,197,94,0.12)',  borderColor: 'rgba(34,197,94,0.3)'  },
]


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === '') return '—'
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Returns the status object (color, label, etc.) for a given status value
function getStatusMeta(value) {
  return PAYMENT_STATUSES.find(s => s.value === value) ?? PAYMENT_STATUSES[0]
}

// Builds a map of orderId -> order items, for looking up images per payment
function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of (orders || [])) {
    if (order.id && order.items?.length > 0) {
      map[order.id] = order.items
    }
  }
  return map
}

// Groups an array of payments by their date field
// Returns: { "Jan 1 2025": [payment, payment], ... }
function groupPaymentsByDate(payments) {
  return payments.reduce((groups, payment) => {
    const date = payment.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(payment)
    return groups
  }, {})
}

// Calculates total amount paid from an array of installments
function getTotalPaid(installments) {
  return (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
}

// Calculates the fill percentage for the progress bar (0–100)
function getProgressPercent(totalPaid, fullPrice, status) {
  if (fullPrice <= 0) return 0
  const raw = (totalPaid / fullPrice) * 100
  return status === 'part' ? Math.min(99, raw) : Math.min(100, raw)
}

// Determines the payment status based on amount entered vs order price
function resolvePaymentStatus(enteredAmount, orderPrice, selectedPaymentType) {
  const entered = parseFloat(enteredAmount) || 0
  const full    = parseFloat(orderPrice) || 0
  if (full > 0) {
    return entered >= full ? 'paid' : 'part'
  }
  return selectedPaymentType === 'full' ? 'paid' : 'part'
}

// Capitalises the first letter of a string e.g. "cash" -> "Cash"
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
// Shows 1, 2, or 3+ item images in a tiled thumbnail box
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ orderItems, fallbackIcon, fallbackColor }) {
  const images     = (orderItems || []).map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = (orderItems || []).length

  // No images — show a fallback icon
  if (images.length === 0) {
    return (
      <div className={styles.mosaicOuterBox}>
        <div className={styles.mosaicInnerBox}>
          <span className="mi" style={{ fontSize: '1.5rem', color: fallbackColor || 'var(--text3)' }}>
            {fallbackIcon || 'payments'}
          </span>
        </div>
      </div>
    )
  }

  // Single image — full bleed
  if (totalItems === 1) {
    return (
      <div className={styles.mosaicOuterBox}>
        <div className={styles.mosaicInnerBox}>
          <img src={images[0]} alt="" className={styles.mosaicFullImage} />
        </div>
      </div>
    )
  }

  // Two items — left/right split
  if (totalItems === 2) {
    return (
      <div className={styles.mosaicOuterBox}>
        <div className={`${styles.mosaicInnerBox} ${styles.mosaicTiled}`}>
          <div className={styles.mosaicTileLeft}>
            <img src={images[0]} alt="" className={styles.mosaicTileImage} />
          </div>
          <div className={styles.mosaicDividerVertical} />
          <div className={styles.mosaicTileRight}>
            <div className={styles.mosaicTileCell}>
              {images[1]
                ? <img src={images[1]} alt="" className={styles.mosaicTileImage} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Three or more — left + two stacked on right
  const extraCount = totalItems > 3 ? totalItems - 3 : 0

  return (
    <div className={styles.mosaicOuterBox}>
      <div className={`${styles.mosaicInnerBox} ${styles.mosaicTiled}`}>

        <div className={styles.mosaicTileLeft}>
          {images[0]
            ? <img src={images[0]} alt="" className={styles.mosaicTileImage} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>

        <div className={styles.mosaicDividerVertical} />

        <div className={styles.mosaicTileRight}>

          <div className={styles.mosaicTileCell}>
            {images[1]
              ? <img src={images[1]} alt="" className={styles.mosaicTileImage} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>

          <div className={styles.mosaicDividerHorizontal} />

          <div className={`${styles.mosaicTileCell} ${extraCount > 0 ? styles.mosaicTileCellWithOverlay : ''}`}>
            {images[2]
              ? <img src={images[2]} alt="" className={styles.mosaicTileImage} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && (
              <div className={styles.mosaicExtraOverlay}>+{extraCount}</div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ADD PAYMENT MODAL — create a new payment for an order
// ─────────────────────────────────────────────────────────────

function AddPaymentModal({ isOpen, onClose, orders, payments, onSave }) {
  const [selectedOrder,  setSelectedOrder]  = useState(null)
  const [orderDropOpen,  setOrderDropOpen]  = useState(false)
  const [paymentType,    setPaymentType]    = useState('full')
  const [amount,         setAmount]         = useState('')
  const [method,         setMethod]         = useState('cash')
  const [notes,          setNotes]          = useState('')

  function resetForm() {
    setSelectedOrder(null)
    setOrderDropOpen(false)
    setPaymentType('full')
    setAmount('')
    setMethod('cash')
    setNotes('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  // Check if a payment already exists for the selected order
  const existingPayment = selectedOrder
    ? payments.find(p => String(p.orderId) === String(selectedOrder.id))
    : null

  const existingIsFullyPaid = existingPayment
    ? (existingPayment.installments || []).length === 1 && existingPayment.status === 'paid'
    : false

  function handleAmountChange(value) {
    setAmount(value)
    // Auto-detect part vs full payment based on the order price
    if (selectedOrder) {
      const fullPrice = parseFloat(selectedOrder.price) || 0
      const entered   = parseFloat(value) || 0
      if (fullPrice > 0) {
        setPaymentType(entered > 0 && entered < fullPrice ? 'part' : 'full')
      }
    }
  }

  function handleSave() {
    if (!selectedOrder || !amount || existingPayment) return

    const finalStatus = resolvePaymentStatus(amount, selectedOrder.price, paymentType)

    onSave({
      orderId:      selectedOrder.id,
      orderDesc:    selectedOrder.desc,
      orderPrice:   selectedOrder.price ?? null,
      orderItems:   selectedOrder.items  ?? [],
      status:       finalStatus,
      notes:        notes.trim(),
      installments: [{ amount: parseFloat(amount), method, date: getTodayLabel(), id: Date.now() }],
      date:         getTodayLabel(),
    })
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.fullScreenModal}>
      <Header
        type="back"
        title="New Payment"
        onBackClick={handleClose}
        customActions={[
          { label: 'Save', onClick: handleSave, disabled: !selectedOrder || !amount || !!existingPayment }
        ]}
      />

      <div className={styles.modalBody}>

        {/* Order selector */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Related Order *</label>
          {selectedOrder ? (
            <div className={styles.selectedOrderChip}>
              <span className="mi" style={{ fontSize: '1rem', color: 'var(--accent)' }}>content_cut</span>
              <div style={{ flex: 1 }}>
                <div className={styles.selectedOrderName}>{selectedOrder.desc}</div>
                <div className={styles.selectedOrderMeta}>{formatMoney(selectedOrder.price)} · {selectedOrder.status}</div>
              </div>
              <button className={styles.selectedOrderRemoveBtn} onClick={() => setSelectedOrder(null)}>
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
          ) : (
            <div className={styles.orderDropdownWrap}>
              <button className={styles.orderDropdownBtn} onClick={() => setOrderDropOpen(p => !p)}>
                <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>assignment</span>
                <span>{orders.length === 0 ? 'No orders available' : 'Select an order…'}</span>
                <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 'auto' }}>expand_more</span>
              </button>
              {orderDropOpen && orders.length > 0 && (
                <div className={styles.orderDropdownList}>
                  {orders.map(order => (
                    <button
                      key={order.id}
                      className={styles.orderDropdownItem}
                      onClick={() => { setSelectedOrder(order); setOrderDropOpen(false) }}
                    >
                      <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>content_cut</span>
                      <div>
                        <div className={styles.orderDropdownItemName}>{order.desc}</div>
                        <div className={styles.orderDropdownItemMeta}>{formatMoney(order.price)} · Due {order.due || '—'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* If this order already has a payment, show a notice instead of the form */}
        {existingPayment ? (
          <div className={styles.duplicatePaymentNotice}>
            <div className={styles.duplicatePaymentIconCircle}>
              <span className="mi" style={{ fontSize: '1.6rem', color: existingIsFullyPaid ? '#15803d' : '#c2410c' }}>
                {existingIsFullyPaid ? 'check_circle' : 'payments'}
              </span>
            </div>
            <div className={styles.duplicatePaymentTitle}>
              {existingIsFullyPaid ? 'This order is fully paid' : 'Payment already in progress'}
            </div>
            <p className={styles.duplicatePaymentBody}>
              {existingIsFullyPaid
                ? `A full payment has already been recorded for "${selectedOrder.desc}". Tap the payment card on the Payments tab to view the details.`
                : `A payment card already exists for "${selectedOrder.desc}". To record the next instalment, tap that card and use the "Record Another Payment" option.`}
            </p>
            <button className={styles.duplicatePaymentDismissBtn} onClick={handleClose}>
              Got it
            </button>
          </div>
        ) : (
          <>
            {/* Payment type selector */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Payment Type</label>
              <div className={styles.chipRow}>
                <button
                  className={`${styles.typeChip} ${paymentType === 'full' ? styles.typeChipActive : ''}`}
                  style={paymentType === 'full'
                    ? { borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.12)' }
                    : {}}
                  onClick={() => setPaymentType('full')}
                >
                  Full Payment
                </button>
                <button
                  className={`${styles.typeChip} ${paymentType === 'part' ? styles.typeChipActive : ''}`}
                  style={paymentType === 'part'
                    ? { borderColor: '#fb923c', color: '#fb923c', background: 'rgba(251,146,60,0.12)' }
                    : {}}
                  onClick={() => setPaymentType('part')}
                >
                  Part Payment
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {paymentType === 'part' ? 'Initial Amount Paid (₦)' : 'Amount (₦)'}
              </label>
              <input
                type="number"
                className={styles.textInput}
                placeholder={selectedOrder ? `of ${formatMoney(selectedOrder.price)}` : '0.00'}
                inputMode="decimal"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
              />
            </div>

            {/* Payment method selector */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Payment Method</label>
              <div className={styles.methodChipRow}>
                {['cash', 'transfer', 'card', 'other'].map(m => (
                  <button
                    key={m}
                    className={`${styles.methodChip} ${method === m ? styles.methodChipActive : ''}`}
                    onClick={() => setMethod(m)}
                  >
                    {capitalise(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes input */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Notes <span className={styles.fieldLabelOptional}>(optional)</span></label>
              <textarea
                className={styles.textareaInput}
                placeholder="Any extra details…"
                value={notes}
                rows={2}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </>
        )}

      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ADD INSTALLMENT MODAL — record the next payment on a part-paid order
// ─────────────────────────────────────────────────────────────

function AddInstallmentModal({ payment, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  const totalPaid = getTotalPaid(payment.installments)
  const remaining = (parseFloat(payment.orderPrice) || 0) - totalPaid

  function handleSave() {
    if (!amount || parseFloat(amount) <= 0) return
    onSave(parseFloat(amount), method)
    onClose()
  }

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.bottomSheet}>
        <div className={styles.bottomSheetHandle} />
        <div className={styles.bottomSheetHeader}>
          <div className={styles.bottomSheetTitle}>Record Payment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>
        <div className={styles.bottomSheetBody}>
          {remaining > 0 && (
            <div className={styles.remainingBalanceBadge}>
              Balance remaining: <strong>{formatMoney(remaining)}</strong>
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Amount Received (₦)</label>
            <input
              type="number"
              className={styles.textInput}
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment Method</label>
            <div className={styles.methodChipRow}>
              {['cash', 'transfer', 'card', 'other'].map(m => (
                <button
                  key={m}
                  className={`${styles.methodChip} ${method === m ? styles.methodChipActive : ''}`}
                  onClick={() => setMethod(m)}
                >
                  {capitalise(m)}
                </button>
              ))}
            </div>
          </div>
          <button
            className={styles.confirmActionBtn}
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// PAYMENT DETAIL MODAL — full view of a single payment
// ─────────────────────────────────────────────────────────────

function PaymentDetail({ payment, onClose, onDelete, onStatusChange, onAddInstallment, onGenerateReceipt }) {
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)

  const installments     = payment.installments || []
  const fullPrice        = parseFloat(payment.orderPrice) || 0
  const totalPaid        = getTotalPaid(installments)
  const remaining        = fullPrice > 0 ? Math.max(0, fullPrice - totalPaid) : 0
  const isPaid           = payment.status === 'paid'
  const isNowFullyPaid   = fullPrice > 0 && totalPaid >= fullPrice
  const hasInstallments  = installments.length > 0
  const progressPercent  = getProgressPercent(totalPaid, fullPrice, payment.status)

  return (
    <div className={styles.fullScreenModal}>
      <Header
        type="back"
        title="Payment Details"
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.modalBody}>

        {/* Basic payment info */}
        <div className={styles.detailInfoCard}>
          <div className={styles.detailInfoRow}>
            <span className={styles.detailInfoLabel}>Order</span>
            <span className={styles.detailInfoValue}>{payment.orderDesc || '—'}</span>
          </div>
          {fullPrice > 0 && (
            <div className={styles.detailInfoRow}>
              <span className={styles.detailInfoLabel}>Order Value</span>
              <span className={styles.detailInfoValue}>{formatMoney(fullPrice)}</span>
            </div>
          )}
          <div className={styles.detailInfoRow}>
            <span className={styles.detailInfoLabel}>Date Created</span>
            <span className={styles.detailInfoValue}>{payment.date}</span>
          </div>
          {payment.notes && (
            <div className={styles.detailInfoRow}>
              <span className={styles.detailInfoLabel}>Notes</span>
              <span className={styles.detailInfoValue}>{payment.notes}</span>
            </div>
          )}
        </div>

        {/* Payment breakdown — shown when we have a known order price AND installments */}
        {fullPrice > 0 && hasInstallments && (
          <div className={styles.breakdownCard}>
            <label className={styles.fieldLabel} style={{ marginBottom: 12, display: 'block' }}>Payment Breakdown</label>

            <div className={styles.breakdownRow}>
              <span>Order Value</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatMoney(fullPrice)}</span>
            </div>

            {installments.map((inst, idx) => {
              const paidBefore  = getTotalPaid(installments.slice(0, idx))
              const paidAfter   = paidBefore + (parseFloat(inst.amount) || 0)
              const balanceAfter = Math.max(0, fullPrice - paidAfter)
              const methodLabel  = inst.method ? capitalise(inst.method) : ''

              return (
                <div key={inst.id ?? idx} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Payment {idx + 1}{installments.length > 1 ? ` of ${installments.length}` : ''}{methodLabel ? ` · ${methodLabel}` : ''}{inst.date ? ` · ${inst.date}` : ''}
                    </span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 800,
                      background: 'rgba(251,146,60,0.14)', color: '#fb923c',
                      border: '1px solid rgba(251,146,60,0.3)',
                      borderRadius: 20, padding: '1px 7px',
                    }}>
                      {idx + 1}/{installments.length}
                    </span>
                  </div>

                  {idx > 0 && (
                    <div className={styles.breakdownRow} style={{ marginBottom: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>Balance Before</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                        {formatMoney(paidBefore > 0 ? fullPrice - paidBefore : fullPrice)}
                      </span>
                    </div>
                  )}

                  <div className={styles.breakdownRow} style={{ marginBottom: 4 }}>
                    <span>Amount Paid</span>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>{formatMoney(inst.amount)}</span>
                  </div>

                  <div className={styles.breakdownRow} style={{ marginBottom: 0 }}>
                    <span>Balance After</span>
                    <span style={{ color: balanceAfter > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                      {balanceAfter > 0 ? formatMoney(balanceAfter) : 'Fully Paid ✓'}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Progress bar */}
            <div style={{ marginTop: 16 }}>
              <div className={styles.paymentProgressTrack}>
                <div className={styles.paymentProgressFill} style={{ width: `${progressPercent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>{formatMoney(totalPaid)} paid</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>{formatMoney(fullPrice)} total</span>
              </div>
            </div>
          </div>
        )}

        {/* Simple installment list — shown when no known order price */}
        {(!fullPrice || !hasInstallments) && hasInstallments && (
          <div className={styles.breakdownCard}>
            <div className={styles.installmentList}>
              {installments.map((inst, idx) => (
                <div key={inst.id ?? idx} className={styles.installmentRow}>
                  <div className={styles.installmentIconOuter}>
                    <div className={styles.installmentIconInner}>
                      <span className="mi" style={{ fontSize: '1rem', color: '#22c55e' }}>payments</span>
                    </div>
                  </div>
                  <div className={styles.installmentRowInfo}>
                    <div className={styles.installmentAmount}>{formatMoney(inst.amount)}</div>
                    <div className={styles.installmentDate}>{inst.date}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={styles.installmentReceivedBadge}>Received</span>
                    {inst.method && (
                      <span className={styles.installmentMethodBadge} style={{ textTransform: 'capitalize' }}>
                        {inst.method}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status selector */}
        <div className={styles.fieldGroup} style={{ marginTop: 18 }}>
          <label className={styles.fieldLabel}>Payment Status</label>
          {hasInstallments && (
            <div style={{
              fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px',
            }}>
              {isNowFullyPaid
                ? '✓ All payments received — status upgraded to Paid.'
                : 'Part payments recorded. Only Part Payment is available.'}
            </div>
          )}
          <div className={styles.chipRow}>
            {PAYMENT_STATUSES.map(s => {
              const isLocked = hasInstallments && (
                isNowFullyPaid ? s.value !== 'paid' : s.value !== 'part'
              )
              const isActive = isNowFullyPaid ? s.value === 'paid' : payment.status === s.value
              return (
                <button
                  key={s.value}
                  className={`${styles.typeChip} ${isActive ? styles.typeChipActive : ''}`}
                  style={{
                    ...(isActive ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}),
                    ...(isLocked ? { opacity: 0.3, cursor: 'not-allowed' } : {}),
                  }}
                  disabled={isLocked}
                  onClick={() => !isLocked && onStatusChange(payment.id, s.value)}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Record another payment button */}
        {!isPaid && (
          <button className={styles.addInstallmentBtn} onClick={() => setShowInstallmentModal(true)}>
            <span className="mi" style={{ fontSize: '1.1rem' }}>add_circle_outline</span>
            Record Another Payment
          </button>
        )}

        {/* Generate receipt button */}
        <button className={styles.generateReceiptBtn} onClick={() => onGenerateReceipt(payment)}>
          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: 4 }}>receipt</span>
          Generate Receipt
        </button>

      </div>

      {showInstallmentModal && (
        <AddInstallmentModal
          payment={payment}
          onClose={() => setShowInstallmentModal(false)}
          onSave={(amt, meth) => onAddInstallment(payment.id, amt, meth)}
        />
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// PAYMENTS TAB — main export
// ─────────────────────────────────────────────────────────────

export default function PaymentsTab({ customerId, orders, showToast, onGenerateReceipt, onInvoicePaid, onPaymentsChange }) {
  const { user } = useAuth()

  const [payments,       setPayments]       = useState([])
  const [modalOpen,      setModalOpen]      = useState(false)
  const [viewingPayment, setViewingPayment] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  // Subscribe to live payment updates from the database
  useEffect(() => {
    if (!user || !customerId) return
    const unsubscribe = subscribeToPayments(
      user.uid,
      customerId,
      (data) => {
      setPayments(data)
      onPaymentsChange?.(data)   // ← add this line
      setViewingPayment(prev => {
        if (!prev) return null
        return data.find(p => p.id === prev.id) ?? null
  })
    },
      (err) => console.error('[PaymentsTab]', err)
    )
    return unsubscribe
  }, [user, customerId])

  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupPaymentsByDate(payments)

  async function handleSavePayment(paymentData) {
    if (!user) return
    try {
      await createPayment(user.uid, customerId, paymentData)
      showToast('Payment recorded ✓')
      if (paymentData.status === 'paid') {
        onInvoicePaid?.(paymentData.orderId, 'paid')
      } else if (paymentData.status === 'part') {
        onInvoicePaid?.(paymentData.orderId, 'part_paid')
      }
    } catch {
      showToast('Failed to save payment.')
    }
  }

  async function handleStatusChange(paymentId, newStatus) {
    if (!user) return
    try {
      await updatePayment(user.uid, customerId, paymentId, { status: newStatus })
    } catch {
      showToast('Failed to update status.')
    }
  }

  async function handleAddInstallment(paymentId, amount, method) {
    if (!user) return
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const newInstallment      = { amount, method, date: getTodayLabel(), id: Date.now() }
    const updatedInstallments = [...(payment.installments || []), newInstallment]
    const totalPaid           = getTotalPaid(updatedInstallments)
    const fullPrice           = parseFloat(payment.orderPrice) || 0
    const newStatus           = fullPrice > 0 && totalPaid >= fullPrice ? 'paid' : payment.status

    try {
      await updatePayment(user.uid, customerId, paymentId, {
        installments: updatedInstallments,
        status: newStatus,
      })
      if (newStatus === 'paid') {
        showToast('Payment complete! Marked as Paid ✓')
        onInvoicePaid?.(payment.orderId, 'paid')
      } else {
        showToast('Payment recorded ✓')
        onInvoicePaid?.(payment.orderId, 'part_paid')
      }
    } catch {
      showToast('Failed to record payment.')
    }
  }

  function handleGenerateReceipt(payment) {
    setViewingPayment(null)
    onGenerateReceipt(payment)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !user) return
    try {
      await deletePayment(user.uid, customerId, deleteTarget.id)
      showToast('Payment deleted')
    } catch {
      showToast('Failed to delete.')
    }
    setDeleteTarget(null)
    setViewingPayment(null)
  }

  return (
    <>
      {/* Empty state */}
      {payments.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.3 }}>payments</span>
          <p>No payments recorded yet.</p>
          <span className={styles.emptyStateHint}>Tap + to record a payment</span>
        </div>
      )}

      {/* Payment list grouped by date */}
      {Object.entries(groupedByDate).map(([date, datePayments]) => (
        <div key={date} className={styles.dateGroup}>
          <div className={styles.dateGroupLabel}>{date}</div>
          <div className={styles.dateGroupDivider} />

          {datePayments.map((payment, index) => {
            const statusMeta    = getStatusMeta(payment.status)
            const isLast        = index === datePayments.length - 1
            const installments  = payment.installments || []
            const totalPaid     = getTotalPaid(installments)
            const fullPrice     = parseFloat(payment.orderPrice) || 0
            const installCount  = installments.length
            const progressPct   = getProgressPercent(totalPaid, fullPrice, payment.status)
            const orderItems    = orderItemsMap[payment.orderId] ?? []

            return (
              <div
                key={payment.id}
                className={`${styles.paymentRow} ${isLast ? styles.paymentRowLast : ''}`}
                onClick={() => setViewingPayment(payment)}
              >
                {/* Left: mosaic thumbnail */}
                <OrderMosaic
                  orderItems={orderItems}
                  fallbackIcon="payments"
                  fallbackColor={statusMeta.color}
                />

                {/* Centre: order name + status badge + instalment count */}
                <div className={styles.paymentRowInfo}>
                  <div className={styles.paymentRowTitle}>{payment.orderDesc || 'Payment'}</div>
                  <div className={styles.paymentRowMeta}>
                    <span
                      className={styles.paymentStatusBadge}
                      style={{
                        color:       statusMeta.color,
                        background:  statusMeta.background,
                        borderColor: statusMeta.borderColor,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                    {installCount > 1 && (
                      <span className={styles.installmentCountBadge}>
                        {installCount} payments
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: amount + sub-amount + mini progress bar */}
                <div className={styles.paymentRowRight}>
                  <div className={styles.paymentRowAmount}>
                    {fullPrice > 0 ? formatMoney(totalPaid) : formatMoney(installments[0]?.amount)}
                  </div>
                  {fullPrice > 0 && totalPaid < fullPrice && (
                    <div className={styles.paymentRowSubAmount}>of {formatMoney(fullPrice)}</div>
                  )}
                  {fullPrice > 0 && (
                    <div className={styles.miniProgressTrack}>
                      <div
                        className={styles.miniProgressFill}
                        style={{ width: `${progressPct}%`, background: statusMeta.color }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Add payment modal */}
      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={orders}
        payments={payments}
        onSave={handleSavePayment}
      />

      {/* Payment detail modal */}
      {viewingPayment && (
        <PaymentDetail
          payment={viewingPayment}
          onClose={() => setViewingPayment(null)}
          onDelete={() => setDeleteTarget(viewingPayment)}
          onStatusChange={handleStatusChange}
          onAddInstallment={handleAddInstallment}
          onGenerateReceipt={handleGenerateReceipt}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete Payment?"
        message="This can't be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Hidden trigger element used by PaymentsTab.openModal() */}
      <div
        style={{ display: 'none' }}
        id="__payment_modal_trigger__"
        ref={() => {
          const handler = () => setModalOpen(true)
          document.addEventListener('openPaymentModal', handler)
          return () => document.removeEventListener('openPaymentModal', handler)
        }}
      />
    </>
  )
}

PaymentsTab.openModal = () => {
  document.getElementById('__payment_modal_trigger__')?.dispatchEvent(new Event('open'))
}