import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import MeasurementsTab from './tabs/MeasurementsTab'
import OrdersTab from './tabs/OrdersTab'
import InvoiceTab from './tabs/InvoiceTab'
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
  { id: 'dress', label: 'Dress Measurements' },
  { id: 'orders', label: 'Orders' },
  { id: 'invoice', label: 'Invoice' },
]

export default function CustomerDetail({ onMenuClick }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCustomer, deleteCustomer } = useCustomers()
  const data = useCustomerData(id)

  const [activeTab, setActiveTab] = useState('dress')
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)
  const fixedRef = useRef(null)


  // --- SYNC LOCAL STATE ---
  const [invoicesState, setInvoicesState] = useState([])
  useEffect(() => {
    if (data.invoices) setInvoicesState(data.invoices)
  }, [data.invoices])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // --- GLOBAL EVENT LISTENERS ---
  useEffect(() => {
    const handleSwitch = () => setActiveTab('invoice')

    const handleGenerate = (e) => {
      const { orderId } = e.detail
      const existing = data.invoices.find(inv => String(inv.orderId) === String(orderId))

      if (existing) {
        showToast('Invoice already exists')
        setActiveTab('invoice')
        return
      }

      const order = data.orders.find(o => String(o.id) === String(orderId))
      if (!order) return

      const invNumber = `INV-${String(data.invoices.length + 1).padStart(3, '0')}`
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const ids = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
      const linkedNames = ids.map(mid => data.measurements.find(m => String(m.id) === String(mid))?.name).filter(Boolean)

      const newInvoice = {
        id: Date.now() + Math.random(),
        orderId,
        number: invNumber,
        orderDesc: order.desc,
        price: order.price,
        qty: order.qty,
        linkedNames,
        due: order.due,
        notes: order.notes,
        status: 'unpaid',
        date: today,
      }

      data.saveInvoice(newInvoice)
      showToast(`${invNumber} generated ✓`)
      setActiveTab('invoice')
    }

    document.addEventListener('switchToInvoiceTab', handleSwitch)
    document.addEventListener('generateInvoice', handleGenerate)
    return () => {
      document.removeEventListener('switchToInvoiceTab', handleSwitch)
      document.removeEventListener('generateInvoice', handleGenerate)
    }
  }, [data, showToast])

  useEffect(() => {
    if (fixedRef.current) {
      const height = fixedRef.current.offsetHeight
      document.documentElement.style.setProperty('--fixed-top-height', `${height}px`)
    }
  }, [activeTab, data])

  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)

  return (
    <div className={styles.page}>
      <Header
        type="back"
        title="Customer Details"
        customActions={[
          { icon: 'edit', label: 'Edit Customer', onClick: () => navigate(`/customers/edit/${id}`) },
          { icon: 'delete', label: 'Delete Customer', onClick: () => deleteCustomer(id), outlined: true, color: 'var(--danger)' },
        ]}
      />

      <div className={styles.fixedTopContainer} ref={fixedRef}>
        <div className={styles.profileSection}>
          <div className={styles.leftColumn}>
            <div className={styles.avatar}>
              {customer.photo ? <img src={customer.photo} className={styles.avatarImg} /> : initials}
            </div>
            {birthday && <div className={styles.birthday}>🎈 {birthday}</div>}
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.name}>{customer.name} {customer.sex && `(${customer.sex})`}</div>
            <div className={styles.meta}><span className="mi">call</span>{customer.phone}</div>
            {customer.email && <div className={styles.meta}><span className="mi">mail_outline</span>{customer.email}</div>}
            {customer.address && <div className={styles.meta}><span className="mi">place</span>{customer.address}</div>}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `tel:${customer.phone}`}><span className="mi">call</span>Call</button>
          <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `mailto:${customer.email}`}><span className="mi">mail_outline</span>Email</button>
          <button className={`${styles.btn} ${styles.primary}`} ><span className="mi">straighten</span>Full Body Measurements</button>
        </div>

        <div className={styles.tabs}>
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

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
            orders={data.orders}
            measurements={data.measurements}
            onSave={data.saveOrder}
            onDelete={data.deleteOrder}
            onStatusChange={data.updateOrderStatus}
            showToast={showToast}
          />
        )}
        {activeTab === 'invoice' && (
          <InvoiceTab
            invoices={invoicesState}
            orders={data.orders}
            measurements={data.measurements}
            customer={customer}
            onSave={data.saveInvoice}
            onDelete={data.deleteInvoice}
            onStatusChange={data.updateInvoiceStatus}
            showToast={showToast}
          />
        )}
      </div>

      {(activeTab === 'dress' || activeTab === 'orders') && (
        <button
          className={styles.fab}
          onClick={() =>
            document.dispatchEvent(
              new CustomEvent(activeTab === 'dress' ? 'openMeasureModal' : 'openOrderModal')
            )
          }
        >
          <span className="mi">add</span>
        </button>
      )}

      <Toast message={toastMsg} />
    </div>
  )
}