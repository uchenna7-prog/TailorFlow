import { useState, useRef, useCallback } from 'react'
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
  const { getCustomer } = useCustomers()
  const data = useCustomerData(id)

  const [tab, setTab] = useState('dress')
  const [bodyOpen, setBodyOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2000)
  }, [])

  const customer = getCustomer(id)
  if (!customer) return <div>Not found</div>

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      {/* PROFILE */}
      <div className={styles.profileSection}>
        <div className={styles.left}>
          <div className={styles.avatar}>
            {customer.photo ? <img src={customer.photo} /> : initials}
          </div>

          {birthday && (
            <div className={styles.birthday}>
              🎈 {birthday}
            </div>
          )}
        </div>

        <div className={styles.right}>
          <div className={styles.name}>
            {customer.name} {customer.sex && `(${customer.sex})`}
          </div>

          <div className={styles.meta}>
            <span className="material-symbols-outlined">call</span>
            {customer.phone}
          </div>

          {customer.email && (
            <div className={styles.meta}>
              <span className="material-symbols-outlined">mail</span>
              {customer.email}
            </div>
          )}

          {customer.address && (
            <div className={styles.meta}>
              <span className="material-symbols-outlined">place</span>
              {customer.address}
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className={styles.actions}>
        <button onClick={() => window.location = `tel:${customer.phone}`}>
          <span className="material-symbols-outlined">call</span>
          Call
        </button>

        <button onClick={() => window.location = `mailto:${customer.email}`}>
          <span className="material-symbols-outlined">mail</span>
          Email
        </button>

        <button className={styles.primary} onClick={() => setBodyOpen(true)}>
          <span className="material-symbols-outlined">straighten</span>
          Full Body Measurements
        </button>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <div
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {tab === 'dress' && (
          <MeasurementsTab {...data} showToast={showToast} />
        )}
        {tab === 'orders' && (
          <OrdersTab {...data} showToast={showToast} />
        )}
        {tab === 'invoice' && (
          <InvoiceTab {...data} customer={customer} showToast={showToast} />
        )}
      </div>

      {/* ✅ FAB BACK */}
      {(tab === 'dress' || tab === 'orders') && (
        <button
          className={styles.fab}
          onClick={() => {
            if (tab === 'dress') {
              document.dispatchEvent(new CustomEvent('openMeasureModal'))
            }
            if (tab === 'orders') {
              document.dispatchEvent(new CustomEvent('openOrderModal'))
            }
          }}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      )}

      <Toast message={toastMsg} />
    </div>
  )
}