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
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getBirthdayBadge(birthday) {
  if (!birthday) return null
  const today = new Date()
  const bday  = new Date(birthday + 'T00:00:00')
  const isToday = today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()
  const label = bday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return { label: isToday ? '🎂 Happy Birthday!' : `Birthday: ${label}`, isToday }
}

const TABS = ['Measurements', 'Orders', 'Invoice']

export default function CustomerDetail({ onMenuClick }) {
  // ── ALL hooks at the top — before any conditional return ──
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { getCustomer, deleteCustomer } = useCustomers()
  const data       = useCustomerData(id)

  const [activeTab, setActiveTab]         = useState('Measurements')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toastMsg, setToastMsg]           = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── Derive after hooks ──
  const customer = getCustomer(id)

  if (!customer) {
    return (
      <div className={styles.notFound}>
        <p>Customer not found.</p>
        <button onClick={() => navigate('/customers')}>Back to Clients</button>
      </div>
    )
  }

  const initials  = getInitials(customer.name)
  const bdayBadge = getBirthdayBadge(customer.birthday)

  const handleDeleteCustomer = () => {
    deleteCustomer(id)
    navigate('/customers')
  }

  return (
    <div className={styles.page}>

      <Header onMenuClick={onMenuClick} />

      {/* Profile header */}
      <div className={styles.fixedTop} id="topHeader">
        <div className={styles.profileArea}>
          <button
            className={styles.contactBtn}
            onClick={() => { if (customer.email) window.location = `mailto:${customer.email}` }}
          >
            <span className="mi">mail_outline</span>
          </button>

          <div className={styles.centralAvatar}>
            {customer.photo
              ? <img src={customer.photo} alt={customer.name} className={styles.avatarImg} />
              : initials
            }
          </div>

          <button
            className={styles.contactBtn}
            onClick={() => { if (customer.phone) window.location = `tel:${customer.phone}` }}
          >
            <span className="mi">call</span>
          </button>
        </div>

        <div className={styles.heroText}>
          <h2>{customer.name}</h2>
          <div className={styles.phone}>{customer.phone}</div>
          {customer.address && (
            <div className={styles.location}>
              <span className="mi">place</span>
              {customer.address}
            </div>
          )}
          {bdayBadge && (
            <div className={`${styles.bday} ${bdayBadge.isToday ? styles.bdayToday : ''}`}>
              <span>🎂</span>
              <span>{bdayBadge.label}</span>
            </div>
          )}
        </div>

        <div className={styles.tabs}>
          {TABS.map(tab => (
            <div
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className={styles.scrollContent}>
        {activeTab === 'Measurements' && (
          <MeasurementsTab
            measurements={data.measurements}
            onSave={data.saveMeasurement}
            onDelete={data.deleteMeasurement}
            showToast={showToast}
          />
        )}
        {activeTab === 'Orders' && (
          <OrdersTab
            orders={data.orders}
            measurements={data.measurements}
            onSave={data.saveOrder}
            onDelete={data.deleteOrder}
            onStatusChange={data.updateOrderStatus}
            showToast={showToast}
          />
        )}
        {activeTab === 'Invoice' && (
          <InvoiceTab
            invoices={data.invoices}
            orders={data.orders}
            measurements={data.measurements}
            customer={customer}
            onSave={data.saveInvoice}
            onDelete={data.deleteInvoice}
            onStatusChange={data.updateInvoiceStatus}
            onNavigateToInvoice={() => setActiveTab('Invoice')}
            showToast={showToast}
          />
        )}
      </div>

      {/* FAB */}
      {activeTab !== 'Invoice' && (
        <button
          className={styles.fab}
          onClick={() => {
            if (activeTab === 'Measurements') document.dispatchEvent(new CustomEvent('openMeasureModal'))
            if (activeTab === 'Orders')       document.dispatchEvent(new CustomEvent('openOrderModal'))
          }}
        >
          <span className="mi">add</span>
        </button>
      )}

      <ConfirmSheet
        open={deleteConfirm}
        title="Delete Customer?"
        message={`"${customer.name}" and all their data will be permanently removed.`}
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteConfirm(false)}
      />

      <Toast message={toastMsg} />
    </div>
  )
}
