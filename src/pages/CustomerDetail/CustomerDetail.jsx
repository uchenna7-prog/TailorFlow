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
  // Paste this function inside CustomerDetail, replacing the existing handleGenerateInvoice.
  // It now snapshots the active template + brand settings so InvoiceView always
  // renders the invoice exactly as it looked when it was created.

  const handleGenerateInvoice = useCallback(async (orderId) => {
    const existing = data.invoices.find(inv => String(inv.orderId) === String(orderId))
    if (existing) { showToast('Invoice already exists'); setActiveTab('invoice'); return }

    const order = orders.find(o => String(o.id) === String(orderId))
    if (!order) return

    // ── Read current brand settings for the snapshot ──────
    let settingsSnap = {}
    try {
      settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
    } catch { /* ignore */ }

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

      // ── Snapshot the template key at creation time ────────
      // InvoiceView reads this first so the format is locked
      // to what was chosen in Settings when this was generated.
      template: settingsSnap.invoiceTemplate || 'editable',

      // ── Snapshot brand fields that affect visual rendering ─
      brandSnapshot: {
        name:     settingsSnap.brandName     || '',
        tagline:  settingsSnap.brandTagline  || '',
        colour:   settingsSnap.brandColour   || '#D4AF37',
        phone:    settingsSnap.brandPhone    || '',
        email:    settingsSnap.brandEmail    || '',
        address:  settingsSnap.brandAddress  || '',
        footer:   settingsSnap.invoiceFooter || 'Thank you for your patronage 🙏',
        currency: settingsSnap.invoiceCurrency || '₦',
        showTax:  settingsSnap.invoiceShowTax  || false,
        taxRate:  settingsSnap.invoiceTaxRate  || 0,
        dueDays:  settingsSnap.invoiceDueDays  || 7,
        // Note: logo is stored separately in localStorage under tailorbook_brand_logo
        // and is read via useBrand(), so it's available at view time already.
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

  return (
    <div className={styles.container}>
      <div ref={fixedRef} className={styles.fixedHeader}>
        <Header 
          title="Customer Details" 
          onMenuClick={onMenuClick}
          showBack
          onBack={() => navigate(-1)}
        />
        
        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            {getInitials(data.customer?.name)}
          </div>
          <div className={styles.info}>
            <h1 className={styles.name}>{data.customer?.name || 'Loading...'}</h1>
            <p className={styles.phone}>{data.customer?.phone}</p>
            {data.customer?.birthday && (
              <span className={styles.birthdayBadge}>
                🎂 {getBirthday(data.customer.birthday)}
              </span>
            )}
          </div>
        </div>

        <div className={styles.tabsWrapper} ref={tabsRef}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'dress' && (
          <MeasurementsTab 
            customer={data.customer} 
            measurements={data.measurements}
            onUpdate={data.updateMeasurements}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab 
            customerId={id}
            orders={orders}
            measurements={data.measurements}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab 
            orders={orders}
            invoices={data.invoices}
            onGenerateInvoice={handleGenerateInvoice}
          />
        )}
        {activeTab === 'invoice' && (
          <InvoiceTab 
            customer={data.customer}
            invoices={data.invoices}
            onDelete={data.deleteInvoice}
          />
        )}
      </div>

      {toastMsg && <Toast message={toastMsg} />}
    </div>
  )
}
