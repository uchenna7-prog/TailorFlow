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
  const [month, day] = birthday.split('-').map(Number)
  const isToday = today.getMonth() + 1 === month && today.getDate() === day
  const d = new Date(2000, month - 1, day)
  const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return { label: isToday ? '🎂 Happy Birthday!' : `Birthday: ${label}`, isToday }
}

const TABS = [
  { id: 'dress',   label: ['Dress', 'Measurements'] },
  { id: 'orders',  label: ['Orders'] },
  { id: 'invoice', label: ['Invoice'] },
]

// ── BODY MEASUREMENTS PANEL ──
function BodyPanel({ customer, onClose }) {
  const body = customer.bodyMeasurements || {}
  const entries = Object.entries(body).filter(([, v]) => v !== '' && v !== undefined)

  return (
    <div className={styles.bodyPanelOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.bodyPanel}>
        <div className={styles.bodyPanelHandle} />
        <div className={styles.bodyPanelHeader}>
          <div className={styles.bodyPanelTitle}>Body Measurements</div>
          <button className={styles.bodyPanelClose} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>
        {customer.sex && (
          <div className={styles.bodyPanelSex}>
            {customer.sex === 'Male' ? '♂' : '♀'} {customer.sex}
          </div>
        )}
        <div className={styles.bodyPanelBody}>
          {entries.length === 0 ? (
            <div className={styles.bodyPanelEmpty}>
              <span style={{ fontSize: '2.5rem', opacity: 0.2 }}>📏</span>
              <p>No body measurements recorded.</p>
              <span>Add them when editing the client.</span>
            </div>
          ) : (
            entries.map(([field, value]) => (
              <div key={field} className={styles.bodyRow}>
                <span className={styles.bodyLabel}>{field}</span>
                <span className={styles.bodyValue}>{value}"</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function CustomerDetail({ onMenuClick }) {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { getCustomer, deleteCustomer } = useCustomers()
  const data       = useCustomerData(id)

  const [activeTab, setActiveTab]         = useState('dress')
  const [bodyPanelOpen, setBodyPanelOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toastMsg, setToastMsg]           = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

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
  const hasBody   = customer.bodyMeasurements && Object.keys(customer.bodyMeasurements).length > 0

  const handleDeleteCustomer = () => {
    deleteCustomer(id)
    navigate('/customers')
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.fixedTop} id="topHeader">
        {/* Profile row */}
        <div className={styles.profileArea}>
          <button className={styles.contactBtn} onClick={() => customer.email && (window.location = `mailto:${customer.email}`)}>
            <span className="mi">mail_outline</span>
          </button>
          <div className={styles.centralAvatar}>
            {customer.photo
              ? <img src={customer.photo} alt={customer.name} className={styles.avatarImg} />
              : initials
            }
          </div>
          <button className={styles.contactBtn} onClick={() => customer.phone && (window.location = `tel:${customer.phone}`)}>
            <span className="mi">call</span>
          </button>
        </div>

        {/* Name, phone, location, birthday */}
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
          {/* Body measurements button */}
          <button className={`${styles.bodyBtn} ${hasBody ? styles.bodyBtnHas : ''}`} onClick={() => setBodyPanelOpen(true)}>
            <span className="mi" style={{ fontSize: '1rem' }}>straighten</span>
            Body Measurements
            {hasBody && <span className={styles.bodyBtnDot} />}
          </button>
        </div>

        {/* Tabs — all three on one line, no scroll */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label.map((line, i) => (
                <span key={i} style={{ display: 'block', lineHeight: 1.2 }}>{line}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
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
            invoices={data.invoices}
            orders={data.orders}
            measurements={data.measurements}
            customer={customer}
            onSave={data.saveInvoice}
            onDelete={data.deleteInvoice}
            onStatusChange={data.updateInvoiceStatus}
            onNavigateToInvoice={() => setActiveTab('invoice')}
            showToast={showToast}
          />
        )}
      </div>

      {/* FAB — only on dress and orders tabs */}
      {(activeTab === 'dress' || activeTab === 'orders') && (
        <button
          className={styles.fab}
          onClick={() => {
            if (activeTab === 'dress')  document.dispatchEvent(new CustomEvent('openMeasureModal'))
            if (activeTab === 'orders') document.dispatchEvent(new CustomEvent('openOrderModal'))
          }}
        >
          <span className="mi">add</span>
        </button>
      )}

      {/* Body measurements panel */}
      {bodyPanelOpen && (
        <BodyPanel customer={customer} onClose={() => setBodyPanelOpen(false)} />
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
