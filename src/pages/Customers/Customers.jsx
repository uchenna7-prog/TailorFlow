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

function getBirthdayStr(birthday) {
  if (!birthday) return ''
  const today = new Date()
  const bday = new Date(birthday + 'T00:00:00')
  if (
    today.getMonth() === bday.getMonth() &&
    today.getDate() === bday.getDate()
  ) {
    return '🎂 Today!'
  }
  return bday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function Toast({ message }) {
  return (
    <div className={`${styles.toast} ${message ? styles.toastShow : ''}`}>
      {message}
    </div>
  )
}

function ConfirmSheet({ customer, onConfirm, onCancel }) {
  if (!customer) return null

  return (
    <div
      className={styles.confirmOverlay}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.confirmSheet}>
        <h4>Delete Client?</h4>
        <p>"{customer.name}" will be permanently removed.</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnConfirmDel} onClick={onConfirm}>
            Delete
          </button>
          <button className={styles.btnConfirmCancel} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function MeasurementField({ label, icon, value, onChange }) {
  return (
    <div className={styles.measureCard}>
      <div className={styles.measureIcon}>
        <span className="mi">{icon}</span>
      </div>

      <div className={styles.measureContent}>
        <label>{label}</label>
        <input
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function AddCustomerForm({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('Personal Details')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneType, setPhoneType] = useState('Mobile')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState(null)

  const [measurements, setMeasurements] = useState({
    shortsLength: '',
    aboveKnee: '',
    belowKnee: '',
    crotchToKnee: '',
    kneeToCalf: '',
    calf: '',
  })

  const fileInputRef = useRef(null)
  const initials = getInitials(name) || '+'

  const handleMeasurementChange = (key, value) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleClose = () => {
    setName('')
    setPhone('')
    setPhoneType('Mobile')
    setEmail('')
    setAddress('')
    setBirthday('')
    setNotes('')
    setPhoto(null)
    setMeasurements({
      shortsLength: '',
      aboveKnee: '',
      belowKnee: '',
      crotchToKnee: '',
      kneeToCalf: '',
      calf: '',
    })
    setActiveTab('Personal Details')
    onClose()
  }

  const handleSave = () => {
    onSave({
      name,
      phone,
      phoneType,
      email,
      address,
      birthday,
      notes,
      photo,
      measurements,
    })
  }

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlayOpen : ''}`}>
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={handleClose}>
          <span className="mi">arrow_back</span>
        </button>

        <div className={styles.formHeaderTitle}>New Client</div>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.modalTabs}>
        {['Personal Details', 'Body Measurement'].map((tab) => (
          <button
            key={tab}
            className={`${styles.modalTab} ${
              activeTab === tab ? styles.modalTabActive : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.formBody}>
        {activeTab === 'Personal Details' && (
          <>
            <div
              className={styles.photoPicker}
              onClick={() => fileInputRef.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="Profile" className={styles.photoPreview} />
              ) : (
                <div className={styles.photoInitials}>{initials}</div>
              )}

              <div className={styles.camBadge}>
                <span className="mi">photo_camera</span>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Phone *</label>
              <input
                type="tel"
                className={styles.formInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </>
        )}

        {activeTab === 'Body Measurement' && (
          <div className={styles.measureGrid}>
            <MeasurementField
              label="Shorts Length"
              icon="straighten"
              value={measurements.shortsLength}
              onChange={(v) => handleMeasurementChange('shortsLength', v)}
            />
            <MeasurementField
              label="Above Knee"
              icon="height"
              value={measurements.aboveKnee}
              onChange={(v) => handleMeasurementChange('aboveKnee', v)}
            />
            <MeasurementField
              label="Below Knee"
              icon="height"
              value={measurements.belowKnee}
              onChange={(v) => handleMeasurementChange('belowKnee', v)}
            />
            <MeasurementField
              label="Crotch to Knee"
              icon="straighten"
              value={measurements.crotchToKnee}
              onChange={(v) => handleMeasurementChange('crotchToKnee', v)}
            />
            <MeasurementField
              label="Knee to Calf"
              icon="straighten"
              value={measurements.kneeToCalf}
              onChange={(v) => handleMeasurementChange('kneeToCalf', v)}
            />
            <MeasurementField
              label="Calf"
              icon="radio_button_checked"
              value={measurements.calf}
              onChange={(v) => handleMeasurementChange('calf', v)}
            />
          </div>
        )}
      </div>

      <div className={styles.formSaveBar}>
        <button className={styles.btnSave} onClick={handleSave}>
          Add Client
        </button>
      </div>
    </div>
  )
}

export default function Customers({ onMenuClick }) {
  const navigate = useNavigate()
  const { customers, addCustomer, deleteCustomer } = useCustomers()

  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  const handleSave = (customerData) => {
    if (!customerData.name) return showToast('Name is required')
    if (!customerData.phone) return showToast('Phone is required')

    addCustomer({
      ...customerData,
      id: Date.now(),
    })

    setFormOpen(false)
    showToast(`${customerData.name} added ✓`)
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="mi">add</span>
      </button>

      <AddCustomerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <Toast message={toastMsg} />
    </div>
  )
}