import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import styles from './Customers.module.css'

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── CONFIRM DELETE SHEET (SAFE VERSION) ──
function ConfirmSheet({ customer, onConfirm, onCancel }) {
  // If no customer is selected, render nothing. This prevents the .id crash.
  if (!customer) return null;

  return (
    <div className={styles.confirmOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmSheet}>
        <h4>Delete Client?</h4>
        <p>"{customer.name}" will be permanently removed.</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnConfirmDel} onClick={onConfirm}>Delete</button>
          <button className={styles.btnConfirmCancel} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ... Keep AddCustomerForm and CustomerCard as they were ...

export default function Customers({ onMenuClick }) {
  const navigate = useNavigate()
  const { customers, addCustomer, deleteCustomer } = useCustomers()

  const [query, setQuery]                 = useState('')
  const [formOpen, setFormOpen]           = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [toastMsg, setToastMsg]           = useState('')
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    showToast(`${deleteTarget.name} deleted`)
    setDeleteTarget(null)
  }

  // ... Filter logic remains the same ...
  const filtered = query.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.phone && c.phone.includes(query))
      )
    : customers

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />
      {/* ... Search bar and list rendering ... */}
      
      <div className={styles.scrollArea}>
        {filtered.map((c, i) => (
          <CustomerCard
            key={c.id}
            customer={c}
            index={i}
            onOpen={() => navigate(`/customers/${c.id}`)}
            onDelete={(customer) => setDeleteTarget(customer)}
          />
        ))}
      </div>

      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="mi">add</span>
      </button>

      <ConfirmSheet
        customer={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* AddCustomerForm and Toast... */}
    </div>
  )
}
