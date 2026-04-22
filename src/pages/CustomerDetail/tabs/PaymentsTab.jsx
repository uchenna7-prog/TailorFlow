// src/pages/CustomerDetail/tabs/PaymentsTab.jsx

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  subscribeToPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from '../../../services/paymentService'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../components/Header/Header'
import styles from './PaymentsTab.module.css'

// ── Helpers ───────────────────────────────────────────────────

function fmt(amount) {
  if (amount === null || amount === undefined || amount === '') return '—'
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

function today() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const PAY_STATUS = [
  { value: 'not_paid', label: 'Not Paid',     color: '#dc2626', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  { value: 'part',     label: 'Part Payment', color: '#c2410c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  { value: 'paid',     label: 'Paid',         color: '#15803d', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
]

function statusMeta(value) {
  return PAY_STATUS.find(s => s.value === value) ?? PAY_STATUS[0]
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
      <div className={styles.payListOuter}>
        <div className={styles.payListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: fallbackColor || 'var(--text3)' }}>
            {fallbackIcon || 'payments'}
          </span>
        </div>
      </div>
    )
  }

  if (total === 1) {
    return (
      <div className={styles.payListOuter}>
        <div className={styles.payListInner}>
          <img src={covers[0]} alt="" className={styles.orderImg} />
        </div>
      </div>
    )
  }

  if (total === 2) {
    return (
      <div className={styles.payListOuter}>
        <div className={`${styles.payListInner} ${styles.mosaicInner}`}>
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
    <div className={styles.payListOuter}>
      <div className={`${styles.payListInner} ${styles.mosaicInner}`}>
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

// ── ADD PAYMENT MODAL ─────────────────────────────────────────

function AddPaymentModal({ isOpen, onClose, orders, payments, onSave }) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDropOpen, setOrderDropOpen] = useState(false)
  const [paymentType,   setPaymentType]   = useState('full')
  const [amount,        setAmount]        = useState('')
  const [method,        setMethod]        = useState('cash')
  const [notes,         setNotes]         = useState('')

  const reset = () => {
    setSelectedOrder(null); setOrderDropOpen(false)
    setPaymentType('full'); setAmount(''); setMethod('cash'); setNotes('')
  }

  const handleClose = () => { reset(); onClose() }

  const existingPayment = selectedOrder
    ? payments.find(p => String(p.orderId) === String(selectedOrder.id))
    : null

  const existingIsFullPayment = existingPayment
    ? (existingPayment.installments || []).length === 1 && existingPayment.status === 'paid'
    : false

  const handleSave = () => {
    if (!selectedOrder || !amount || existingPayment) return

    const installment = [{
      amount: parseFloat(amount),
      method,
      date:   today(),
      id:     Date.now(),
    }]

    const entered   = parseFloat(amount) || 0
    const fullPrice = parseFloat(selectedOrder.price) || 0

    let finalStatus
    if (fullPrice > 0) {
      finalStatus = entered >= fullPrice ? 'paid' : 'part'
    } else {
      finalStatus = paymentType === 'full' ? 'paid' : 'part'
    }

    onSave({
      orderId:      selectedOrder.id,
      orderDesc:    selectedOrder.desc,
      orderPrice:   selectedOrder.price ?? null,
      orderItems:   selectedOrder.items  ?? [],
      status:       finalStatus,
      notes:        notes.trim(),
      installments: installment,
      date:         today(),
    })
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <Header
        type="back"
        title="New Payment"
        onBackClick={handleClose}
        customActions={[
          { label: 'Save', onClick: handleSave, disabled: !selectedOrder || !amount || !!existingPayment }
        ]}
      />

      <div className={styles.modalBody}>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Related Order *</label>
          {selectedOrder ? (
            <div className={styles.selectedChip}>
              <span className="mi" style={{ fontSize: '1rem', color: 'var(--accent)' }}>content_cut</span>
              <div style={{ flex: 1 }}>
                <div className={styles.chipName}>{selectedOrder.desc}</div>
                <div className={styles.chipSub}>{fmt(selectedOrder.price)} · {selectedOrder.status}</div>
              </div>
              <button className={styles.chipRemove} onClick={() => setSelectedOrder(null)}>
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
          ) : (
            <div className={styles.orderDropWrap}>
              <button className={styles.orderDropBtn} onClick={() => setOrderDropOpen(p => !p)}>
                <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>assignment</span>
                <span>{orders.length === 0 ? 'No orders available' : 'Select an order…'}</span>
                <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 'auto' }}>expand_more</span>
              </button>
              {orderDropOpen && orders.length > 0 && (
                <div className={styles.dropdown}>
                  {orders.map(o => (
                    <button key={o.id} className={styles.dropItem} onClick={() => { setSelectedOrder(o); setOrderDropOpen(false) }}>
                      <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>content_cut</span>
                      <div>
                        <div className={styles.dropName}>{o.desc}</div>
                        <div className={styles.dropMeta}>{fmt(o.price)} · Due {o.due || '—'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {existingPayment ? (
          <div className={styles.duplicateNotice}>
            <div className={styles.duplicateIconWrap}>
              <span className="mi" style={{ fontSize: '1.6rem', color: existingIsFullPayment ? '#15803d' : '#c2410c' }}>
                {existingIsFullPayment ? 'check_circle' : 'payments'}
              </span>
            </div>
            <div className={styles.duplicateTitle}>
              {existingIsFullPayment
                ? 'This order is fully paid'
                : 'Payment already in progress'}
            </div>
            <p className={styles.duplicateBody}>
              {existingIsFullPayment
                ? `A full payment has already been recorded for "${selectedOrder.desc}". Tap the payment card on the Payments tab to view the details.`
                : `A payment card already exists for "${selectedOrder.desc}". To record the next instalment, tap that card and use the "Record Another Payment" option.`}
            </p>
            <button className={styles.duplicateDismiss} onClick={handleClose}>
              Got it
            </button>
          </div>
        ) : (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Payment Type</label>
              <div className={styles.statusRow}>
                <button
                  className={`${styles.statusChip} ${paymentType === 'full' ? styles.statusChipActive : ''}`}
                  style={paymentType === 'full'
                    ? { borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.12)' }
                    : {}}
                  onClick={() => setPaymentType('full')}
                >
                  Full Payment
                </button>
                <button
                  className={`${styles.statusChip} ${paymentType === 'part' ? styles.statusChipActive : ''}`}
                  style={paymentType === 'part'
                    ? { borderColor: '#fb923c', color: '#fb923c', background: 'rgba(251,146,60,0.12)' }
                    : {}}
                  onClick={() => setPaymentType('part')}
                >
                  Part Payment
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {paymentType === 'part' ? 'Initial Amount Paid (₦)' : 'Amount (₦)'}
              </label>
              <input
                type="number"
                className={styles.input}
                placeholder={selectedOrder ? `of ${fmt(selectedOrder.price)}` : '0.00'}
                inputMode="decimal"
                value={amount}
                onChange={e => {
                  const val = e.target.value
                  setAmount(val)
                  if (selectedOrder) {
                    const fullPrice = parseFloat(selectedOrder.price) || 0
                    const entered   = parseFloat(val) || 0
                    if (fullPrice > 0) {
                      setPaymentType(entered > 0 && entered < fullPrice ? 'part' : 'full')
                    }
                  }
                }}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Payment Method</label>
              <div className={styles.methodRow}>
                {['cash', 'transfer', 'card', 'other'].map(m => (
                  <button
                    key={m}
                    className={`${styles.methodChip} ${method === m ? styles.methodActive : ''}`}
                    onClick={() => setMethod(m)}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Notes <span className={styles.optional}>(optional)</span></label>
              <textarea
                className={styles.textarea}
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

// ── ADD INSTALLMENT MODAL ─────────────────────────────────────

function AddInstallmentModal({ payment, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  const totalPaid = (payment.installments || []).reduce((s, i) => s + i.amount, 0)
  const remaining = (parseFloat(payment.orderPrice) || 0) - totalPaid

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) return
    onSave(parseFloat(amount), method)
    onClose()
  }

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>Record Payment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>
        <div className={styles.sheetBody}>
          {remaining > 0 && (
            <div className={styles.remainingBadge}>
              Balance remaining: <strong>{fmt(remaining)}</strong>
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Amount Received (₦)</label>
            <input
              type="number"
              className={styles.input}
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment Method</label>
            <div className={styles.methodRow}>
              {['cash', 'transfer', 'card', 'other'].map(m => (
                <button
                  key={m}
                  className={`${styles.methodChip} ${method === m ? styles.methodActive : ''}`}
                  onClick={() => setMethod(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button className={styles.confirmBtn} onClick={handleSave} disabled={!amount || parseFloat(amount) <= 0}>
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PAYMENT DETAIL MODAL ──────────────────────────────────────

function PaymentDetail({ payment, onClose, onDelete, onStatusChange, onAddInstallment, onGenerateReceipt }) {
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const installments  = payment.installments || []
  const fullPrice     = parseFloat(payment.orderPrice) || 0
  const totalPaid     = installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const remaining     = fullPrice > 0 ? Math.max(0, fullPrice - totalPaid) : 0
  const isPaid        = payment.status === 'paid'
  const isNowFullyPaid = fullPrice > 0 && totalPaid >= fullPrice
  const hasInstallments = installments.length > 0

  const pct = fullPrice > 0
    ? (isPaid ? Math.min(100, (totalPaid / fullPrice) * 100) : Math.min(99, (totalPaid / fullPrice) * 100))
    : 0

  const hasPartPayments = installments.length > 0

  return (
    <div className={styles.overlay}>
      <Header
        type="back"
        title="Payment Details"
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.modalBody}>

        <div className={styles.detailCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Order</span>
            <span className={styles.detailVal}>{payment.orderDesc || '—'}</span>
          </div>
          {fullPrice > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Order Value</span>
              <span className={styles.detailVal}>{fmt(fullPrice)}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Date Created</span>
            <span className={styles.detailVal}>{payment.date}</span>
          </div>
          {payment.notes && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Notes</span>
              <span className={styles.detailVal}>{payment.notes}</span>
            </div>
          )}
        </div>

        {fullPrice > 0 && hasInstallments && (
          <div className={styles.summaryCard} style={{ marginTop: 16 }}>
            <label className={styles.fieldLabel} style={{ marginBottom: 12, display: 'block' }}>Payment Breakdown</label>

            <div className={styles.summaryRow}>
              <span>Order Value</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(fullPrice)}</span>
            </div>

            {installments.map((inst, idx) => {
              const runningBefore = installments.slice(0, idx).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
              const runningAfter  = runningBefore + (parseFloat(inst.amount) || 0)
              const balAfter      = Math.max(0, fullPrice - runningAfter)
              const methodLabel   = inst.method ? inst.method.charAt(0).toUpperCase() + inst.method.slice(1) : ''

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
                    <div className={styles.summaryRow} style={{ marginBottom: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>Balance Before</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(runningBefore > 0 ? fullPrice - runningBefore : fullPrice)}</span>
                    </div>
                  )}

                  <div className={styles.summaryRow} style={{ marginBottom: 4 }}>
                    <span>Amount Paid</span>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(inst.amount)}</span>
                  </div>

                  <div className={styles.summaryRow} style={{ marginBottom: 0 }}>
                    <span>Balance After</span>
                    <span style={{ color: balAfter > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                      {balAfter > 0 ? fmt(balAfter) : 'Fully Paid ✓'}
                    </span>
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 16 }}>
              <div className={styles.progressWrap}>
                <div className={styles.progressBar} style={{ width: `${pct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>{fmt(totalPaid)} paid</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>{fmt(fullPrice)} total</span>
              </div>
            </div>
          </div>
        )}

        {(!fullPrice || !hasInstallments) && hasInstallments && (
          <div className={styles.summaryCard} style={{ marginTop: 16 }}>
            <div className={styles.installmentList}>
              {installments.map((inst, idx) => (
                <div key={inst.id ?? idx} className={styles.installmentRow}>
                  <div className={styles.installmentOuter}>
                    <div className={styles.installmentInner}>
                      <span className="mi" style={{ fontSize: '1rem', color: '#22c55e' }}>payments</span>
                    </div>
                  </div>
                  <div className={styles.installmentInfo}>
                    <div className={styles.installmentAmount}>{fmt(inst.amount)}</div>
                    <div className={styles.installmentDate}>{inst.date}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={styles.installmentBadge}>Received</span>
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

        <div className={styles.fieldGroup} style={{ marginTop: 18 }}>
          <label className={styles.fieldLabel}>Payment Status</label>
          {hasPartPayments && (
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
          <div className={styles.statusRow}>
            {PAY_STATUS.map(s => {
              const isLocked = hasPartPayments && (
                isNowFullyPaid ? s.value !== 'paid' : s.value !== 'part'
              )
              const isActive = isNowFullyPaid ? s.value === 'paid' : payment.status === s.value
              return (
                <button
                  key={s.value}
                  className={`${styles.statusChip} ${isActive ? styles.statusChipActive : ''}`}
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

        {!isPaid && (
          <button className={styles.addInstallmentBtn} onClick={() => setShowInstallmentModal(true)}>
            <span className="mi" style={{ fontSize: '1.1rem' }}>add_circle_outline</span>
            Record Another Payment
          </button>
        )}

        <button className={styles.generateInvoiceBtn} onClick={() => onGenerateReceipt(payment)}>
          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: 4 }}>receipt</span>
          Generate Receipt
        </button>

      </div>

      {showInstallmentModal && (
        <AddInstallmentModal
          payment={payment}
          onClose={() => setShowInstallmentModal(false)}
          onSave={(amount, method) => onAddInstallment(payment.id, amount, method)}
        />
      )}
    </div>
  )
}

// ── MAIN TAB ──────────────────────────────────────────────────

export default function PaymentsTab({ customerId, orders, showToast, onGenerateReceipt, onInvoicePaid }) {
  const { user } = useAuth()

  const [payments,   setPayments]   = useState([])
  const [modalOpen,  setModalOpen]  = useState(false)
  const [detailPay,  setDetailPay]  = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  useEffect(() => {
    if (!user || !customerId) return
    const unsub = subscribeToPayments(
      user.uid, customerId,
      (data) => {
        setPayments(data)
        setDetailPay(prev => {
          if (!prev) return null
          return data.find(p => p.id === prev.id) ?? null
        })
      },
      (err) => console.error('[PaymentsTab]', err)
    )
    return unsub
  }, [user, customerId])

  const orderItemsMap = {}
  for (const order of (orders || [])) {
    if (order.id && order.items?.length > 0) {
      orderItemsMap[order.id] = order.items
    }
  }

  const handleSave = async (paymentData) => {
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

  const handleStatusChange = async (paymentId, newStatus) => {
    if (!user) return
    try {
      await updatePayment(user.uid, customerId, paymentId, { status: newStatus })
    } catch {
      showToast('Failed to update status.')
    }
  }

  const handleAddInstallment = async (paymentId, amount, method) => {
    if (!user) return
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const newInstallment      = { amount, method, date: today(), id: Date.now() }
    const updatedInstallments = [...(payment.installments || []), newInstallment]
    const totalPaid           = updatedInstallments.reduce((s, i) => s + i.amount, 0)
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

  // ─────────────────────────────────────────────────────────────
  // FIX: pass the FULL payment object straight to CustomerDetail.
  // CustomerDetail.handleGenerateReceipt already handles which
  // installments are new vs previously receipted — we must NOT
  // strip previous installments here or that logic is bypassed.
  // ─────────────────────────────────────────────────────────────
  const handleGenerateReceipt = (payment) => {
    setDetailPay(null)
    // Pass payment as-is; CustomerDetail.handleGenerateReceipt
    // uses installmentIds stored on existing receipts to work out
    // which installments are new and which are previous history.
    onGenerateReceipt(payment)
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel || !user) return
    try {
      await deletePayment(user.uid, customerId, confirmDel.id)
      showToast('Payment deleted')
    } catch {
      showToast('Failed to delete.')
    }
    setConfirmDel(null)
    setDetailPay(null)
  }

  const grouped = payments.reduce((acc, p) => {
    const key = p.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <>
      {payments.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.3 }}>payments</span>
          <p>No payments recorded yet.</p>
          <span className={styles.hint}>Tap + to record a payment</span>
        </div>
      )}

      {Object.entries(grouped).map(([date, datePayments]) => (
        <div key={date} className={styles.payGroup}>
          <div className={styles.payGroupDate}>{date}</div>
          <div className={styles.payGroupDivider} />
          {datePayments.map((p, idx) => {
            const sm           = statusMeta(p.status)
            const isLast       = idx === datePayments.length - 1
            const installments = p.installments || []
            const totalPaid    = installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
            const fullPrice    = parseFloat(p.orderPrice) || 0
            const installCount = installments.length
            const pct          = fullPrice > 0
              ? (p.status === 'part' ? Math.min(99, (totalPaid / fullPrice) * 100) : Math.min(100, (totalPaid / fullPrice) * 100))
              : 0
            const orderItems   = orderItemsMap[p.orderId] ?? []

            return (
              <div
                key={p.id}
                className={`${styles.payListItem} ${isLast ? styles.payListItemLast : ''}`}
                onClick={() => setDetailPay(p)}
              >
                <OrderMosaic
                  orderItems={orderItems}
                  fallbackIcon="payments"
                  fallbackColor={sm.color}
                />
                <div className={styles.payListInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className={styles.payListDesc} style={{ flex: 1 }}>{p.orderDesc || 'Payment'}</span>
                    {installCount > 1 && (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        background: 'rgba(251,146,60,0.14)', color: '#fb923c',
                        border: '1px solid rgba(251,146,60,0.3)',
                        borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                        letterSpacing: '0.02em',
                      }}>
                        {installCount}/{installCount}
                      </span>
                    )}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    border: `1px solid ${sm.border}`,
                    background: sm.bg,
                    color: sm.color,
                  }}>
                    {sm.label}
                  </span>
                  {fullPrice > 0 && (
                    <div className={styles.payListMeta}>
                      <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>account_balance_wallet</span>
                      <span className={styles.payListMetaText}>{fmt(totalPaid)} of {fmt(fullPrice)}</span>
                    </div>
                  )}
                  {fullPrice > 0 && (
                    <div className={styles.miniProgressWrap}>
                      <div className={styles.miniProgressBar} style={{ width: `${pct}%`, background: sm.color }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={orders}
        payments={payments}
        onSave={handleSave}
      />

      {detailPay && (
        <PaymentDetail
          payment={detailPay}
          onClose={() => setDetailPay(null)}
          onDelete={() => setConfirmDel(detailPay)}
          onStatusChange={handleStatusChange}
          onAddInstallment={handleAddInstallment}
          onGenerateReceipt={handleGenerateReceipt}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Payment?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      <div style={{ display: 'none' }} id="__payment_modal_trigger__"
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

