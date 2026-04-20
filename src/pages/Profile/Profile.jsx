// src/pages/Profile/Profile.jsx
// ─────────────────────────────────────────────────────────────
// Changes:
//  • BrandModal logo upload now uses Firebase Storage.
//    The file is uploaded to users/{uid}/brandLogo, and the
//    download URL (a short https:// string) is stored in
//    settings.brandLogo instead of a base64 string.
//    This prevents the Firestore 1MB document limit error.
//  • BrandColourPicker replaces raw <input type="color">
//  • brandColourId stored as palette ID, brandColour as hex fallback
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
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
// Shared primitives
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>{icon}</span>
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

function PersonalModal({ personal, onBack, onSave, authUser }) {
  const [local, setLocal] = useState({
    fullName:  personal.fullName  || '',
    email:     personal.email     || '',
    phone:     personal.phone     || '',
    city:      personal.city      || '',
    country:   personal.country   || '',
  })
  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    const updated = { ...personal, ...local }
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
        <Field label="Phone Number">
          <TextInput value={local.phone} onChange={set('phone')} placeholder="+234 800 000 0000" type="tel" />
        </Field>
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
    brandName:      settings.brandName      || '',
    brandTagline:   settings.brandTagline   || '',
    // brandColourId: use stored ID. If somehow a hex crept in, reset to default.
    brandColourId:  (settings.brandColourId && !settings.brandColourId.startsWith('#'))
                      ? settings.brandColourId
                      : DEFAULT_COLOUR_ID,
    brandLogo:      settings.brandLogo      || null,
    brandPhone:     settings.brandPhone     || '',
    brandEmail:     settings.brandEmail     || '',
    brandAddress:   settings.brandAddress   || '',
    brandWebsite:   settings.brandWebsite   || '',
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  // ── Upload logo to Firebase Storage, store download URL ──────
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

  // ── Delete logo from Firebase Storage and clear from settings ─
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
              <button
                className={styles.logoRemove}
                onClick={handleLogoRemove}
              >
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

      {/* Brand Colour — curated palette picker, saves as brandColourId */}
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

      {/* Contact */}
      <FieldGroup>
        <Field label="Business Phone">
          <TextInput value={local.brandPhone} onChange={set('brandPhone')} placeholder="+234 800 000 0000" type="tel" />
        </Field>
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

const TURNAROUND_OPTIONS = [
  { value: '1 week',    label: '1 week' },
  { value: '1-2 weeks', label: '1–2 weeks' },
  { value: '2-3 weeks', label: '2–3 weeks' },
  { value: '3-4 weeks', label: '3–4 weeks' },
  { value: '4-6 weeks', label: '4–6 weeks' },
  { value: '6+ weeks',  label: '6+ weeks' },
]

const SERVICE_AREA_OPTIONS = [
  { value: 'Lagos only',    label: 'Lagos only' },
  { value: 'Nationwide',    label: 'Nationwide' },
  { value: 'International', label: 'International' },
]

function SelectChips({ options, value, onChange }) {
  return (
    <div className={styles.chipsRow}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.chip} ${value === opt.value ? styles.chipActive : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function BusinessInfoModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()

  const [local, setLocal] = useState({
    brandFoundedYear:       settings.brandFoundedYear       || '',
    brandTurnaround:        settings.brandTurnaround        || '',
    brandServiceArea:       settings.brandServiceArea       || '',
    brandAvailability:      settings.brandAvailability      || 'open',
    brandAvailableUntil:    settings.brandAvailableUntil    || '',
    brandStyleStatement:    settings.brandStyleStatement    || '',
    brandFeaturedTechnique: settings.brandFeaturedTechnique || '',
    brandMilestone:         settings.brandMilestone         || '',
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    updateMany(local)
    showToast('Business info saved')
    onBack()
  }

  return (
    <FullModal title="Business Info" onBack={onBack} onSave={save}>

      <FieldGroup>
        <Field label="Availability" hint="Clients will see this on your portfolio.">
          <div className={styles.availabilityRow}>
            <button
              type="button"
              className={`${styles.availBtn} ${local.brandAvailability === 'open' ? styles.availBtnOpen : ''}`}
              onClick={() => set('brandAvailability')('open')}
            >
              <span className="mi" style={{ fontSize: '1rem' }}>check_circle</span>
              Accepting Orders
            </button>
            <button
              type="button"
              className={`${styles.availBtn} ${local.brandAvailability === 'booked' ? styles.availBtnBooked : ''}`}
              onClick={() => set('brandAvailability')('booked')}
            >
              <span className="mi" style={{ fontSize: '1rem' }}>block</span>
              Fully Booked
            </button>
          </div>
        </Field>
        {local.brandAvailability === 'booked' && (
          <Field label="Available again from" hint="Optional — lets clients know when to check back.">
            <TextInput type="date" value={local.brandAvailableUntil} onChange={set('brandAvailableUntil')} placeholder="" />
          </Field>
        )}
      </FieldGroup>

      <FieldGroup>
        <Field label="Year Founded" hint="e.g. 2018 — shown as 'Crafting since 2018'">
          <TextInput value={local.brandFoundedYear} onChange={set('brandFoundedYear')} placeholder="e.g. 2018" type="tel" />
        </Field>
        <Field label="Client Milestone" hint="e.g. 200+ garments delivered">
          <TextInput value={local.brandMilestone} onChange={set('brandMilestone')} placeholder="e.g. 200+ garments delivered" />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field label="Signature Style Statement" hint="One sentence about what makes your work unique. Max 100 characters.">
          <Textarea
            value={local.brandStyleStatement}
            onChange={v => set('brandStyleStatement')(v.slice(0, 100))}
            placeholder="e.g. I specialise in Yoruba ceremonial wear for weddings and naming ceremonies."
            rows={2}
          />
          <span className={styles.charCount}>{local.brandStyleStatement.length}/100</span>
        </Field>
        <Field label="Featured Technique" hint="e.g. Hand-embroidered agbada, French-seam finishing">
          <TextInput value={local.brandFeaturedTechnique} onChange={set('brandFeaturedTechnique')} placeholder="e.g. Hand-embroidered agbada" />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field label="Standard Turnaround Time">
          <SelectChips options={TURNAROUND_OPTIONS} value={local.brandTurnaround} onChange={set('brandTurnaround')} />
        </Field>
        <Field label="Service Area">
          <SelectChips options={SERVICE_AREA_OPTIONS} value={local.brandServiceArea} onChange={set('brandServiceArea')} />
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

  const togglePlatform = (id) => {
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

  const [personal,      setPersonal]      = useState(() => loadPersonal(user))
  const [activeModal,   setActiveModal]   = useState(null)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [toastMsg,      setToastMsg]      = useState('')
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

  const hasBrand = !!(settings.brandName || settings.brandLogo)
  const hasAccountDetails = !!(settings.accountBank || settings.accountNumber)

  // Resolve brandColourId → hex for the preview dot
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
        <InfoRow icon="store" label="Brand Name" value={settings.brandName} placeholder="Not set" />
        <InfoRow icon="call"  label="Biz Phone"  value={settings.brandPhone} placeholder="Not set" />
        <TappableRow
          icon="edit"
          label="Edit Brand Identity"
          sub="Logo, colours, contact details used on invoices"
          onClick={() => setActiveModal('brand')}
          divider={false}
        />

        {/* ── Account / Payment Details ── */}
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

        {/* ── Business Info ── */}
        <SectionHeader icon="storefront" label="Business Info" />
        <InfoRow icon="schedule"     label="Turnaround Time"    value={settings.brandTurnaround}        placeholder="Not set" />
        <InfoRow icon="public"       label="Service Area"       value={settings.brandServiceArea}       placeholder="Not set" />
        <InfoRow icon="history"      label="Founded"            value={settings.brandFoundedYear ? `Since ${settings.brandFoundedYear}` : ''} placeholder="Not set" />
        <InfoRow icon="emoji_events" label="Milestone"          value={settings.brandMilestone}         placeholder="Not set" />
        <InfoRow
          icon={settings.brandAvailability === 'booked' ? 'block' : 'check_circle'}
          label="Availability"
          value={settings.brandAvailability === 'booked'
            ? `Fully Booked${settings.brandAvailableUntil ? ` · Available from ${settings.brandAvailableUntil}` : ''}`
            : 'Accepting Orders'}
          placeholder="Not set"
        />
        <TappableRow
          icon="edit"
          label="Edit Business Info"
          sub="Availability, turnaround, style statement, service area"
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

        {/* ── Plan ── */}
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
      <Toast message={toastMsg} />
    </div>
  )
}
