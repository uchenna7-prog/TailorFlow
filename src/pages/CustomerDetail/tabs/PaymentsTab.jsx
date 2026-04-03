// ─────────────────────────────────────────────────────────────
// Payments tab for a single customer.
// • Add payment → select order, set status, enter amount
// • Part-payments accumulate with date stamps until total = full
// • Status auto-upgrades to 'paid' when total >= order price
// • Generate Invoice button lives here (not in OrdersTab)
// ─────────────────────────────────────────────────────────────

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
  { value: 'not_paid', label: 'Not Paid',     color: '#ef4444' },
  { value: 'part',     label: 'Part Payment', color: '#fb923c' },
  { value: 'paid',     label: 'Paid',         color: '#22c55e' },
]

function statusMeta(value) {
  return PAY_STATUS.find(s => s.value === value) ?? PAY_STATUS[0]
}

// ── ADD PAYMENT MODAL ─────────────────────────────────────────

function AddPaymentModal({ isOpen, onClose, orders, onSave }) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDropOpen, setOrderDropOpen] = useState(false)
  const [status,        setStatus]        = useState('not_paid')
  const [amountPaid,    setAmountPaid]    = useState('')
  const [method,        setMethod]        = useState('cash')
  const [notes,         setNotes]         = useState('')

  const reset = () => {
    setSelectedOrder(null); setOrderDropOpen(false)
    setStatus('not_paid'); setAmountPaid(''); setMethod('cash'); setNotes('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (!selectedOrder) return
    const initialInstallments = []
    if ((status === 'part' || status === 'paid') && amountPaid) {
      initialInstallments.push({
        amount: parseFloat(amountPaid),
        method,
        date:   today(),
        id:     Date.now(),
      })
    }

    // Auto-upgrade to paid if amount covers full price
    let finalStatus = status
    const total = initialInstallments.reduce((s, i) => s + i.amount, 0)
    const fullPrice = parseFloat(selectedOrder.price) || 0
    if (fullPrice > 0 && total >= fullPrice) finalStatus = 'paid'
    if (status === 'paid') finalStatus = 'paid'

    onSave({
      orderId:      selectedOrder.id,
      orderDesc:    selectedOrder.desc,
      orderPrice:   selectedOrder.price ?? null,
      status:       finalStatus,
      notes:        notes.trim(),
      installments: initialInstallments,
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
          { label: 'Save', onClick: handleSave, disabled: !selectedOrder }
        ]}
      />

      <div className={styles.modalBody}>

        {/* Select Order */}
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

        {/* Payment Status */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Payment Status</label>
          <div className={styles.statusRow}>
            {PAY_STATUS.map(s => (
              <button
                key={s.value}
                className={`${styles.statusChip} ${status === s.value ? styles.statusChipActive : ''}`}
                style={status === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}
                onClick={() => setStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount paid (only for part or paid) */}
        {(status === 'part' || status === 'paid') && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {status === 'paid' ? 'Amount Paid (₦)' : 'Initial Amount Paid (₦)'}
            </label>
            <input
              type="number"
              className={styles.input}
              placeholder={selectedOrder ? `of ${fmt(selectedOrder.price)}` : '0.00'}
              inputMode="decimal"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
            />
          </div>
        )}

        {/* Payment method — shown when amount is entered */}
        {(status === 'part' || status === 'paid') && (
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
        )}

        {/* Notes */}
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

function PaymentDetail({ payment, onClose, onDelete, onStatusChange, onAddInstallment, onGenerateInvoice }) {
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const sm = statusMeta(payment.status)

  const totalPaid  = (payment.installments || []).reduce((s, i) => s + i.amount, 0)
  const fullPrice  = parseFloat(payment.orderPrice) || 0
  const remaining  = fullPrice > 0 ? fullPrice - totalPaid : null
  const isPaid     = payment.status === 'paid'

  return (
    <div className={styles.overlay}>
      <Header 
        type="back"
        title="Payment Details"
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', label: 'Delete', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.modalBody}>

        {/* Order info */}
        <div className={styles.detailCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Order</span>
            <span className={styles.detailVal}>{payment.orderDesc || '—'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Order Value</span>
            <span className={styles.detailVal}>{fmt(payment.orderPrice)}</span>
          </div>
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

        {/* Status selector — only editable field */}
        <div className={styles.fieldGroup} style={{ marginTop: 18 }}>
          <label className={styles.fieldLabel}>Payment Status</label>
          <div className={styles.statusRow}>
            {PAY_STATUS.map(s => (
              <button
                key={s.value}
                className={`${styles.statusChip} ${payment.status === s.value ? styles.statusChipActive : ''}`}
                style={payment.status === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}
                onClick={() => onStatusChange(payment.id, s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        {fullPrice > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>Total Order Value</span>
              <span>{fmt(fullPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Paid</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(totalPaid)}</span>
            </div>
            {remaining !== null && remaining > 0 && (
              <div className={styles.summaryRow}>
                <span>Balance</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{fmt(remaining)}</span>
              </div>
            )}
            {/* Progress bar */}
            {fullPrice > 0 && (
              <div className={styles.progressWrap}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${Math.min(100, (totalPaid / fullPrice) * 100).toFixed(1)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Installment history */}
        {(payment.installments || []).length > 0 && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment History</label>
            <div className={styles.installmentList}>
              {payment.installments.map((inst, idx) => (
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

        {/* Add installment button — only if not fully paid */}
        {!isPaid && (
          <button className={styles.addInstallmentBtn} onClick={() => setShowInstallmentModal(true)}>
            <span className="mi" style={{ fontSize: '1.1rem' }}>add_circle_outline</span>
            Record Another Payment
          </button>
        )}

        {/* Generate Invoice */}
        <button className={styles.generateInvoiceBtn} onClick={() => onGenerateInvoice(payment)}>
          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: 4 }}>receipt_long</span>
          Generate Invoice
        </button>

      </div>

      {/* Installment modal */}
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

export default function PaymentsTab({ customerId, orders, showToast, onGenerateInvoice }) {
  const { user } = useAuth()

  const [payments,    setPayments]    = useState([])
  const [modalOpen,   setModalOpen]   = useState(false)
  const [detailPay,   setDetailPay]   = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)

  // ── Subscribe ─────────────────────────────────────────────
  useEffect(() => {
    if (!user || !customerId) return
    const unsub = subscribeToPayments(
      user.uid, customerId,
      (data) => {
        setPayments(data)
        // Keep detail in sync if open
        setDetailPay(prev => {
          if (!prev) return null
          return data.find(p => p.id === prev.id) ?? null
        })
      },
      (err) => console.error('[PaymentsTab]', err)
    )
    return unsub
  }, [user, customerId])

  // ── Save new payment ──────────────────────────────────────
  const handleSave = async (paymentData) => {
    if (!user) return
    try {
      await createPayment(user.uid, customerId, paymentData)
      showToast('Payment recorded ✓')
    } catch (e) {
      showToast('Failed to save payment.')
    }
  }

  // ── Status change ─────────────────────────────────────────
  const handleStatusChange = async (paymentId, newStatus) => {
    if (!user) return
    try {
      await updatePayment(user.uid, customerId, paymentId, { status: newStatus })
    } catch {
      showToast('Failed to update status.')
    }
  }

  // ── Add installment ───────────────────────────────────────
  const handleAddInstallment = async (paymentId, amount, method) => {
    if (!user) return
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const newInstallment = { amount, method, date: today(), id: Date.now() }
    const updatedInstallments = [...(payment.installments || []), newInstallment]
    const totalPaid  = updatedInstallments.reduce((s, i) => s + i.amount, 0)
    const fullPrice  = parseFloat(payment.orderPrice) || 0
    const newStatus  = fullPrice > 0 && totalPaid >= fullPrice ? 'paid' : payment.status

    try {
      await updatePayment(user.uid, customerId, paymentId, {
        installments: updatedInstallments,
        status: newStatus,
      })
      if (newStatus === 'paid') showToast('Payment complete! Marked as Paid ✓')
      else showToast('Payment recorded ✓')
    } catch {
      showToast('Failed to record payment.')
    }
  }

  // ── Delete ────────────────────────────────────────────────
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

  // ── Group by date ─────────────────────────────────────────
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
            const sm         = statusMeta(p.status)
            const isLast     = idx === datePayments.length - 1
            const totalPaid  = (p.installments || []).reduce((s, i) => s + i.amount, 0)
            const fullPrice  = parseFloat(p.orderPrice) || 0
            const pct        = fullPrice > 0 ? Math.min(100, (totalPaid / fullPrice) * 100) : 0

            return (
              <div
                key={p.id}
                className={`${styles.payListItem} ${isLast ? styles.payListItemLast : ''}`}
                onClick={() => setDetailPay(p)}
              >
                {/* Icon box */}
                <div className={styles.payListOuter}>
                  <div className={styles.payListInner}>
                    <span className="mi" style={{ fontSize: '1.5rem', color: sm.color }}>payments</span>
                  </div>
                </div>

                {/* Info */}
                <div className={styles.payListInfo}>
                  <div className={styles.payListDesc}>{p.orderDesc || 'Payment'}</div>
                  <div className={styles.payListMeta}>
                    <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>autorenew</span>
                    <span className={styles.payListMetaText} style={{ color: sm.color }}>{sm.label}</span>
                  </div>
                  {fullPrice > 0 && (
                    <div className={styles.payListMeta}>
                      <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>account_balance_wallet</span>
                      <span className={styles.payListMetaText}>
                        {fmt(totalPaid)} of {fmt(fullPrice)}
                      </span>
                    </div>
                  )}
                  {/* Mini progress bar */}
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

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={orders}
        onSave={handleSave}
      />

      {/* Payment Detail */}
      {detailPay && (
        <PaymentDetail
          payment={detailPay}
          onClose={() => setDetailPay(null)}
          onDelete={() => setConfirmDel(detailPay)}
          onStatusChange={handleStatusChange}
          onAddInstallment={handleAddInstallment}
          onGenerateInvoice={(payment) => {
            setDetailPay(null)
            onGenerateInvoice(payment.orderId)
          }}
        />
      )}

      {/* Confirm delete */}
      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Payment?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      {/* FAB trigger — parent CustomerDetail passes openPaymentModal event */}
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

// Export a helper so CustomerDetail can open the modal via the + button
PaymentsTab.openModal = () => {
  document.getElementById('__payment_modal_trigger__')?.dispatchEvent(new Event('open'))
}
