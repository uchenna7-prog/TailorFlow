import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import styles from './Customers.module.css'

// ── HELPERS ──
function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getBirthdayStr(birthday) {
  if (!birthday) return ''
  const today = new Date()
  const bday = new Date(birthday + 'T00:00:00')
  if (today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()) {
    return '🎂 Today!'
  }
  return bday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── TOAST (self-contained) ──
function Toast({ message }) {
  return (
    <div className={`${styles.toast} ${message ? styles.toastShow : ''}`}>
      {message}
    </div>
  )
}

// ── CONFIRM DELETE SHEET ──
function ConfirmSheet({ customer, onConfirm, onCancel }) {
  if (!customer) return null
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

// ── ADD CUSTOMER FORM ──
function AddCustomerForm({ isOpen, onClose, onSave }) {
  const [name, setName]           = useState('')
  const [phone, setPhone]         = useState('')
  const [phoneType, setPhoneType] = useState('Mobile')
  const [email, setEmail]         = useState('')
  const [address, setAddress]     = useState('')
  const [birthday, setBirthday]   = useState('')
  const [notes, setNotes]         = useState('')
  const [photo, setPhoto]         = useState(null)   // base64 string
  const fileInputRef = useRef(null)

  const initials = getInitials(name) || '+'

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleClose = () => {
    // reset all fields
    setName(''); setPhone(''); setPhoneType('Mobile')
    setEmail(''); setAddress(''); setBirthday('')
    setNotes(''); setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSave = () => {
    onSave({ name, phone, phoneType, email, address, birthday, notes, photo })
  }

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlayOpen : ''}`}>
      <div className={styles.formHeader}>
        <button
          className="mi"
          onClick={handleClose}
          style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.8rem', cursor: 'pointer' }}
        >
          arrow_back
        </button>
        <div className={styles.formHeaderTitle}>New Client</div>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.formBody}>
        {/* Photo picker */}
        <div className={styles.photoPicker} onClick={() => fileInputRef.current?.click()}>
          {photo ? (
            <img src={photo} alt="Profile" className={styles.photoPreview} />
          ) : (
            <div className={styles.photoInitials}>{initials}</div>
          )}
          <div className={styles.camBadge}>
            <span className="mi" style={{ fontSize: '0.9rem' }}>photo_camera</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoChange}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Full Name *</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="e.g. Uchendu Daniel"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Phone Number *</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="080xxxxxxxx"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Phone Type</label>
            <select
              className={styles.formInput}
              value={phoneType}
              onChange={(e) => setPhoneType(e.target.value)}
            >
              <option>Mobile</option>
              <option>Home</option>
              <option>Work</option>
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Email Address</label>
          <input
            type="email"
            className={styles.formInput}
            placeholder="Optional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Address</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="Optional"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Birthday</label>
          <input
            type="date"
            className={styles.formInput}
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Notes</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="e.g. Prefers loose fits"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formSaveBar}>
        <button className={styles.btnSave} onClick={handleSave}>Add Client</button>
      </div>
    </div>
  )
}

// ── CUSTOMER CARD ──
function CustomerCard({ customer, onDelete, onOpen, index }) {
  const initials = getInitials(customer.name)
  const bdayStr  = getBirthdayStr(customer.birthday)

  return (
    <div
      className={styles.customerCard}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Avatar — click navigates to detail */}
      <div className={styles.custAvatar} onClick={onOpen}>
        {customer.photo ? (
          <img
            src={customer.photo}
            alt={customer.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }}
          />
        ) : (
          initials
        )}
      </div>

      {/* Info — click navigates */}
      <div className={styles.custInfo} onClick={onOpen}>
        <div className={styles.custName}>{customer.name}</div>
        <div className={styles.custMeta}>
          {customer.phone}{bdayStr ? ` · ${bdayStr}` : ''}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.custRight}>
        <button
          className={styles.custDeleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(customer) }}
          title="Delete"
        >
          <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>
            delete_outline
          </span>
        </button>
        <span
          className="mi"
          style={{ color: 'var(--text3)', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={onOpen}
        >
          chevron_right
        </span>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function Customers({ onMenuClick }) {
  const navigate = useNavigate()
  const { customers, addCustomer, deleteCustomer } = useCustomers()

  const [query, setQuery]                 = useState('')
  const [formOpen, setFormOpen]           = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [toastMsg, setToastMsg]           = useState('')
  const toastTimer = useRef(null)

  // ── TOAST helper ──
  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  const handleSave = ({ name, phone, phoneType, email, address, birthday, notes, photo }) => {
    if (!name)  { showToast('Name is required');         return }
    if (!phone) { showToast('Phone number is required'); return }
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const customer = { id: Date.now(), name, phone, phoneType, email, address, birthday, notes, photo, date: today }
    addCustomer(customer)
    setFormOpen(false)
    showToast(`${name} added ✓`)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    showToast(`${deleteTarget.name} deleted`)
    setDeleteTarget(null)
  }

  // ── FILTER ──
  const filtered = query.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.phone && c.phone.includes(query))
      )
    : customers

  const sectionLabel = customers.length === 0
    ? ''
    : filtered.length === customers.length
      ? 'All Clients'
      : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      {/* Search */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
          <input
            type="text"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Section label */}
      {sectionLabel && (
        <div className={styles.sectionLabel}>{sectionLabel}</div>
      )}

      {/* List */}
      <div className={styles.scrollArea}>
        {customers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <p>No clients yet.</p>
            <span>Tap + to add your first client</span>
          </div>
        )}

        {customers.length > 0 && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <p>No matches found.</p>
            <span>Try a different name or number</span>
          </div>
        )}

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

      {/* FAB */}
      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="mi">add</span>
      </button>

      {/* Add customer form */}
      <AddCustomerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {/* Confirm delete sheet */}
      <ConfirmSheet
        customer={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast */}
      <Toast message={toastMsg} />
    </div>
  )
}
