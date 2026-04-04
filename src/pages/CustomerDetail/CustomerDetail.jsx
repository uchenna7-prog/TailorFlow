// src/pages/CustomerDetail/CustomerDetail.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers }   from '../../contexts/CustomerContext'
import { usePremium }     from '../../contexts/PremiumContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import { useOrders }      from '../../contexts/OrdersContext'
import { addReceipt, subscribeToReceipts, deleteReceipt } from '../../services/receiptService'
import { useAuth }        from '../../contexts/AuthContext'
import Header        from '../../components/Header/Header'
import Toast         from '../../components/Toast/Toast'
import MeasurementsTab from './tabs/MeasurementsTab'
import OrdersTab       from './tabs/OrdersTab'
import InvoiceTab      from './tabs/InvoiceTab'
import PaymentsTab     from './tabs/PaymentsTab'
import ReceiptTab      from './tabs/ReceiptTab'
import styles from './CustomerDetail.module.css'

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getBirthday(birthday) {
  if (!birthday) return null
  const d = new Date(birthday)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Tab order: Dress Measurements → Orders → Invoices → Payments → Receipts
const TABS = [
  { id: 'dress',    label: 'Dress Measurements' },
  { id: 'orders',   label: 'Orders'             },
  { id: 'invoice',  label: 'Invoices'           },
  { id: 'payments', label: 'Payments'           },
  { id: 'receipts', label: 'Receipts'           },
]

export default function CustomerDetail({ onMenuClick }) {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { getCustomer, deleteCustomer } = useCustomers()
  const { isPremium } = usePremium()
  const data          = useCustomerData(id)
  const { getOrders } = useOrders()

  const [activeTab,     setActiveTab]     = useState('dress')
  const [toastMsg,      setToastMsg]      = useState('')
  const [invoicesState, setInvoicesState] = useState([])
  const [receipts,      setReceipts]      = useState([])
  const toastTimer = useRef(null)
  const fixedRef   = useRef(null)
  const tabsRef    = useRef(null)

  const orders = getOrders(id)

  useEffect(() => {
    if (data.invoices) setInvoicesState(data.invoices)
  }, [data.invoices])

  // Subscribe to receipts subcollection
  useEffect(() => {
    if (!user || !id) return
    const unsub = subscribeToReceipts(
      user.uid, id,
      (data) => setReceipts(data),
      (err)  => console.error('[CustomerDetail] receipts:', err)
    )
    return unsub
  }, [user, id])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── Generate invoice (called from OrdersTab) ──────────────
  const handleGenerateInvoice = useCallback(async (orderId) => {
    const existing = data.invoices.find(inv => String(inv.orderId) === String(orderId))
    if (existing) { showToast('Invoice already exists'); setActiveTab('invoice'); return }

    const order = orders.find(o => String(o.id) === String(orderId))
    if (!order) return

    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const invNumber   = `INV-${String(data.invoices.length + 1).padStart(3, '0')}`
    const today       = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const ids         = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
    const linkedNames = ids.map(mid => data.measurements.find(m => String(m.id) === String(mid))?.name).filter(Boolean)
    const items       = Array.isArray(order.items) ? order.items : []

    const newInvoice = {
      id:        Date.now() + Math.random(),
      orderId,
      number:    invNumber,
      orderDesc: order.desc,
      price:     order.price,
      qty:       order.qty,
      items,
      linkedNames,
      due:       order.due,
      notes:     order.notes,
      status:    'unpaid',
      date:      today,
      template:  settingsSnap.invoiceTemplate || 'editable',
      brandSnapshot: {
        name:     settingsSnap.brandName      || '',
        tagline:  settingsSnap.brandTagline   || '',
        colour:   settingsSnap.brandColour    || '#D4AF37',
        phone:    settingsSnap.brandPhone     || '',
        email:    settingsSnap.brandEmail     || '',
        address:  settingsSnap.brandAddress   || '',
        footer:   settingsSnap.invoiceFooter  || 'Thank you for your patronage 🙏',
        currency: settingsSnap.invoiceCurrency || '₦',
        showTax:  settingsSnap.invoiceShowTax  || false,
        taxRate:  settingsSnap.invoiceTaxRate  || 0,
        dueDays:  settingsSnap.invoiceDueDays  || 7,
      },
    }

    try {
      await data.saveInvoice(newInvoice)
      showToast(`${invNumber} generated ✓`)
      setActiveTab('invoice')
    } catch {
      showToast('Failed to save invoice. Try again.')
    }
  }, [data, orders, showToast])

  // ── Generate receipt (called from PaymentsTab) ────────────
  //
  // Smart logic:
  // • Looks at existing receipts for this payment to find which
  //   installment IDs are already covered.
  // • Only includes NEW (uncovered) installments on the receipt.
  // • If all are already covered (someone generated receipts for
  //   each part-payment individually), it generates a cumulative
  //   summary receipt covering ALL installments anyway so the
  //   customer can get a full-payment receipt.
  // • If no installments exist yet, shows a toast.
  const handleGenerateReceipt = useCallback(async (payment) => {
    if (!user) return

    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const allInstallments = payment.installments || []

    if (allInstallments.length === 0) {
      showToast('No payments recorded yet — nothing to receipt.')
      return
    }

    // Find installment IDs already covered by existing receipts for this payment
    const usedInstallmentIds = new Set(
      receipts
        .filter(r => String(r.paymentId) === String(payment.id))
        .flatMap(r => r.installmentIds || [])
    )

    // New = not yet in any receipt
    const newInstallments = allInstallments.filter(
      inst => !usedInstallmentIds.has(String(inst.id))
    )

    // If all are already receipted, still allow a cumulative receipt
    const installmentsForReceipt = newInstallments.length > 0
      ? newInstallments
      : allInstallments

    const totalPaid  = allInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const orderTotal = parseFloat(payment.orderPrice) || 0
    const balance    = Math.max(0, orderTotal - totalPaid)
    const isFullPay  = balance <= 0

    // Get order items for garment breakdown on receipt
    const order = orders.find(o => String(o.id) === String(payment.orderId))

    // Number: RCP-{per-payment count}-{global count}
    const perPaymentCount = receipts.filter(r => String(r.paymentId) === String(payment.id)).length + 1
    const globalCount     = receipts.length + 1
    const rcptNumber = `RCP-${String(perPaymentCount).padStart(2, '0')}-${String(globalCount).padStart(3, '0')}`

    const newReceipt = {
      paymentId:      payment.id,
      orderId:        payment.orderId,
      orderDesc:      payment.orderDesc,
      orderPrice:     payment.orderPrice,
      items:          order?.items || payment.orderItems || [],
      number:         rcptNumber,
      date:           todayStr,
      payments:       installmentsForReceipt.map(inst => ({
        id:     inst.id,
        amount: inst.amount,
        method: inst.method || 'cash',
        date:   inst.date,
      })),
      installmentIds: installmentsForReceipt.map(inst => String(inst.id)),
      isFullPayment:  isFullPay,
      balance:        isFullPay ? 0 : balance,
      notes:          payment.notes || '',
      template:       settingsSnap.invoiceTemplate || 'editable',
      brandSnapshot: {
        name:     settingsSnap.brandName      || '',
        tagline:  settingsSnap.brandTagline   || '',
        colour:   settingsSnap.brandColour    || '#D4AF37',
        phone:    settingsSnap.brandPhone     || '',
        email:    settingsSnap.brandEmail     || '',
        address:  settingsSnap.brandAddress   || '',
        footer:   settingsSnap.invoiceFooter  || 'Thank you for your payment 🙏',
        currency: settingsSnap.invoiceCurrency || '₦',
        showTax:  settingsSnap.invoiceShowTax  || false,
        taxRate:  settingsSnap.invoiceTaxRate  || 0,
        dueDays:  settingsSnap.invoiceDueDays  || 7,
      },
    }

    try {
      await addReceipt(user.uid, id, newReceipt)
      showToast(`${rcptNumber} receipt generated ✓`)
      setActiveTab('receipts')
    } catch {
      showToast('Failed to generate receipt. Try again.')
    }
  }, [user, id, receipts, orders, showToast])

  // ── Delete receipt ────────────────────────────────────────
  const handleDeleteReceipt = useCallback(async (receiptId) => {
    if (!user) return
    try {
      await deleteReceipt(user.uid, id, receiptId)
      showToast('Receipt deleted')
    } catch {
      showToast('Failed to delete receipt.')
    }
  }, [user, id, showToast])

  // ── Global event listeners (for OrdersTab invoice generation) ──
  useEffect(() => {
    const handleSwitch   = () => setActiveTab('invoice')
    const handleGenerate = (e) => handleGenerateInvoice(e.detail.orderId)

    document.addEventListener('switchToInvoiceTab', handleSwitch)
    document.addEventListener('generateInvoice',    handleGenerate)
    return () => {
      document.removeEventListener('switchToInvoiceTab', handleSwitch)
      document.removeEventListener('generateInvoice',    handleGenerate)
    }
  }, [handleGenerateInvoice])

  // ── Fixed header height ───────────────────────────────────
  useEffect(() => {
    if (fixedRef.current) {
      const height = fixedRef.current.offsetHeight
      document.documentElement.style.setProperty('--total-fixed-height', `${height}px`)
    }
  }, [activeTab, data, isPremium])

  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)
  const hasPhoto = isPremium && customer.photo

  const handleFabClick = () => {
    if (activeTab === 'dress')    document.dispatchEvent(new CustomEvent('openMeasureModal'))
    if (activeTab === 'orders')   document.dispatchEvent(new CustomEvent('openOrderModal'))
    if (activeTab === 'payments') document.dispatchEvent(new CustomEvent('openPaymentModal'))
  }

  const showFab = ['dress', 'orders', 'payments'].includes(activeTab)

  return (
    <div className={styles.page}>

      {/* ── FIXED HEADER GROUP ── */}
      <div className={styles.fixedHeaderGroup} ref={fixedRef}>
        <Header
          type="back"
          title="Customer Details"
          customActions={[
            { icon: 'edit',   label: 'Edit Customer',   onClick: () => navigate(`/customers/edit/${id}`), outlined: true },
            { icon: 'delete', label: 'Delete Customer', onClick: () => deleteCustomer(id), outlined: true, color: 'var(--danger)' },
          ]}
        />

        <div className={styles.fixedTopContainer}>
          {isPremium ? (
            <div className={styles.profileSection}>
              <div className={styles.leftColumn}>
                <div className={styles.avatar}>
                  {hasPhoto
                    ? <img src={customer.photo} className={styles.avatarImg} alt={customer.name} />
                    : initials
                  }
                </div>
                {birthday && <div className={styles.birthday}>🎈 {birthday}</div>}
              </div>
              <div className={styles.rightColumn}>
                <div className={styles.name}>{customer.name}{customer.sex && ` (${customer.sex})`}</div>
                <div className={styles.meta}><span className="mi">call</span>{customer.phone}</div>
                {customer.email   && <div className={styles.meta}><span className="mi">mail_outline</span>{customer.email}</div>}
                {customer.address && <div className={styles.meta}><span className="mi">place</span>{customer.address}</div>}
              </div>
            </div>
          ) : (
            <div className={styles.profileSectionFree}>
              <div className={styles.name}>{customer.name}{customer.sex && ` (${customer.sex})`}</div>
              <div className={styles.metaInline}>
                <div className={styles.metaItem}>
                  <span className="mi">call</span>
                  <span>{customer.phone}</span>
                </div>
                {birthday && (
                  <div className={`${styles.metaItem} ${styles.birthday}`}>
                    <span className="mi">cake</span>
                    <span>{birthday}</span>
                  </div>
                )}
                {customer.email && (
                  <div className={styles.metaItem}>
                    <span className="mi">mail_outline</span>
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className={styles.metaItem}>
                    <span className="mi">place</span>
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `tel:${customer.phone}`}>
              <span className="mi">call</span>Call
            </button>
            <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `mailto:${customer.email}`}>
              <span className="mi">mail_outline</span>Email
            </button>
            <button className={`${styles.btn} ${styles.primary}`}>
              <span className="mi">straighten</span>Full Body Measurements
            </button>
          </div>

          <div className={styles.tabs} ref={tabsRef}>
            {TABS.map(tab => (
              <div
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={(e) => handleTabClick(e, tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SCROLL CONTENT ── */}
      <div className={styles.scrollContent}>
        {activeTab === 'dress' && (
          <MeasurementsTab
            measurements={data.measurements}
            onSave={data.saveMeasurement}
            onDelete={data.deleteMeasurement}
            showToast={showToast}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            customerId={id}
            orders={orders}
            measurements={data.measurements}
            showToast={showToast}
            onGenerateInvoice={handleGenerateInvoice}
          />
        )}
        {activeTab === 'invoice' && (
          <InvoiceTab
            invoices={invoicesState}
            orders={orders}
            measurements={data.measurements}
            customer={customer}
            onSave={data.saveInvoice}
            onDelete={data.deleteInvoice}
            onStatusChange={data.updateInvoiceStatus}
            showToast={showToast}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab
            customerId={id}
            orders={orders}
            showToast={showToast}
            onGenerateReceipt={handleGenerateReceipt}
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptTab
            receipts={receipts}
            customer={customer}
            onDelete={handleDeleteReceipt}
            showToast={showToast}
          />
        )}
      </div>

      {/* ── FAB ── */}
      {showFab && (
        <button className={styles.fab} onClick={handleFabClick}>
          <span className="mi">add</span>
        </button>
      )}

      <Toast message={toastMsg} />
    </div>
  )
}
