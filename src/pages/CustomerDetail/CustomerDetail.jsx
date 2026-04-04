import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { usePremium }   from '../../contexts/PremiumContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import { useOrders }    from '../../contexts/OrdersContext'
import Header from '../../components/Header/Header'
import Toast  from '../../components/Toast/Toast'
import MeasurementsTab from './tabs/MeasurementsTab'
import OrdersTab       from './tabs/OrdersTab'
import InvoiceTab      from './tabs/InvoiceTab'
import PaymentsTab     from './tabs/PaymentsTab'
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
  { id: 'dress',    label: 'Dress Measurements' },
  { id: 'orders',   label: 'Orders'             },
  { id: 'payments', label: 'Payments'           },
  { id: 'invoice',  label: 'Invoice'            },
]

export default function CustomerDetail({ onMenuClick }) {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { getCustomer, deleteCustomer } = useCustomers()
  const { isPremium } = usePremium()
  const data         = useCustomerData(id)
  const { getOrders } = useOrders()

  const [activeTab,     setActiveTab]     = useState('dress')
  const [toastMsg,      setToastMsg]      = useState('')
  const [invoicesState, setInvoicesState] = useState([])
  const toastTimer = useRef(null)
  const fixedRef   = useRef(null)
  const tabsRef    = useRef(null)

  // Orders now come from OrdersContext (real-time Firestore)
  const orders = getOrders(id)

  useEffect(() => {
    if (data.invoices) setInvoicesState(data.invoices)
  }, [data.invoices])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── Generate invoice (called from PaymentsTab) ────────────
  const handleGenerateInvoice = useCallback(async (orderId) => {
    const existing = data.invoices.find(inv => String(inv.orderId) === String(orderId))
    if (existing) { showToast('Invoice already exists'); setActiveTab('invoice'); return }

    const order = orders.find(o => String(o.id) === String(orderId))
    if (!order) return

    // ── Snapshot current brand/invoice settings at creation time
    // so InvoiceView always renders this invoice with the template
    // and brand that were active when it was generated — even if
    // the user changes Settings later.
    let settingsSnap = {}
    try {
      settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
    } catch { /* ignore */ }

    const invNumber   = `INV-${String(data.invoices.length + 1).padStart(3, '0')}`
    const today       = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const ids         = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
    const linkedNames = ids.map(mid => data.measurements.find(m => String(m.id) === String(mid))?.name).filter(Boolean)

    // Carry the itemised breakdown from the order so InvoiceView
    // can render each garment line with its individual price.
    const items = Array.isArray(order.items) ? order.items : []

    const newInvoice = {
      id:        Date.now() + Math.random(),
      orderId,
      number:    invNumber,
      orderDesc: order.desc,
      price:     order.price,   // grand total — kept for legacy fallback
      qty:       order.qty,
      items,
      linkedNames,
      due:       order.due,
      notes:     order.notes,
      status:    'unpaid',
      date:      today,

      // ── Template key locked at creation time ──────────────
      template: settingsSnap.invoiceTemplate || 'editable',

      // ── Brand snapshot locked at creation time ────────────
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

  // ── Global event listeners (OrdersTab generate invoice) ───
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

  // ── Measure fixed header height ───────────────────────────
  useEffect(() => {
    if (fixedRef.current) {
      const height = fixedRef.current.offsetHeight
      document.documentElement.style.setProperty('--total-fixed-height', `${height}px`)
    }
  }, [activeTab, data, isPremium])

  // ── Tab click: set active + smooth scroll into view ───────
  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)
  const hasPhoto = isPremium && customer.photo

  // FAB click — dispatch the right event per tab
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
            { icon: 'edit',   onClick: () => navigate(`/customers/edit/${id}`), outlined: true },
            { icon: 'delete', onClick: () => deleteCustomer(id), outlined: true, color: 'var(--danger)' },
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

          {/* ── TABS — horizontally scrollable with smooth scroll ── */}
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
          />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab
            customerId={id}
            orders={orders}
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
