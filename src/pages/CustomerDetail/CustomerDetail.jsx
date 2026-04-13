// src/pages/CustomerDetail/CustomerDetail.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers }   from '../../contexts/CustomerContext'
import { usePremium }     from '../../contexts/PremiumContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import { useOrders }      from '../../contexts/OrdersContext'
import { useInvoice }     from '../../contexts/InvoiceContext'
import { addReceipt, subscribeToReceipts, deleteReceipt } from '../../services/receiptService'
import { subscribeToPayments } from '../../services/paymentService'
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

const TABS = [
  { id: 'dress',    label: 'Dress\nMeasurements' },
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
  const { template: invoiceTemplate, brand: invoiceBrand } = useInvoice()

  const [activeTab,     setActiveTab]     = useState('dress')
  const [toastMsg,      setToastMsg]      = useState('')
  const [invoicesState, setInvoicesState] = useState([])
  const [receipts,      setReceipts]      = useState([])
  const [isScrolled,    setIsScrolled]    = useState(false)

  const toastTimer     = useRef(null)
  const tabsRef        = useRef(null)
  const topSentinelRef = useRef(null)
  const healedRef      = useRef(false)  // tracks one-time invoice status heal

  const orders = getOrders(id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (data.invoices) setInvoicesState(data.invoices)
  }, [data.invoices])

  // ── One-time heal: fix invoices stuck as 'unpaid' that have real payments ──
  // Runs once per customer page load after both invoices and payments are ready.
  // Corrects any invoice whose Firestore status was never updated by an older
  // version of the app (before the part_paid fix was deployed).
  useEffect(() => {
    if (!user || !id || healedRef.current) return
    if (!data.invoices || data.invoices.length === 0) return

    const unsubPayments = subscribeToPayments(
      user.uid, id,
      async (payments) => {
        if (healedRef.current) return
        healedRef.current = true  // only run once

        for (const p of payments) {
          if (!p.orderId) continue
          const paidAmount = (p.installments || []).reduce(
            (s, i) => s + (parseFloat(i.amount) || 0), 0
          )
          if (paidAmount <= 0) continue

          // Find the matching invoice that is still stuck as 'unpaid'
          const inv = data.invoices.find(
            i => String(i.orderId) === String(p.orderId) && i.status === 'unpaid'
          )
          if (!inv) continue

          // Derive correct status from payment
          const correctStatus = p.status === 'paid' ? 'paid' : 'part_paid'
          try {
            await data.updateInvoiceStatus(inv.id, correctStatus)
            setInvoicesState(prev =>
              prev.map(i => i.id === inv.id ? { ...i, status: correctStatus } : i)
            )
          } catch (e) {
            console.error('[CustomerDetail] heal invoice status:', e)
          }
        }
      },
      (err) => console.error('[CustomerDetail] heal payments sub:', err)
    )

    // Unsubscribe immediately after the first snapshot — we only need it once
    return () => unsubPayments()
  }, [user, id, data.invoices])

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
      template:  invoiceTemplate || settingsSnap.invoiceTemplate || 'editable',
      brandSnapshot: {
        name:     invoiceBrand?.name    || settingsSnap.brandName      || '',
        tagline:  invoiceBrand?.tagline || settingsSnap.brandTagline   || '',
        colour:   invoiceBrand?.colour  || settingsSnap.brandColour    || '#D4AF37',
        phone:    invoiceBrand?.phone   || settingsSnap.brandPhone     || '',
        email:    invoiceBrand?.email   || settingsSnap.brandEmail     || '',
        address:  invoiceBrand?.address || settingsSnap.brandAddress   || '',
        footer:   settingsSnap.invoiceFooter   || 'Thank you for your patronage 🙏',
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
  }, [data, orders, showToast, invoiceTemplate, invoiceBrand])

  const handleInvoicePaid = useCallback(async (orderId, invoiceStatus) => {
    const newStatus = invoiceStatus || 'paid'
    // Always use the live Firestore-synced list (data.invoices) so we have
    // the real Firestore document ID, not a stale local float ID.
    // Fall back to invoicesState if data.invoices isn't populated yet.
    const sourceList = (data.invoices && data.invoices.length > 0)
      ? data.invoices
      : invoicesState
    const matchingInvoice = sourceList.find(
      inv => String(inv.orderId) === String(orderId) && inv.status !== 'paid'
    )
    if (!matchingInvoice) return
    try {
      await data.updateInvoiceStatus(matchingInvoice.id, newStatus)
      setInvoicesState(prev =>
        prev.map(inv =>
          inv.id === matchingInvoice.id ? { ...inv, status: newStatus } : inv
        )
      )
      const label = newStatus === 'part_paid' ? 'Part Payment' : 'Full Payment'
      showToast(`Invoice marked as ${label} ✓`)
    } catch {
      showToast('Could not auto-update invoice.')
    }
  }, [invoicesState, data, showToast])

  const handleGenerateReceipt = useCallback(async (payment) => {
    if (!user) return

    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const todayStr        = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const allInstallments = payment.installments || []

    if (allInstallments.length === 0) {
      showToast('No payments recorded yet — nothing to receipt.')
      return
    }

    // ── Which installments are new (not yet receipted)? ───────────
    const usedInstallmentIds = new Set(
      receipts
        .filter(r => String(r.paymentId) === String(payment.id))
        .flatMap(r => r.installmentIds || [])
    )

    const newInstallments = allInstallments.filter(
      inst => !usedInstallmentIds.has(String(inst.id))
    )

    const installmentsForReceipt = newInstallments.length > 0
      ? newInstallments
      : allInstallments

    // ── previousInstallments: everything paid BEFORE this receipt ─
    // Snapshotted so the receipt is self-contained and never needs to
    // re-query the payment document to reconstruct its history.
    const receiptInstallmentIds = new Set(installmentsForReceipt.map(i => String(i.id)))
    const previousInstallments  = allInstallments
      .filter(inst => !receiptInstallmentIds.has(String(inst.id)))
      .map(inst => ({
        id:     inst.id,
        amount: inst.amount,
        method: inst.method || 'cash',
        date:   inst.date,
      }))

    // ── Totals ────────────────────────────────────────────────────
    const previousPaid   = previousInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const cumulativePaid = allInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const orderTotal     = parseFloat(payment.orderPrice) || 0
    const balance        = Math.max(0, orderTotal - cumulativePaid)
    const isFullPay      = balance <= 0

    const order = orders.find(o => String(o.id) === String(payment.orderId))

    const perPaymentCount = receipts.filter(r => String(r.paymentId) === String(payment.id)).length + 1
    const globalCount     = receipts.length + 1
    const rcptNumber      = `RCP-${String(perPaymentCount).padStart(2, '0')}-${String(globalCount).padStart(3, '0')}`

    const newReceipt = {
      paymentId:  payment.id,
      orderId:    payment.orderId,
      orderDesc:  payment.orderDesc,
      orderPrice: payment.orderPrice,
      items:      order?.items || payment.orderItems || [],
      number:     rcptNumber,
      date:       todayStr,

      // payments = only the installment(s) on THIS receipt
      payments: installmentsForReceipt.map(inst => ({
        id:     inst.id,
        amount: inst.amount,
        method: inst.method || 'cash',
        date:   inst.date,
      })),
      installmentIds: installmentsForReceipt.map(inst => String(inst.id)),

      // previousInstallments = snapshot of all payments made before this receipt.
      // Empty array means this is the very first receipt for this order.
      previousInstallments,
      previousPaid,

      // cumulativePaid = previousPaid + this receipt's payments combined.
      // Used by ReceiptView to show correct "Amount Paid" and "Balance Remaining".
      cumulativePaid,
      isFullPayment: isFullPay,
      balance,
      notes: payment.notes || '',

      brandSnapshot: {
        name:     invoiceBrand?.name    || settingsSnap.brandName      || '',
        tagline:  invoiceBrand?.tagline || settingsSnap.brandTagline   || '',
        colour:   invoiceBrand?.colour  || settingsSnap.brandColour    || '#D4AF37',
        phone:    invoiceBrand?.phone   || settingsSnap.brandPhone     || '',
        email:    invoiceBrand?.email   || settingsSnap.brandEmail     || '',
        address:  invoiceBrand?.address || settingsSnap.brandAddress   || '',
        footer:   settingsSnap.invoiceFooter   || 'Thank you for your payment 🙏',
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
  }, [user, id, receipts, orders, showToast, invoiceTemplate, invoiceBrand])

  const handleDeleteReceipt = useCallback(async (receiptId) => {
    if (!user) return
    try {
      await deleteReceipt(user.uid, id, receiptId)
      showToast('Receipt deleted')
    } catch {
      showToast('Failed to delete receipt.')
    }
  }, [user, id, showToast])

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

  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    if (window.scrollY > 56) {
      window.scrollTo({ top: 56, behavior: 'auto' })
    }
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

  const tabItemCounts = {
    dress:    data.measurements?.length ?? 0,
    orders:   orders?.length            ?? 0,
    invoice:  invoicesState?.length     ?? 0,
    payments: orders?.filter(o => o.payments?.length).length ?? 0,
    receipts: receipts?.length          ?? 0,
  }
  const activeTabIsEmpty = tabItemCounts[activeTab] === 0

  return (
    <div className={styles.page}>
      <div ref={topSentinelRef} className={styles.sentinel} />

      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : "Customer Details"}
          customActions={[
            { icon: 'edit',   onClick: () => navigate(`/customers/edit/${id}`), outlined: true },
            { icon: 'delete', onClick: () => deleteCustomer(id), outlined: true, color: 'var(--danger)' },
          ]}
        />
      </div>

      <div className={styles.profileContainer}>
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
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => navigate(`/customers/${id}/body-measurements`)}
          >
            <span className="mi">straighten</span>Full Body Measurements
          </button>
        </div>
      </div>

      <div className={styles.stickyTabsWrapper}>
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

      <div
        className={styles.tabContent}
        data-empty={activeTabIsEmpty ? 'true' : 'false'}
      >
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
            onInvoicePaid={handleInvoicePaid}
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

      {showFab && (
        <button className={styles.fab} onClick={handleFabClick}>
          <span className="mi">add</span>
        </button>
      )}

      <Toast message={toastMsg} />
    </div>
  )
}