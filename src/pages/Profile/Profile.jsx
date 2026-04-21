// src/pages/Profile/Profile.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../firebase'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import BrandColourPicker from '../../components/BrandColourPicker/BrandColourPicker'
import { getColourById, DEFAULT_COLOUR_ID } from '../../config/brandPalette'
import styles from './Profile.module.css'

// ─────────────────────────────────────────────────────────────
// Nigerian States
// ─────────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

// ─────────────────────────────────────────────────────────────
// Country Code Picker (from Signup)
// ─────────────────────────────────────────────────────────────

const DEFAULT_COUNTRY = { name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' }

function CountryCodePicker({ selected, onSelect }) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [countries, setCountries] = useState([])
  const [loading, setLoading]     = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!open || countries.length > 0) return
    setLoading(true)
    fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2')
      .then(r => r.json())
      .then(data => {
        const list = []
        data.forEach(c => {
          const root   = c.idd?.root || ''
          const suffix = c.idd?.suffixes
          if (!root) return
          const suffixes = Array.isArray(suffix) && suffix.length === 1 ? suffix : (suffix || [''])
          suffixes.forEach(s => {
            list.push({ name: c.name?.common || '', dial_code: root + s, flag: c.flag || '', cca2: c.cca2 || '' })
          })
        })
        list.sort((a, b) => a.name.localeCompare(b.name))
        setCountries(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, countries.length])

  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search.trim()
    ? countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial_code.includes(search))
    : countries

  const handleSelect = country => { onSelect(country); setOpen(false); setSearch('') }

  return (
    <div className={styles.ccPickerWrap} ref={dropdownRef}>
      <button type="button" className={styles.ccBtn} onClick={() => setOpen(v => !v)}>
        <span className={styles.ccFlag}>{selected.flag}</span>
        <span className={styles.ccCode}>{selected.dial_code}</span>
        <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>expand_more</span>
      </button>
      {open && (
        <div className={styles.ccDropdown}>
          <div className={styles.ccSearchWrap}>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>search</span>
            <input
              autoFocus
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.ccSearchInput}
            />
          </div>
          <div className={styles.ccList}>
            {loading && <div className={styles.ccListEmpty}>Loading countries…</div>}
            {!loading && filtered.length === 0 && <div className={styles.ccListEmpty}>No results</div>}
            {!loading && filtered.map((c, i) => (
              <button
                key={`${c.cca2}-${c.dial_code}-${i}`}
                type="button"
                className={`${styles.ccOption} ${selected.dial_code === c.dial_code && selected.name === c.name ? styles.ccOptionActive : ''}`}
                onClick={() => handleSelect(c)}
              >
                <span className={styles.ccFlag}>{c.flag}</span>
                <span className={styles.ccOptionName}>{c.name}</span>
                <span className={styles.ccOptionCode}>{c.dial_code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Phone helpers (from Signup)
// ─────────────────────────────────────────────────────────────

function buildPhoneNumber(localNumber, dialCode) {
  const digits = localNumber.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) return `${dialCode} ${digits.slice(1)}`
  if (digits.length === 10) return `${dialCode} ${digits}`
  return null
}

function getPhoneHint(localNumber) {
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith('0')) return { ok: true,  msg: 'Leading 0 will be removed when saving' }
  if (digits.length === 10)                            return { ok: true,  msg: 'Valid' }
  if (digits.length > 11)                              return { ok: false, msg: 'Too many digits' }
  if (digits.length === 11 && !digits.startsWith('0')) return { ok: false, msg: '11-digit numbers must start with 0' }
  return { ok: false, msg: `${10 - digits.length} more digit${10 - digits.length !== 1 ? 's' : ''} needed` }
}

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
    </div>
  )
}

function InfoRow({ icon, label, value, placeholder, divider = true }) {
  return (
    <div className={`${styles.row} ${!divider ? styles.noDivider : ''}`}>
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.15rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        <div className={value ? styles.rowValue : styles.rowPlaceholder}>
          {value || placeholder}
        </div>
      </div>
    </div>
  )
}

function TappableRow({ icon, label, sub, value, onClick, chevron = true, divider = true, danger = false }) {
  return (
    <div
      className={`${styles.row} ${styles.rowTappable} ${!divider ? styles.noDivider : ''}`}
      onClick={onClick}
    >
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.15rem', color: danger ? '#ef4444' : undefined }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={`${styles.rowLabel} ${danger ? styles.rowLabelDanger : ''}`}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {value && <span className={styles.rowBadge}>{value}</span>}
        {chevron && <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>chevron_right</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Full-screen slide-in modal shell
// ─────────────────────────────────────────────────────────────

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={styles.fullOverlay}>
      <Header
        type="back"
        title={title}
        onBackClick={onBack}
        customActions={onSave ? [{ label: 'Save', onClick: onSave }] : []}
      />
      <div className={styles.fullContent}>
        <div className={styles.fullContentInner}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────

function FieldGroup({ children }) {
  return <div className={styles.fieldGroup}>{children}</div>
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
      <div className={styles.fieldControl}>{children}</div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      className={styles.textInput}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className={styles.textarea}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

// Phone field with country code picker
function PhoneField({ label, hint, localValue, onLocalChange, country, onCountryChange }) {
  const phoneHint = getPhoneHint(localValue)
  return (
    <Field label={label} hint={hint}>
      <div className={styles.phoneRow}>
        <CountryCodePicker selected={country} onSelect={onCountryChange} />
        <input
          type="tel"
          inputMode="numeric"
          className={styles.textInput}
          style={{ flex: 1 }}
          placeholder="e.g. 09078117654"
          value={localValue}
          onChange={e => onLocalChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      {phoneHint && (
        <p className={styles.phoneHint} style={{ color: phoneHint.ok ? 'var(--accent)' : '#ef4444' }}>
          {phoneHint.msg}
        </p>
      )}
    </Field>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Edit Personal Info
// ─────────────────────────────────────────────────────────────

const PERSONAL_KEY = 'tailorflow_personal'

function loadPersonal(authUser) {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY)
    const stored = raw ? JSON.parse(raw) : {}
    return {
      fullName: stored.fullName || authUser?.displayName || '',
      email:    stored.email    || authUser?.email       || '',
      phone:    stored.phone    || '',
      city:     stored.city     || '',
      country:  stored.country  || '',
    }
  } catch {
    return {
      fullName: authUser?.displayName || '',
      email:    authUser?.email       || '',
      phone:    '',
      city:     '',
      country:  '',
    }
  }
}

function savePersonal(data) {
  try { localStorage.setItem(PERSONAL_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

// Parse a stored phone string back into local + country for editing
function parseStoredPhone(stored) {
  if (!stored) return { local: '', country: DEFAULT_COUNTRY }
  // Format: "+234 8012345678" → dial_code="+234", local="08012345678"
  const match = stored.match(/^(\+\d+)\s+(.+)$/)
  if (match) {
    return {
      local: '0' + match[2].replace(/\D/g, ''),
      country: { ...DEFAULT_COUNTRY, dial_code: match[1] },
    }
  }
  return { local: stored, country: DEFAULT_COUNTRY }
}

function PersonalModal({ personal, onBack, onSave, authUser }) {
  const parsed = parseStoredPhone(personal.phone)
  const [local, setLocal] = useState({
    fullName: personal.fullName || '',
    email:    personal.email    || '',
    city:     personal.city     || '',
    country:  personal.country  || '',
  })
  const [phoneLocal,   setPhoneLocal]   = useState(parsed.local)
  const [phoneCountry, setPhoneCountry] = useState(parsed.country)

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    const builtPhone = buildPhoneNumber(phoneLocal, phoneCountry.dial_code) || phoneLocal
    const updated = { ...personal, ...local, phone: builtPhone }
    savePersonal(updated)
    if (authUser && local.fullName && local.fullName !== authUser.displayName) {
      try { await updateProfile(authUser, { displayName: local.fullName.trim() }) } catch { /* ignore */ }
    }
    onSave(updated)
    onBack()
  }

  return (
    <FullModal title="Personal Info" onBack={onBack} onSave={handleSave}>
      <FieldGroup>
        <Field label="Full Name">
          <TextInput value={local.fullName} onChange={set('fullName')} placeholder="e.g. Amara Okonkwo" />
        </Field>
        <Field label="Email Address">
          <TextInput value={local.email} onChange={set('email')} placeholder="you@email.com" type="email" />
        </Field>
        <PhoneField
          label="Phone Number"
          localValue={phoneLocal}
          onLocalChange={setPhoneLocal}
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
        />
      </FieldGroup>
      <FieldGroup>
        <Field label="City">
          <TextInput value={local.city} onChange={set('city')} placeholder="e.g. Lagos" />
        </Field>
        <Field label="Country">
          <TextInput value={local.country} onChange={set('country')} placeholder="e.g. Nigeria" />
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Brand Identity
// ─────────────────────────────────────────────────────────────

function BrandModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()
  const { user } = useAuth()
  const logoInputRef = useRef()
  const [logoUploading, setLogoUploading] = useState(false)

  const [local, setLocal] = useState({
    brandName:              settings.brandName              || '',
    brandTagline:           settings.brandTagline           || '',
    brandColourId:          (settings.brandColourId && !settings.brandColourId.startsWith('#'))
                              ? settings.brandColourId
                              : DEFAULT_COLOUR_ID,
    brandLogo:              settings.brandLogo              || null,
    brandMilestone:         settings.brandMilestone         || '',
    brandFeaturedTechnique: settings.brandFeaturedTechnique || '',
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const handleLogoChange = useCallback(async e => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid) return
    setLogoUploading(true)
    try {
      const storageRef = ref(storage, `users/${user.uid}/brandLogo`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setLocal(p => ({ ...p, brandLogo: url }))
    } catch (err) {
      console.error('[BrandModal] logo upload failed:', err)
      showToast('Logo upload failed — try again')
    } finally {
      setLogoUploading(false)
    }
  }, [user?.uid, showToast])

  const handleLogoRemove = useCallback(async () => {
    if (!user?.uid) return
    setLocal(p => ({ ...p, brandLogo: null }))
    try {
      const storageRef = ref(storage, `users/${user.uid}/brandLogo`)
      await deleteObject(storageRef)
    } catch { /* file may not exist — ignore */ }
  }, [user?.uid])

  const save = () => {
    const entry = getColourById(local.brandColourId)
    updateMany({
      ...local,
      brandColour: entry?.tokens.primary || '#D4AF37',
    })
    showToast('Brand info saved')
    onBack()
  }

  return (
    <FullModal title="Brand Identity" onBack={onBack} onSave={logoUploading ? undefined : save}>

      {/* Logo */}
      <FieldGroup>
        <Field label="Brand Logo" hint="PNG or JPG. Appears on invoice headers and portfolio. Ideally square.">
          {logoUploading ? (
            <div className={styles.logoUploadBtn} style={{ opacity: 0.6, pointerEvents: 'none' }}>
              <span className="mi">hourglass_top</span>
              Uploading…
            </div>
          ) : local.brandLogo ? (
            <div className={styles.logoPreviewWrap}>
              <img src={local.brandLogo} alt="Brand logo" className={styles.logoPreview} />
              <button className={styles.logoRemove} onClick={handleLogoRemove}>
                <span className="mi" style={{ fontSize: 15 }}>close</span> Remove
              </button>
            </div>
          ) : (
            <button className={styles.logoUploadBtn} onClick={() => logoInputRef.current?.click()}>
              <span className="mi">add_photo_alternate</span>
              Upload Logo
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoChange}
          />
        </Field>
      </FieldGroup>

      {/* Name + tagline */}
      <FieldGroup>
        <Field label="Shop / Brand Name">
          <TextInput value={local.brandName} onChange={set('brandName')} placeholder="e.g. Stitched by Amara" />
        </Field>
        <Field label="Tagline" hint="Short line shown under your name on coloured invoice templates.">
          <TextInput value={local.brandTagline} onChange={set('brandTagline')} placeholder="e.g. Crafted with love, fitted for you" />
        </Field>
      </FieldGroup>

      {/* Brand Colour */}
      <FieldGroup>
        <Field
          label="Brand Colour"
          hint="Choose your brand colour. We've curated shades that look great on your portfolio and invoices."
        >
          <BrandColourPicker
            value={local.brandColourId}
            onChange={set('brandColourId')}
          />
        </Field>
      </FieldGroup>

      {/* Milestone + Featured Technique */}
      <FieldGroup>
        <Field label="Milestone" hint="A proud achievement shown on your portfolio. e.g. 500+ happy clients">
          <TextInput value={local.brandMilestone} onChange={set('brandMilestone')} placeholder="e.g. 500+ happy clients" />
        </Field>
        <Field label="Featured Technique" hint="Your signature craft. e.g. Hand-embroidered agbada">
          <TextInput value={local.brandFeaturedTechnique} onChange={set('brandFeaturedTechnique')} placeholder="e.g. Hand-embroidered agbada" />
        </Field>
      </FieldGroup>

    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Business Contact
// ─────────────────────────────────────────────────────────────

function BusinessContactModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()

  const parsedBrandPhone = parseStoredPhone(settings.brandPhone)
  const [local, setLocal] = useState({
    brandEmail:   settings.brandEmail   || '',
    brandAddress: settings.brandAddress || '',
    brandWebsite: settings.brandWebsite || '',
  })
  const [phoneLocal,   setPhoneLocal]   = useState(parsedBrandPhone.local)
  const [phoneCountry, setPhoneCountry] = useState(parsedBrandPhone.country)

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    const builtPhone = buildPhoneNumber(phoneLocal, phoneCountry.dial_code) || phoneLocal
    updateMany({ ...local, brandPhone: builtPhone })
    showToast('Business contact saved')
    onBack()
  }

  return (
    <FullModal title="Business Contact" onBack={onBack} onSave={save}>
      <FieldGroup>
        <PhoneField
          label="Business Phone"
          localValue={phoneLocal}
          onLocalChange={setPhoneLocal}
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
        />
        <Field label="Business Email">
          <TextInput value={local.brandEmail} onChange={set('brandEmail')} placeholder="shop@email.com" type="email" />
        </Field>
        <Field label="Business Address">
          <Textarea value={local.brandAddress} onChange={set('brandAddress')} placeholder="12 Tailor Street, Ikeja, Lagos" rows={2} />
        </Field>
        <Field label="Website / Social Handle">
          <TextInput value={local.brandWebsite} onChange={set('brandWebsite')} placeholder="instagram.com/yourbrand" />
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Account / Payment Details
// ─────────────────────────────────────────────────────────────

function AccountDetailsModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()

  const [local, setLocal] = useState({
    accountBank:   settings.accountBank   || '',
    accountNumber: settings.accountNumber || '',
    accountName:   settings.accountName   || '',
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    updateMany(local)
    showToast('Account details saved')
    onBack()
  }

  return (
    <FullModal title="Account Details" onBack={onBack} onSave={save}>
      <FieldGroup>
        <Field label="Bank Name" hint="e.g. GTBank, Access, OPay">
          <TextInput value={local.accountBank} onChange={set('accountBank')} placeholder="e.g. GTBank" />
        </Field>
        <Field label="Account Number">
          <TextInput value={local.accountNumber} onChange={set('accountNumber')} placeholder="e.g. 0123456789" type="tel" />
        </Field>
        <Field label="Account Name" hint="Name registered on the bank account">
          <TextInput value={local.accountName} onChange={set('accountName')} placeholder="e.g. Amara Okonkwo" />
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Business Info
// ─────────────────────────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { value: 'open',   label: 'Accepting Orders', icon: 'check_circle' },
  { value: 'booked', label: 'Fully Booked',     icon: 'block'        },
]

function ServiceAreaPicker({ value, onChange }) {
  // value is a comma-separated string of selected states
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  const [search, setSearch] = useState('')

  const toggle = state => {
    const next = selected.includes(state)
      ? selected.filter(s => s !== state)
      : [...selected, state]
    onChange(next.join(', '))
  }

  const filtered = search.trim()
    ? NIGERIAN_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : NIGERIAN_STATES

  return (
    <div className={styles.serviceAreaWrap}>
      {selected.length > 0 && (
        <div className={styles.serviceAreaSelected}>
          {selected.map(s => (
            <button key={s} type="button" className={styles.serviceAreaChip} onClick={() => toggle(s)}>
              {s}
              <span className="mi" style={{ fontSize: '0.75rem' }}>close</span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.serviceAreaSearch}>
        <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>search</span>
        <input
          type="text"
          className={styles.serviceAreaSearchInput}
          placeholder="Search states…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.serviceAreaList}>
        {filtered.map(state => (
          <button
            key={state}
            type="button"
            className={`${styles.serviceAreaOption} ${selected.includes(state) ? styles.serviceAreaOptionActive : ''}`}
            onClick={() => toggle(state)}
          >
            {selected.includes(state) && (
              <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>
            )}
            {state}
          </button>
        ))}
      </div>
    </div>
  )
}

function TurnaroundPicker({ value, onChange }) {
  // value is like "2 weeks" or "5 days"
  const parse = v => {
    if (!v) return { num: '1', unit: 'weeks' }
    const match = v.match(/^(\d+)\s+(days|weeks)$/)
    return match ? { num: match[1], unit: match[2] } : { num: '1', unit: 'weeks' }
  }
  const { num, unit } = parse(value)

  const maxNum = unit === 'days' ? 30 : 12
  const numOptions = Array.from({ length: maxNum }, (_, i) => String(i + 1))

  const handleNum  = n => onChange(`${n} ${unit}`)
  const handleUnit = u => {
    const safeNum = u === 'days' ? Math.min(parseInt(num), 30) : Math.min(parseInt(num), 12)
    onChange(`${safeNum} ${u}`)
  }

  return (
    <div className={styles.turnaroundRow}>
      <select
        className={styles.turnaroundSelect}
        value={num}
        onChange={e => handleNum(e.target.value)}
      >
        {numOptions.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <select
        className={styles.turnaroundSelect}
        value={unit}
        onChange={e => handleUnit(e.target.value)}
      >
        <option value="days">Days</option>
        <option value="weeks">Weeks</option>
      </select>
    </div>
  )
}

// Signature pad
function SignaturePad({ value, onChange }) {
  const canvasRef  = useRef(null)
  const drawing    = useRef(false)
  const hasStroke  = useRef(false)

  // Draw existing signature on mount
  useEffect(() => {
    if (!value || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = value
  }, [])

  const getPos = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width  / rect.width
    const scaleY = canvasRef.current.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = e => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = e => {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.strokeStyle = 'var(--text)'
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    hasStroke.current = true
  }

  const endDraw = e => {
    e?.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    if (hasStroke.current) {
      onChange(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    hasStroke.current = false
    onChange(null)
  }

  return (
    <div className={styles.sigWrap}>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className={styles.sigCanvas}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className={styles.sigFooter}>
        <span className={styles.sigHint}>Draw your signature above</span>
        <button type="button" className={styles.sigClearBtn} onClick={clear}>
          <span className="mi" style={{ fontSize: '0.9rem' }}>refresh</span>
          Clear
        </button>
      </div>
    </div>
  )
}

function BusinessInfoModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()
  const { user } = useAuth()
  const [sigUploading, setSigUploading] = useState(false)

  const [local, setLocal] = useState({
    brandAvailability:   settings.brandAvailability   || 'open',
    brandAvailableUntil: settings.brandAvailableUntil || '',
    brandTurnaround:     settings.brandTurnaround     || '1 weeks',
    brandServiceArea:    settings.brandServiceArea     || '',
    brandStyleStatement: settings.brandStyleStatement || '',
    brandPaymentTerms:   settings.brandPaymentTerms   || '',
    brandSignature:      settings.brandSignature      || null,
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = async () => {
    let signatureUrl = local.brandSignature

    // If signature is a new base64 drawing (not already a URL), upload it
    if (local.brandSignature && local.brandSignature.startsWith('data:') && user?.uid) {
      setSigUploading(true)
      try {
        const blob      = await (await fetch(local.brandSignature)).blob()
        const storageRef = ref(storage, `users/${user.uid}/signature`)
        await uploadBytes(storageRef, blob)
        signatureUrl = await getDownloadURL(storageRef)
      } catch (err) {
        console.error('[BusinessInfoModal] signature upload failed:', err)
        showToast('Signature upload failed — try again')
        setSigUploading(false)
        return
      }
      setSigUploading(false)
    }

    updateMany({ ...local, brandSignature: signatureUrl })
    showToast('Business info saved')
    onBack()
  }

  return (
    <FullModal title="Business Info" onBack={onBack} onSave={sigUploading ? undefined : save}>

      {/* Availability */}
      <FieldGroup>
        <Field label="Availability">
          <div className={styles.availabilityRow}>
            {AVAILABILITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.availBtn} ${local.brandAvailability === opt.value
                  ? opt.value === 'open' ? styles.availBtnOpen : styles.availBtnBooked
                  : ''}`}
                onClick={() => set('brandAvailability')(opt.value)}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
        {local.brandAvailability === 'booked' && (
          <Field label="Available From" hint="When will you start accepting orders again?">
            <TextInput
              value={local.brandAvailableUntil}
              onChange={set('brandAvailableUntil')}
              placeholder="e.g. January 2025"
            />
          </Field>
        )}
      </FieldGroup>

      {/* Turnaround */}
      <FieldGroup>
        <Field label="Standard Turnaround Time" hint="How long does it typically take to complete an order?">
          <TurnaroundPicker value={local.brandTurnaround} onChange={set('brandTurnaround')} />
        </Field>
      </FieldGroup>

      {/* Service Area */}
      <FieldGroup>
        <Field label="Service Area" hint="Select all states you deliver or offer services to.">
          <ServiceAreaPicker value={local.brandServiceArea} onChange={set('brandServiceArea')} />
        </Field>
      </FieldGroup>

      {/* Style Statement */}
      <FieldGroup>
        <Field label="Style Statement" hint="Describe your craft style. Shown on your portfolio.">
          <Textarea
            value={local.brandStyleStatement}
            onChange={set('brandStyleStatement')}
            placeholder="e.g. I specialise in bold Ankara fusion pieces that blend traditional Yoruba aesthetics with modern silhouettes…"
            rows={6}
          />
        </Field>
      </FieldGroup>

      {/* Payment Terms */}
      <FieldGroup>
        <Field label="Payment Terms" hint="Your standard terms printed on invoices.">
          <Textarea
            value={local.brandPaymentTerms}
            onChange={set('brandPaymentTerms')}
            placeholder="e.g. 50% deposit required before cutting begins. Balance due on pickup. No refunds after fabric is cut."
            rows={5}
          />
        </Field>
      </FieldGroup>

      {/* Signature */}
      <FieldGroup>
        <Field label="Signature" hint="Draw your signature. It will appear on your invoices.">
          <SignaturePad value={local.brandSignature} onChange={set('brandSignature')} />
        </Field>
      </FieldGroup>

    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Social Media Links
// ─────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram',   placeholder: 'yourbrand',        icon: 'photo_camera'  },
  { id: 'tiktok',    label: 'TikTok',      placeholder: 'yourbrand',        icon: 'play_circle'   },
  { id: 'facebook',  label: 'Facebook',    placeholder: 'yourbrand',        icon: 'groups'        },
  { id: 'twitter',   label: 'Twitter / X', placeholder: 'yourbrand',        icon: 'tag'           },
  { id: 'youtube',   label: 'YouTube',     placeholder: 'YourBrandChannel', icon: 'smart_display' },
  { id: 'pinterest', label: 'Pinterest',   placeholder: 'yourbrand',        icon: 'push_pin'      },
  { id: 'threads',   label: 'Threads',     placeholder: 'yourbrand',        icon: 'forum'         },
]

function SocialsModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()

  const toMap = arr => Object.fromEntries((arr || []).map(s => [s.platform, s.handle]))
  const [handles, setHandles] = useState(() => toMap(settings.brandSocials || []))
  const [expanded, setExpanded] = useState(() => {
    const active = new Set((settings.brandSocials || []).map(s => s.platform))
    return Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.id, active.has(p.id)]))
  })

  const togglePlatform = id => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (prev[id]) setHandles(h => { const n = { ...h }; delete n[id]; return n })
      return next
    })
  }

  const save = () => {
    const brandSocials = SOCIAL_PLATFORMS
      .filter(p => expanded[p.id] && handles[p.id]?.trim())
      .map(p => ({ platform: p.id, handle: handles[p.id].trim() }))
    updateMany({ brandSocials })
    showToast('Social links saved')
    onBack()
  }

  return (
    <FullModal title="Social Media" onBack={onBack} onSave={save}>
      <FieldGroup>
        {SOCIAL_PLATFORMS.map(platform => (
          <div key={platform.id} className={styles.socialRow}>
            <button
              type="button"
              className={`${styles.socialToggle} ${expanded[platform.id] ? styles.socialToggleActive : ''}`}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className={styles.socialToggleLeft}>
                <div className={`${styles.socialIconWrap} ${expanded[platform.id] ? styles.socialIconActive : ''}`}>
                  <span className="mi" style={{ fontSize: '1.1rem' }}>{platform.icon}</span>
                </div>
                <span className={styles.socialPlatformLabel}>{platform.label}</span>
              </div>
              <span className={`mi ${styles.socialChevron} ${expanded[platform.id] ? styles.socialChevronOpen : ''}`} style={{ fontSize: '1rem' }}>
                expand_more
              </span>
            </button>
            {expanded[platform.id] && (
              <div className={styles.socialHandleWrap}>
                <span className={styles.socialAt}>@</span>
                <input
                  className={styles.socialHandleInput}
                  type="text"
                  placeholder={platform.placeholder}
                  value={handles[platform.id] || ''}
                  onChange={e => setHandles(h => ({ ...h, [platform.id]: e.target.value }))}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            )}
          </div>
        ))}
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────

function PlanBadge({ isPremium }) {
  return (
    <span className={isPremium ? styles.badgePro : styles.badgeFree}>
      {isPremium
        ? <><span className="mi" style={{ fontSize: '0.75rem' }}>workspace_premium</span> PRO</>
        : 'FREE'
      }
    </span>
  )
}

function Avatar({ name, logo, size = 72 }) {
  const initials = name
    ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  if (logo) {
    return (
      <img
        src={logo}
        alt="Avatar"
        className={styles.avatarImg}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div className={styles.avatarInitials} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

function getOrSetJoinDate() {
  const key = 'tailorflow_joined'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  localStorage.setItem(key, today)
  return today
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function Profile({ onMenuClick, isPremium = false, onUpgrade = () => {} }) {
  const { settings } = useSettings()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [personal,        setPersonal]        = useState(() => loadPersonal(user))
  const [activeModal,     setActiveModal]     = useState(null)
  const [logoutConfirm,   setLogoutConfirm]   = useState(false)
  const [deleteConfirm,   setDeleteConfirm]   = useState(false)
  const [toastMsg,        setToastMsg]        = useState('')
  const toastTimer = useRef(null)

  const joinDate = getOrSetJoinDate()

  const showToast = useCallback(msg => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const handleLogout = async () => {
    setLogoutConfirm(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleDeleteAccount = async () => {
    setDeleteConfirm(false)
    try {
      await user.delete()
      navigate('/login', { replace: true })
    } catch (err) {
      // If requires recent login, log out and let them re-authenticate
      if (err.code === 'auth/requires-recent-login') {
        showToast('Please log out and log in again to delete your account')
      } else {
        showToast('Could not delete account — please try again')
      }
    }
  }

  const hasBrand          = !!(settings.brandName || settings.brandLogo)
  const hasAccountDetails = !!(settings.accountBank || settings.accountNumber)
  const hasBusinessContact = !!(settings.brandPhone || settings.brandEmail || settings.brandAddress)

  const brandColourHex = getColourById(settings.brandColourId)?.tokens.primary
    || getColourById(DEFAULT_COLOUR_ID)?.tokens.primary
    || null

  return (
    <div className={styles.page}>
      <Header title="Account" onMenuClick={onMenuClick} />

      <div className={styles.scrollArea}>
        <div className={styles.heroCard}>
          <div className={styles.heroCardGlow} />
          <div className={styles.heroTop}>
            <Avatar
              name={personal.fullName || settings.brandName}
              logo={settings.brandLogo}
              size={72}
            />
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>
                {personal.fullName || 'Your Name'}
              </div>
              {(personal.city || personal.country) && (
                <div className={styles.heroLocation}>
                  <span className="mi" style={{ fontSize: '0.75rem' }}>location_on</span>
                  {[personal.city, personal.country].filter(Boolean).join(', ')}
                </div>
              )}
              <PlanBadge isPremium={isPremium} />
            </div>
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.heroMetaItem}>
              <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>calendar_today</span>
              <span className={styles.heroMetaLabel}>Joined {joinDate}</span>
            </div>
            {(personal.email || user?.email) && (
              <div className={styles.heroMetaItem}>
                <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>mail</span>
                <span className={styles.heroMetaLabel}>{personal.email || user?.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Personal Info ── */}
        <SectionHeader icon="person" label="Personal Info" />
        <InfoRow icon="badge"  label="Full Name" value={personal.fullName}  placeholder="Not set" />
        <InfoRow icon="mail"   label="Email"     value={personal.email || user?.email} placeholder="Not set" />
        <InfoRow icon="call"   label="Phone"     value={personal.phone}     placeholder="Not set" />
        <InfoRow icon="public" label="Location"  value={[personal.city, personal.country].filter(Boolean).join(', ')} placeholder="Not set" />
        <TappableRow
          icon="edit"
          label="Edit Personal Info"
          onClick={() => setActiveModal('personal')}
          divider={false}
        />

        {/* ── Brand Identity ── */}
        <SectionHeader icon="storefront" label="Brand Identity" />
        {hasBrand ? (
          <div className={`${styles.row} ${styles.brandPreview}`}>
            {settings.brandLogo && (
              <img src={settings.brandLogo} alt="Brand logo" className={styles.brandPreviewLogo} />
            )}
            <div className={styles.brandPreviewInfo}>
              <div className={styles.brandPreviewName}>{settings.brandName || '—'}</div>
              {settings.brandTagline && (
                <div className={styles.brandPreviewTagline}>{settings.brandTagline}</div>
              )}
            </div>
            {brandColourHex && (
              <div className={styles.brandColourDot} style={{ background: brandColourHex }} />
            )}
          </div>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>storefront</span>
            <span className={styles.brandEmptyText}>No brand set up yet</span>
          </div>
        )}
        <InfoRow icon="store"        label="Brand Name"        value={settings.brandName}              placeholder="Not set" />
        <InfoRow icon="emoji_events" label="Milestone"         value={settings.brandMilestone}         placeholder="Not set" />
        <InfoRow icon="auto_fix_high" label="Featured Technique" value={settings.brandFeaturedTechnique} placeholder="Not set" />
        <TappableRow
          icon="edit"
          label="Edit Brand Identity"
          sub="Logo, colours, milestone, featured technique"
          onClick={() => setActiveModal('brand')}
          divider={false}
        />

        {/* ── Business Contact ── */}
        <SectionHeader icon="contact_phone" label="Business Contact" />
        {hasBusinessContact ? (
          <>
            {settings.brandPhone   && <InfoRow icon="call"     label="Business Phone"   value={settings.brandPhone}   placeholder="Not set" />}
            {settings.brandEmail   && <InfoRow icon="mail"     label="Business Email"   value={settings.brandEmail}   placeholder="Not set" />}
            {settings.brandAddress && <InfoRow icon="location_on" label="Address"       value={settings.brandAddress} placeholder="Not set" />}
          </>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>contact_phone</span>
            <span className={styles.brandEmptyText}>No business contact set yet</span>
          </div>
        )}
        <TappableRow
          icon="edit"
          label="Edit Business Contact"
          sub="Phone, email, address, website used on invoices"
          onClick={() => setActiveModal('businessContact')}
          divider={false}
        />

        {/* ── Business Info ── */}
        <SectionHeader icon="business_center" label="Business Info" />
        <InfoRow icon="schedule"     label="Turnaround Time" value={settings.brandTurnaround}    placeholder="Not set" />
        <InfoRow icon="public"       label="Service Area"    value={settings.brandServiceArea}   placeholder="Not set" />
        <InfoRow
          icon={settings.brandAvailability === 'booked' ? 'block' : 'check_circle'}
          label="Availability"
          value={settings.brandAvailability === 'booked'
            ? `Fully Booked${settings.brandAvailableUntil ? ` · Available from ${settings.brandAvailableUntil}` : ''}`
            : 'Accepting Orders'}
          placeholder="Not set"
        />
        {settings.brandPaymentTerms && (
          <InfoRow icon="receipt_long" label="Payment Terms" value="Set" placeholder="Not set" />
        )}
        {settings.brandSignature && (
          <div className={`${styles.row}`}>
            <div className={styles.rowIcon}>
              <span className="mi" style={{ fontSize: '1.15rem' }}>draw</span>
            </div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Signature</div>
              <img src={settings.brandSignature} alt="Signature" className={styles.sigPreview} />
            </div>
          </div>
        )}
        <TappableRow
          icon="edit"
          label="Edit Business Info"
          sub="Availability, turnaround, service area, payment terms, signature"
          onClick={() => setActiveModal('businessInfo')}
          divider={false}
        />

        {/* ── Social Media ── */}
        <SectionHeader icon="share" label="Social Media" />
        {settings.brandSocials?.length > 0 ? (
          <div className={styles.socialsPreview}>
            {settings.brandSocials.map(s => {
              const p = SOCIAL_PLATFORMS.find(pl => pl.id === s.platform)
              return p ? (
                <div key={s.platform} className={styles.socialPreviewChip}>
                  <span className="mi" style={{ fontSize: '0.9rem' }}>{p.icon}</span>
                  <span className={styles.socialPreviewLabel}>@{s.handle}</span>
                </div>
              ) : null
            })}
          </div>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>share</span>
            <span className={styles.brandEmptyText}>No social links yet</span>
          </div>
        )}
        <TappableRow
          icon="edit"
          label="Edit Social Links"
          sub="Instagram, TikTok, Facebook and more"
          onClick={() => setActiveModal('socials')}
          divider={false}
        />

        {/* ── Account Details ── */}
        <SectionHeader icon="account_balance" label="Account Details" />
        {hasAccountDetails ? (
          <>
            <InfoRow icon="account_balance" label="Bank"           value={settings.accountBank}   placeholder="Not set" />
            <InfoRow icon="tag"             label="Account Number" value={settings.accountNumber} placeholder="Not set" />
            <InfoRow icon="badge"           label="Account Name"   value={settings.accountName}   placeholder="Not set" />
          </>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>account_balance</span>
            <span className={styles.brandEmptyText}>No account details yet</span>
          </div>
        )}
        <TappableRow
          icon="edit"
          label="Edit Account Details"
          sub="Bank info printed on invoices for client payments"
          onClick={() => setActiveModal('accountDetails')}
          divider={false}
        />

        {/* ── My Plan ── */}
        <SectionHeader icon="workspace_premium" label="My Plan" />
        <div className={styles.row}>
          <div className={styles.planLeft}>
            <div className={styles.planName}>{isPremium ? 'TailorFlow Pro' : 'Free Plan'}</div>
            <div className={styles.planSub}>
              {isPremium
                ? 'All features unlocked — invoice customisation, branded PDFs & more'
                : 'Basic features only. Upgrade to unlock brand customisation.'}
            </div>
          </div>
          <PlanBadge isPremium={isPremium} />
        </div>
        {!isPremium && (
          <div className={`${styles.row} ${styles.upgradeStrip}`} onClick={onUpgrade}>
            <div className={styles.upgradeStripGlow} />
            <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>workspace_premium</span>
            <div className={styles.upgradeStripText}>
              <div className={styles.upgradeStripTitle}>Upgrade to Pro</div>
              <div className={styles.upgradeStripSub}>Unlock everything — invoices, brand colours, PDFs</div>
            </div>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--accent)' }}>chevron_right</span>
          </div>
        )}

        {/* ── Account ── */}
        <SectionHeader icon="manage_accounts" label="Account" />
        <TappableRow
          icon="logout"
          label="Log Out"
          sub="You can always log back in"
          onClick={() => setLogoutConfirm(true)}
        />
        <TappableRow
          icon="delete_forever"
          label="Delete Account"
          sub="Permanently remove your account and all data"
          onClick={() => setDeleteConfirm(true)}
          divider={false}
          danger
        />

        <div style={{ height: 40 }} />
      </div>

      {/* ── Modals ── */}
      {activeModal === 'personal' && (
        <PersonalModal
          personal={personal}
          authUser={user}
          onBack={() => setActiveModal(null)}
          onSave={data => { setPersonal(data); showToast('Personal info saved') }}
        />
      )}
      {activeModal === 'brand' && (
        <BrandModal onBack={() => setActiveModal(null)} showToast={showToast} />
      )}
      {activeModal === 'businessContact' && (
        <BusinessContactModal onBack={() => setActiveModal(null)} showToast={showToast} />
      )}
      {activeModal === 'accountDetails' && (
        <AccountDetailsModal onBack={() => setActiveModal(null)} showToast={showToast} />
      )}
      {activeModal === 'businessInfo' && (
        <BusinessInfoModal onBack={() => setActiveModal(null)} showToast={showToast} />
      )}
      {activeModal === 'socials' && (
        <SocialsModal onBack={() => setActiveModal(null)} showToast={showToast} />
      )}

      <ConfirmSheet
        open={logoutConfirm}
        title="Log Out?"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirm(false)}
      />
      <ConfirmSheet
        open={deleteConfirm}
        title="Delete Account?"
        message="This will permanently delete your account and all your data. This cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteConfirm(false)}
      />
      <Toast message={toastMsg} />
    </div>
  )
}
