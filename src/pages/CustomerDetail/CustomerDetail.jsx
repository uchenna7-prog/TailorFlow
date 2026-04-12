// src/pages/CustomerDetail/CustomerDetail.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers }   from '../../contexts/CustomerContext'
import { usePremium }     from '../../contexts/PremiumContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import { useOrders }      from '../../contexts/OrdersContext'
import { useInvoice }     from '../../contexts/InvoiceContext'
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

  const toastTimer = useRef(null)
  const tabsRef    = useRef(null)
  const topSentinelRef = useRef(null)

  const orders = getOrders(id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (data.invoices) setInvoicesState(data.invoices)
  }, [data.invoices])

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

    // Use live context values as the primary source for the snapshot.
    // Fall back to localStorage for any fields the context doesn't expose.
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
      // Snapshot the active template + brand at creation time so InvoiceView
      // always renders with the correct template even if settings change later.
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

  // ── AUTO-MARK INVOICE AS PAID ────────────────────────────────
  // Called by PaymentsTab whenever a payment reaches 'paid' status.
  // Finds the matching invoice by orderId and flips it to 'paid'
  // automatically — no manual toggle needed.
  const handleInvoicePaid = useCallback(async (orderId) => {
    const matchingInvoice = invoicesState.find(
      inv => String(inv.orderId) === String(orderId) && inv.status !== 'paid'
    )
    if (!matchingInvoice) return
    try {
      await data.updateInvoiceStatus(matchingInvoice.id, 'paid')
      setInvoicesState(prev =>
        prev.map(inv =>
          inv.id === matchingInvoice.id ? { ...inv, status: 'paid' } : inv
        )
      )
      showToast('Invoice auto-marked as Paid ✓')
    } catch {
      showToast('Could not auto-update invoice.')
    }
  }, [invoicesState, data, showToast])

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

    const totalPaid  = allInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const orderTotal = parseFloat(payment.orderPrice) || 0
    const balance    = Math.max(0, orderTotal - totalPaid)
    const isFullPay  = balance <= 0

    const order = orders.find(o => String(o.id) === String(payment.orderId))

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

  // Determine whether the active tab has any content cards.
  // When empty AND the tabs are stuck (isScrolled), the tab content must not
  // overflow the viewport — so the empty-state can't be scrolled under the header.
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
          <button className={`${styles.btn} ${styles.primary}`}>
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

      {/*
        data-empty is true when the active tab has no cards.
        The CSS uses this to clamp the height to the remaining viewport
        so the empty state cannot scroll beneath the sticky header + tabs.
      */}
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
