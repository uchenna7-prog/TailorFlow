import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { usePremium }   from '../../contexts/PremiumContext'
import Header from '../../components/Header/Header'
import styles from './Customers.module.css'

// ── Male measurement image imports ────────────────────────────
import aboveKneeMaleImg       from '../../assets/aboveKneeMale.jpg'
import ankleMaleImg           from '../../assets/ankleMale.jpg'
import armHoleMaleImg         from '../../assets/armHoleMale.jpg'
import armLengthMaleImg       from '../../assets/armLengthMale.jpg'
import belowKneeMaleImg       from '../../assets/belowKneeMale.jpg'
import bicepsMaleImg          from '../../assets/bicepsMale.jpg'
import calfMaleImg            from '../../assets/calfMale.jpg'
import calfToAnkleMaleImg     from '../../assets/calfToAnkleMale.jpg'
import chestMaleImg           from '../../assets/chestMale.jpg'
import coatSleeveLengthMaleImg from '../../assets/coatSleeveLengthMale.jpg'
import coatWaistMaleImg       from '../../assets/coatWaistMale.jpg'
import crossBackMaleImg       from '../../assets/crossBackMale.jpg'
import crotchMaleImg          from '../../assets/crotchMale.jpg'
import crotchToKneeMaleImg    from '../../assets/crotchToKneeMale.jpg'
import flyMaleImg             from '../../assets/flyMale.jpg'
import halfShoulderMaleImg    from '../../assets/halfShoulderMale.jpg'
import hipMaleImg             from '../../assets/hipMale.jpg'
import inseamMaleImg          from '../../assets/inseamMale.jpg'
import jacketLengthMaleImg    from '../../assets/jacketLengthMale.jpg'
import kneeToCalfMaleImg      from '../../assets/kneeToCalfMale.jpg'
import neckMaleImg            from '../../assets/neckMale.jpg'
import pantsLengthMaleImg     from '../../assets/pantsLengthMale.jpg'
import seatMaleImg            from '../../assets/seatMale.jpg'
import shirtLengthMaleImg     from '../../assets/shirtLengthMale.jpg'
import shortsLengthMaleImg    from '../../assets/shortsLengthMale.jpg'
import shoulderWidthMaleImg   from '../../assets/shoulderWidthMale.jpg'
import sleeveLengthForSuitMaleImg from '../../assets/sleeveLengthForSuitMale.jpg'
import sleeveLengthMaleImg    from '../../assets/sleeveLengthMale.jpg'
import thighsMaleImg          from '../../assets/thighsMale.jpg'
import waistMaleImg           from '../../assets/waistMale.jpg'
import waistToAnkleMaleImg    from '../../assets/waistToAnkleMale.jpg'
import wristMaleImg           from '../../assets/wristMale.jpg'

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getBirthdayStr(birthday) {
  if (!birthday) return ''
  const today = new Date()
  const [month, day] = birthday.split('-').map(Number)
  if (today.getMonth() + 1 === month && today.getDate() === day) return '🎂 Today!'
  const d = new Date(2000, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Toast({ message }) {
  return <div className={`${styles.toast} ${message ? styles.toastShow : ''}`}>{message}</div>
}

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

// ── Premium Gate Bottom Sheet ─────────────────────────────────
function PremiumSheet({ onClose }) {
  return (
    <div className={styles.confirmOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.confirmSheet}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>workspace_premium</span>
        </div>
        <h4 style={{ textAlign: 'center' }}>Premium Feature</h4>
        <p style={{ textAlign: 'center' }}>
          Uploading client profile photos is a Premium feature. Upgrade to TailorFlow Pro to unlock photo uploads, branded invoices, and more.
        </p>
        <div className={styles.confirmActions}>
          <button
            className={styles.btnConfirmDel}
            style={{ background: 'var(--accent)' }}
            onClick={onClose}
          >
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>workspace_premium</span>
            Upgrade to Pro
          </button>
          <button className={styles.btnConfirmCancel} onClick={onClose}>Maybe Later</button>
        </div>
      </div>
    </div>
  )
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const MALE_MEASUREMENTS = [
  'Neck', 'Shoulder Width', 'Half Shoulder', 'Chest', 'Cross Back',
  'Waist', 'Hip', 'Seat', 'Shirt Length', 'Sleeve Length', 'Arm Length',
  'Arm Hole', 'Biceps', 'Wrist', 'Thighs', 'Crotch', 'Crotch To Knee',
  'Above Knee', 'Below Knee', 'Knee To Calf', 'Calf', 'Calf To Ankle',
  'Ankle', 'Waist To Ankle', 'Inseam', 'Pants Length', 'Shorts Length',
  'Fly', 'Jacket Length', 'Coat Sleeve', 'Coat Waist'
]

const MALE_MEASUREMENT_IMAGES = {
  'Neck':            neckMaleImg,
  'Shoulder Width':  shoulderWidthMaleImg,
  'Half Shoulder':   halfShoulderMaleImg,
  'Chest':           chestMaleImg,
  'Cross Back':      crossBackMaleImg,
  'Waist':           waistMaleImg,
  'Hip':             hipMaleImg,
  'Seat':            seatMaleImg,
  'Shirt Length':    shirtLengthMaleImg,
  'Sleeve Length':   sleeveLengthMaleImg,
  'Arm Length':      armLengthMaleImg,
  'Arm Hole':        armHoleMaleImg,
  'Biceps':          bicepsMaleImg,
  'Wrist':           wristMaleImg,
  'Thighs':          thighsMaleImg,
  'Crotch':          crotchMaleImg,
  'Crotch To Knee':  crotchToKneeMaleImg,
  'Above Knee':      aboveKneeMaleImg,
  'Below Knee':      belowKneeMaleImg,
  'Knee To Calf':    kneeToCalfMaleImg,
  'Calf':            calfMaleImg,
  'Calf To Ankle':   calfToAnkleMaleImg,
  'Ankle':           ankleMaleImg,
  'Waist To Ankle':  waistToAnkleMaleImg,
  'Inseam':          inseamMaleImg,
  'Pants Length':    pantsLengthMaleImg,
  'Shorts Length':   shortsLengthMaleImg,
  'Fly':             flyMaleImg,
  'Jacket Length':   jacketLengthMaleImg,
  'Coat Sleeve':     sleeveLengthForSuitMaleImg,
  'Coat Waist':      coatWaistMaleImg,
}

const FEMALE_MEASUREMENTS = [
  'Bust', 'Waist', 'Hip', 'Shoulder Width', 'Dress Length',
  'Sleeve Length', 'Neck', 'Thigh', 'Knee', 'Skirt Length',
  'Trouser Waist', 'Inseam', 'Blouse Length', 'Under Bust', 'Armhole'
]


function AddCustomerForm({ isOpen, onClose, onSave, isPremium }) {
  const [formTab, setFormTab]         = useState('personal')
  const [name, setName]               = useState('')
  const [phone, setPhone]             = useState('')
  const [phoneType, setPhoneType]     = useState('Mobile')
  const [sex, setSex]                 = useState('')
  const [bdayDay, setBdayDay]         = useState('')
  const [bdayMonth, setBdayMonth]     = useState('')
  const [email, setEmail]             = useState('')
  const [address, setAddress]         = useState('')
  const [notes, setNotes]             = useState('')
  const [photo, setPhoto]             = useState(null)
  const [showPremiumSheet, setShowPremiumSheet] = useState(false)
  const fileInputRef = useRef(null)

  const [bodyMeasurements, setBodyMeasurements] = useState({})
  const [customFields, setCustomFields]         = useState([])

  const initials      = getInitials(name) || '+'
  const measureFields = sex === 'Female' ? FEMALE_MEASUREMENTS : MALE_MEASUREMENTS

  const handlePhotoPicker = () => {
    if (!isPremium) { setShowPremiumSheet(true); return }
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const updateBodyMeasure = (field, val) => {
    setBodyMeasurements(prev => ({ ...prev, [field]: val }))
  }

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: Date.now(), label: '', value: '' }])
  }

  const updateCustomField = (id, key, val) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const handleClose = () => {
    setName(''); setPhone(''); setPhoneType('Mobile'); setSex('')
    setBdayDay(''); setBdayMonth(''); setEmail(''); setAddress('')
    setNotes(''); setPhoto(null); setBodyMeasurements({}); setCustomFields([]); setFormTab('personal')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSave = () => {
    const allBody = { ...bodyMeasurements }
    customFields.forEach(f => { if (f.label.trim()) allBody[f.label.trim()] = f.value })
    const birthday = bdayMonth && bdayDay ? `${bdayMonth}-${bdayDay}` : ''
    onSave({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements: allBody })
    handleClose()
  }

  return (
    <>
      <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlayOpen : ''}`}>
        <Header 
          type="back" 
          title="New Customer" 
          onBackClick={handleClose} 
          customActions={[
            { label: 'Save', onClick: handleSave, color: 'var(--accent)' }
          ]}
        />

        <div className={styles.formTabs}>
          <button className={`${styles.formTab} ${formTab === 'personal' ? styles.formTabActive : ''}`} onClick={() => setFormTab('personal')}>Personal Info</button>
          <button className={`${styles.formTab} ${formTab === 'body' ? styles.formTabActive : ''}`} onClick={() => setFormTab('body')}>Body Measurements</button>
        </div>

        <div className={styles.formBody}>
          {formTab === 'personal' && (
            <>
              <div className={styles.photoPicker} onClick={handlePhotoPicker} style={{ position: 'relative' }}>
                {photo
                  ? <img src={photo} alt="Profile" className={styles.photoPreview} />
                  : <div className={styles.photoInitials}>{initials}</div>
                }
                <div className={styles.camBadge}>
                  {isPremium
                    ? <span className="mi" style={{ fontSize:'0.9rem' }}>photo_camera</span>
                    : <span className="mi" style={{ fontSize:'0.9rem' }}>lock</span>
                  }
                </div>
                {isPremium && (
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Full Name *</label>
                <input type="text" className={styles.formInput} placeholder="e.g. Uchendu Daniel" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Sex</label>
                <div className={styles.sexRow}>
                  {['Male', 'Female'].map(s => (
                    <button key={s} className={`${styles.sexChip} ${sex === s ? styles.sexChipActive : ''}`} onClick={() => setSex(s)}>{s}</button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Birthday (Day & Month)</label>
                <div className={styles.inputRow}>
                  <select className={styles.formInput} value={bdayDay} onChange={e => setBdayDay(e.target.value)}>
                    <option value="">Day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className={styles.formInput} value={bdayMonth} onChange={e => setBdayMonth(e.target.value)}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Phone Number *</label>
                  <input type="tel" className={styles.formInput} placeholder="080xxxxxxxx" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Phone Type</label>
                  <select className={styles.formInput} value={phoneType} onChange={e => setPhoneType(e.target.value)}>
                    <option>Mobile</option><option>Home</option><option>Work</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email Address</label>
                <input type="email" className={styles.formInput} placeholder="Optional" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Address</label>
                <input type="text" className={styles.formInput} placeholder="Optional" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Notes</label>
                <input type="text" className={styles.formInput} placeholder="e.g. Prefers loose fits" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </>
          )}

          {formTab === 'body' && (
            <>
              {!sex && (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:'0.85rem' }}>
                  Please select a sex on the Personal Info tab first.
                </div>
              )}
              {sex && (
                <>
                  <p style={{ fontSize:'0.65rem', fontWeight:800, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
                    {sex === 'Female' ? 'Female' : 'Male'} body measurements (inches)
                  </p>
                  {measureFields.map((field, idx) => {
                    const imgSrc = sex === 'Male' ? MALE_MEASUREMENT_IMAGES[field] : null
                    const isLastImgField = sex === 'Male' && imgSrc &&
                      !measureFields.slice(idx + 1).some(f => MALE_MEASUREMENT_IMAGES[f])
                    if (imgSrc) {
                      return (
                        <div
                          key={field}
                          className={`${styles.measureImgRow} ${isLastImgField ? styles.measureImgRowLast : ''}`}
                        >
                          <img src={imgSrc} alt={field} className={styles.measureImg} />
                          <div className={styles.measureImgRight}>
                            <label className={styles.inputLabel}>{field}</label>
                            <input
                              type="number"
                              className={styles.formInput}
                              placeholder="0"
                              inputMode="decimal"
                              value={bodyMeasurements[field] || ''}
                              onChange={e => updateBodyMeasure(field, e.target.value)}
                            />
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={field} className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{field}</label>
                        <input
                          type="number"
                          className={styles.formInput}
                          placeholder="0"
                          inputMode="decimal"
                          value={bodyMeasurements[field] || ''}
                          onChange={e => updateBodyMeasure(field, e.target.value)}
                        />
                      </div>
                    )
                  })}
                  {customFields.map(f => (
                    <div key={f.id} className={styles.customFieldRow}>
                      <div className={styles.customFieldInputs}>
                        <input type="text" className={styles.formInput} placeholder="Field name" value={f.label} onChange={e => updateCustomField(f.id, 'label', e.target.value)} />
                        <input type="number" className={styles.formInput} placeholder="0" inputMode="decimal" value={f.value} onChange={e => updateCustomField(f.id, 'value', e.target.value)} />
                      </div>
                      <button className={styles.removeCustomBtn} onClick={() => removeCustomField(f.id)}>
                        <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
                      </button>
                    </div>
                  ))}
                  <button className={styles.addCustomFieldBtn} onClick={addCustomField}>
                    <span className="mi" style={{ fontSize: '1rem' }}>add</span> Add Custom Field
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showPremiumSheet && <PremiumSheet onClose={() => setShowPremiumSheet(false)} />}
    </>
  )
}

// ── Customer list item (list-style, same pattern as orders) ──
function CustomerCard({ customer, onDelete, onOpen, isLast }) {
  const initials = getInitials(customer.name)
  const bdayStr  = getBirthdayStr(customer.birthday)

  return (
    <div
      className={`${styles.custListItem} ${isLast ? styles.custListItemLast : ''}`}
      onClick={onOpen}
    >
      {/* Left: grey outer box with white inner box / avatar */}
      <div className={styles.custListOuter}>
        <div className={styles.custListInner}>
          {customer.photo
            ? <img src={customer.photo} alt={customer.name} className={styles.custListPhoto} />
            : <span className={styles.custListInitials}>{initials}</span>
          }
        </div>
      </div>

      {/* Info */}
      <div className={styles.custListInfo}>
        <div className={styles.custListName}>{customer.name}</div>
        {customer.phone && (
          <div className={styles.custListMeta}>{customer.phone}{bdayStr ? ` · ${bdayStr}` : ''}</div>
        )}
        {customer.email && (
          <div className={styles.custListMeta}>{customer.email}</div>
        )}
      </div>

      {/* Right: delete + chevron */}
      <div className={styles.custListActions}>
        <button
          className={styles.custDeleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(customer) }}
        >
          <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>delete_outline</span>
        </button>
        <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
      </div>
    </div>
  )
}

export default function Customers({ onMenuClick }) {
  const navigate = useNavigate()
  const { customers, addCustomer, deleteCustomer } = useCustomers()
  const { isPremium } = usePremium()

  const [query,        setQuery]        = useState('')
  const [formOpen,     setFormOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg,     setToastMsg]     = useState('')
  const [sortMode,     setSortMode]     = useState('date')   // 'date' | 'alpha'
  const [filterOpen,   setFilterOpen]   = useState(false)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  const handleSave = async ({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements }) => {
    if (!name)  { showToast('Name is required'); return }
    if (!phone) { showToast('Phone number is required'); return }
    const today = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    try {
      await addCustomer({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements, date: today })
      showToast(`${name} added ✓`)
    } catch (err) {
      showToast(`ERROR: ${err?.code || err?.message || String(err)}`)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    showToast(`${deleteTarget.name} deleted`)
    setDeleteTarget(null)
  }

  const filtered = query.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone && c.phone.includes(query)))
    : customers

  const sectionLabel = customers.length === 0 ? '' : filtered.length === customers.length
    ? 'All Clients'
    : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`

  // ── Build grouped list based on sort mode ──────────────────
  const grouped = (() => {
    if (sortMode === 'alpha') {
      // Sort A-Z, group by first letter
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      return sorted.reduce((acc, c) => {
        const key = c.name.trim()[0]?.toUpperCase() || '#'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    } else {
      // Sort newest first, group by date added
      const sorted = [...filtered].sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0)
        const db = b.date ? new Date(b.date) : new Date(0)
        return db - da
      })
      return sorted.reduce((acc, c) => {
        const key = c.date || 'Unknown Date'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    }
  })()

  const selectSort = (mode) => {
    setSortMode(mode)
    setFilterOpen(false)
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      {/* Search bar + filter button */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color:'var(--text3)', fontSize:'1.1rem' }}>search</span>
            <input type="text" placeholder="Search clients…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button
            className={`${styles.filterBtn} ${sortMode !== 'date' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(v => !v)}
          >
            <span className="mi" style={{ fontSize: '1.3rem' }}>tune</span>
          </button>
        </div>

        {/* Filter dropdown */}
        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Sort by</div>
            <button
              className={`${styles.filterOption} ${sortMode === 'date' ? styles.filterOptionActive : ''}`}
              onClick={() => selectSort('date')}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>calendar_today</span>
              <span>Date Added</span>
              {sortMode === 'date' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
            <button
              className={`${styles.filterOption} ${sortMode === 'alpha' ? styles.filterOptionActive : ''}`}
              onClick={() => selectSort('alpha')}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>sort_by_alpha</span>
              <span>Alphabetically (A–Z)</span>
              {sortMode === 'alpha' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
          </div>
        )}
      </div>

      {sectionLabel && <div className={styles.sectionLabel}>{sectionLabel}</div>}

      <div className={styles.scrollArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {customers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)' }}>person_outline</span></div>
            <p>No customer yet.</p>
            <span>Tap + to add your first customer</span>
          </div>
        )}
        {customers.length > 0 && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)' }}>search_off</span></div>
            <p>No matches found.</p>
            <span>Try a different name or number</span>
          </div>
        )}

        {Object.entries(grouped).map(([groupKey, groupCustomers]) => (
          <div key={groupKey} className={styles.custGroup}>
            <div className={styles.custGroupDate}>{groupKey}</div>
            <div className={styles.custGroupDivider} />

            {groupCustomers.map((c, idx) => (
              <CustomerCard
                key={c.id}
                customer={c}
                isLast={idx === groupCustomers.length - 1}
                onOpen={() => navigate(`/customers/${c.id}`)}
                onDelete={(cust) => setDeleteTarget(cust)}
              />
            ))}
          </div>
        ))}
      </div>

      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="mi">add</span>
      </button>

      <AddCustomerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        isPremium={isPremium}
      />

      <ConfirmSheet customer={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />

      <Toast message={toastMsg} />
    </div>
  )
}
