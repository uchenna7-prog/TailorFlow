import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import Header from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
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
  const [bodyPanelOpen, setBodyPanelOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)

  return (
    <div className={styles.page}>
      {/* ✅ Header: big back button, page title, edit + outlined delete */}
      <Header
        type="back"
        title="Customer Details"
        customActions={[
          { icon: 'edit', label: 'Edit Customer', onClick: () => navigate(`/customers/edit/${id}`) },
          { icon: 'delete', label: 'Delete Customer', onClick: () => deleteCustomer(id), className: 'outlined', color: 'var(--danger)' },
        ]}
      />

      {/* PROFILE */}
      <div className={styles.profileSection}>
        <div className={styles.leftColumn}>
          <div className={styles.avatar}>
            {customer.photo
              ? <img src={customer.photo} className={styles.avatarImg} />
              : initials}
          </div>
          {birthday && <div className={styles.birthday}>🎈 {birthday}</div>}
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.name}>
            {customer.name} {customer.sex && `(${customer.sex})`}
          </div>

          <div className={styles.meta}>
            <span className="mi">call</span>
            {customer.phone}
          </div>

          {customer.email && (
            <div className={styles.meta}>
              <span className="mi">mail_outline</span>
              {customer.email}
            </div>
          )}

          {customer.address && (
            <div className={styles.meta}>
              <span className="mi">place</span>
              {customer.address}
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.light}`}
          onClick={() => window.location = `tel:${customer.phone}`}
        >
          <span className="mi">call</span>
          Call
        </button>

        <button
          className={`${styles.btn} ${styles.light}`}
          onClick={() => window.location = `mailto:${customer.email}`}
        >
          <span className="mi">mail_outline</span>
          Email
        </button>

        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => setBodyPanelOpen(true)}
        >
          <span className="mi">straighten</span>
          Full Body Measurements
        </button>
      </div>

      {/* TABS */}
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

      {/* CONTENT */}
      <div className={styles.content}>
        {activeTab === 'dress' && (
          <MeasurementsTab
            {...data}
            showToast={showToast}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            {...data}
            showToast={showToast}
          />
        )}

        {activeTab === 'invoice' && (
          <InvoiceTab
            {...data}
            customer={customer}
            showToast={showToast}
          />
        )}
      </div>

      {/* ✅ FIXED FAB */}
      {(activeTab === 'dress' || activeTab === 'orders') && (
        <button
          className={styles.fab}
          onClick={() => {
            if (activeTab === 'dress') {
              document.dispatchEvent(new CustomEvent('openMeasureModal'))
            }
            if (activeTab === 'orders') {
              document.dispatchEvent(new CustomEvent('openOrderModal'))
            }
          }}
        >
          <span className="mi">add</span>
        </button>
      )}

      <Toast message={toastMsg} />
    </div>
  )
}