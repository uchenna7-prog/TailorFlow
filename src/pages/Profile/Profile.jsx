import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
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
  const logoInputRef = useRef()

  const [local, setLocal] = useState({
    brandName:    settings.brandName,
    brandTagline: settings.brandTagline,
    brandColour:  settings.brandColour,
    brandLogo:    settings.brandLogo,
    brandPhone:   settings.brandPhone,
    brandEmail:   settings.brandEmail,
    brandAddress: settings.brandAddress,
    brandWebsite: settings.brandWebsite,
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const handleLogoChange = useCallback(e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setLocal(p => ({ ...p, brandLogo: ev.target.result }))
    reader.readAsDataURL(file)
  }, [])

  const save = () => {
    updateMany(local)
    showToast('Brand info saved')
    onBack()
  }

  return (
    <FullModal title="Brand Identity" onBack={onBack} onSave={save}>
      <FieldGroup>
        <Field label="Brand Logo" hint="PNG or JPG. Appears on invoice headers. Ideally square.">
          {local.brandLogo ? (
            <div className={styles.logoPreviewWrap}>
              <img src={local.brandLogo} alt="Brand logo" className={styles.logoPreview} />
              <button
                className={styles.logoRemove}
                onClick={() => setLocal(p => ({ ...p, brandLogo: null }))}
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

      <FieldGroup>
        <Field label="Shop / Brand Name">
          <TextInput value={local.brandName} onChange={set('brandName')} placeholder="e.g. Stitched by Amara" />
        </Field>
        <Field label="Tagline" hint="Short line shown under your name on coloured invoice templates.">
          <TextInput value={local.brandTagline} onChange={set('brandTagline')} placeholder="e.g. Crafted with love, fitted for you" />
        </Field>
        <Field label="Brand Colour">
          <div className={styles.colourRow}>
            <input
              type="color"
              className={styles.colourPicker}
              value={local.brandColour}
              onChange={e => set('brandColour')(e.target.value)}
            />
            <TextInput value={local.brandColour} onChange={set('brandColour')} placeholder="#D4AF37" />
          </div>
        </Field>
      </FieldGroup>

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

export default function Profile({ onMenuClick, isPremium = false, onUpgrade = () => {} }) {
  const { settings } = useSettings()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [personal,       setPersonal]       = useState(() => loadPersonal(user))
  const [activeModal,    setActiveModal]     = useState(null)
  const [logoutConfirm,  setLogoutConfirm]   = useState(false)
  const [toastMsg,       setToastMsg]        = useState('')
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
            {settings.brandColour && (
              <div className={styles.brandColourDot} style={{ background: settings.brandColour }} />
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
