import { useRef, useState, useCallback } from 'react'
import { useSettings, DEFAULTS } from '../contexts/SettingsContext'
import TopBar from '../components/TopBar'
import s from './Settings.module.css'

// ─────────────────────────────────────────────
// Small reusable primitives
// ─────────────────────────────────────────────

function SectionHeader({ icon, label }) {
  return (
    <div className={s.sectionHeader}>
      <span className="material-icons" style={{ fontSize: 15, color: 'var(--text3)' }}>{icon}</span>
      <span className={s.sectionLabel}>{label}</span>
    </div>
  )
}

function Row({ icon, iconBg, label, sub, value, onClick, children, divider = true }) {
  return (
    <div
      className={`${s.row} ${onClick ? s.rowTappable : ''}`}
      onClick={onClick}
      style={{ borderBottom: divider ? '1px solid var(--border)' : 'none' }}
    >
      {icon && (
        <div className={s.rowIcon} style={iconBg ? { background: iconBg } : {}}>
          <span className="material-icons" style={{ fontSize: 18 }}>{icon}</span>
        </div>
      )}
      <div className={s.rowText}>
        <div className={s.rowLabel}>{label}</div>
        {sub && <div className={s.rowSub}>{sub}</div>}
      </div>
      {value && <span className={s.rowValue}>{value}</span>}
      {children}
      {onClick && <span className="material-icons" style={{ fontSize: 18, color: 'var(--text3)' }}>chevron_right</span>}
    </div>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <button
      className={`${s.toggle} ${on ? s.toggleOn : ''}`}
      onClick={onToggle}
      aria-checked={on}
      role="switch"
    >
      <div className={s.toggleThumb} style={on ? { transform: 'translateX(18px)', background: '#fff' } : { background: 'var(--text3)' }} />
    </button>
  )
}

// ─────────────────────────────────────────────
// Full-screen modal shell
// ─────────────────────────────────────────────

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={s.fullOverlay}>
      <div className={s.fullHeader}>
        <button className={s.backBtn} onClick={onBack}>
          <span className="material-icons">arrow_back</span>
        </button>
        <span className={s.fullTitle}>{title}</span>
        {onSave && <button className={s.fullSave} onClick={onSave}>Save</button>}
      </div>
      <div className={s.fullContent}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Field components used inside modals
// ─────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div className={s.field}>
      <label className={s.fieldLabel}>{label}</label>
      {hint && <p className={s.fieldHint}>{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      className={s.textInput}
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
      className={s.textarea}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={s.segment}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${s.segBtn} ${value === opt.value ? s.segActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// MODAL: Brand & Business
// ─────────────────────────────────────────────

function BrandModal({ onBack }) {
  const { settings, updateMany } = useSettings()
  const logoInputRef = useRef()

  const [local, setLocal] = useState({
    brandName: settings.brandName,
    brandTagline: settings.brandTagline,
    brandColour: settings.brandColour,
    brandLogo: settings.brandLogo,
    brandPhone: settings.brandPhone,
    brandEmail: settings.brandEmail,
    brandAddress: settings.brandAddress,
    brandWebsite: settings.brandWebsite,
  })

  const set = (key) => (val) => setLocal(p => ({ ...p, [key]: val }))

  const handleLogoChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLocal(p => ({ ...p, brandLogo: ev.target.result }))
    reader.readAsDataURL(file)
  }, [])

  const removeLogo = () => setLocal(p => ({ ...p, brandLogo: null }))

  const save = () => {
    updateMany(local)
    onBack()
  }

  return (
    <FullModal title="Brand & Business" onBack={onBack} onSave={save}>

      {/* Logo */}
      <div className={s.fieldGroup}>
        <Field label="Brand Logo" hint="Used on invoice headers. PNG or JPG, ideally square.">
          {local.brandLogo ? (
            <div className={s.logoPreviewWrap}>
              <img src={local.brandLogo} alt="Brand logo" className={s.logoPreview} />
              <button className={s.logoRemove} onClick={removeLogo}>
                <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                Remove
              </button>
            </div>
          ) : (
            <button className={s.logoUploadBtn} onClick={() => logoInputRef.current?.click()}>
              <span className="material-icons">add_photo_alternate</span>
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
      </div>

      {/* Identity */}
      <div className={s.fieldGroup}>
        <Field label="Brand / Shop Name">
          <TextInput value={local.brandName} onChange={set('brandName')} placeholder="e.g. Stitched by Amara" />
        </Field>
        <Field label="Tagline" hint="Short line shown under your name on some templates.">
          <TextInput value={local.brandTagline} onChange={set('brandTagline')} placeholder="e.g. Crafted with love, fitted for you" />
        </Field>
        <Field label="Brand Colour" hint="Used for headers and accents on coloured invoice templates.">
          <div className={s.colourRow}>
            <input
              type="color"
              className={s.colourPicker}
              value={local.brandColour}
              onChange={e => set('brandColour')(e.target.value)}
            />
            <TextInput value={local.brandColour} onChange={set('brandColour')} placeholder="#D4AF37" />
          </div>
        </Field>
      </div>

      {/* Contact */}
      <div className={s.fieldGroup}>
        <Field label="Phone Number">
          <TextInput value={local.brandPhone} onChange={set('brandPhone')} placeholder="+234 800 000 0000" type="tel" />
        </Field>
        <Field label="Email Address">
          <TextInput value={local.brandEmail} onChange={set('brandEmail')} placeholder="shop@email.com" type="email" />
        </Field>
        <Field label="Address">
          <Textarea value={local.brandAddress} onChange={set('brandAddress')} placeholder="12 Tailor Street, Ikeja, Lagos" rows={2} />
        </Field>
        <Field label="Website / Social">
          <TextInput value={local.brandWebsite} onChange={set('brandWebsite')} placeholder="instagram.com/yourbrand" />
        </Field>
      </div>

    </FullModal>
  )
}

// ─────────────────────────────────────────────
// MODAL: Invoice Settings
// ─────────────────────────────────────────────

function InvoiceModal({ onBack }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    invoicePrefix: settings.invoicePrefix,
    invoiceCurrency: settings.invoiceCurrency,
    invoiceDueDays: settings.invoiceDueDays,
    invoiceShowTax: settings.invoiceShowTax,
    invoiceTaxRate: settings.invoiceTaxRate,
    invoiceFooter: settings.invoiceFooter,
  })

  const set = (key) => (val) => setLocal(p => ({ ...p, [key]: val }))

  const save = () => { updateMany(local); onBack() }

  return (
    <FullModal title="Invoice Settings" onBack={onBack} onSave={save}>

      <div className={s.fieldGroup}>
        <Field label="Invoice Number Prefix" hint="Appears before the invoice number, e.g. INV-0042.">
          <TextInput value={local.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" />
        </Field>
        <Field label="Currency Symbol">
          <SegmentControl
            options={[
              { label: '₦ Naira', value: '₦' },
              { label: '$ Dollar', value: '$' },
              { label: '£ Pound', value: '£' },
              { label: '€ Euro', value: '€' },
            ]}
            value={local.invoiceCurrency}
            onChange={set('invoiceCurrency')}
          />
        </Field>
        <Field label="Default Due Period (days)" hint="How many days after issue is the invoice due.">
          <SegmentControl
            options={[
              { label: '3d', value: 3 },
              { label: '7d', value: 7 },
              { label: '14d', value: 14 },
              { label: '30d', value: 30 },
            ]}
            value={local.invoiceDueDays}
            onChange={set('invoiceDueDays')}
          />
        </Field>
      </div>

      <div className={s.fieldGroup}>
        <div className={s.row} style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={s.rowText}>
            <div className={s.rowLabel}>Show Tax Line</div>
            <div className={s.rowSub}>Add a VAT / tax row to invoice totals</div>
          </div>
          <Toggle on={local.invoiceShowTax} onToggle={() => set('invoiceShowTax')(!local.invoiceShowTax)} />
        </div>
        {local.invoiceShowTax && (
          <Field label="Tax Rate (%)" hint="e.g. 7.5 for 7.5% VAT">
            <TextInput
              type="number"
              value={local.invoiceTaxRate}
              onChange={v => set('invoiceTaxRate')(parseFloat(v) || 0)}
              placeholder="7.5"
            />
          </Field>
        )}
      </div>

      <div className={s.fieldGroup}>
        <Field label="Invoice Footer Text" hint="Printed at the bottom of every invoice.">
          <Textarea
            value={local.invoiceFooter}
            onChange={set('invoiceFooter')}
            placeholder="Thank you for your patronage 🙏"
            rows={3}
          />
        </Field>
      </div>

    </FullModal>
  )
}

// ─────────────────────────────────────────────
// MODAL: Measurements
// ─────────────────────────────────────────────

function MeasureModal({ onBack }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    measureUnit: settings.measureUnit,
    measureFormat: settings.measureFormat,
  })
  const set = (key) => (val) => setLocal(p => ({ ...p, [key]: val }))
  const save = () => { updateMany(local); onBack() }

  return (
    <FullModal title="Measurements" onBack={onBack} onSave={save}>
      <div className={s.fieldGroup}>
        <Field label="Default Unit">
          <SegmentControl
            options={[
              { label: 'Inches (in)', value: 'in' },
              { label: 'Centimetres (cm)', value: 'cm' },
              { label: 'Yards (yd)', value: 'yd' },
            ]}
            value={local.measureUnit}
            onChange={set('measureUnit')}
          />
        </Field>
        <Field label="Number Format" hint="How decimal measurements are displayed.">
          <SegmentControl
            options={[
              { label: '12.5 (Decimal)', value: 'decimal' },
              { label: '12½ (Fraction)', value: 'fraction' },
            ]}
            value={local.measureFormat}
            onChange={set('measureFormat')}
          />
        </Field>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────
// MODAL: Orders
// ─────────────────────────────────────────────

function OrdersModal({ onBack }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    defaultDepositPercent: settings.defaultDepositPercent,
    autoArchiveCompletedOrders: settings.autoArchiveCompletedOrders,
  })
  const set = (key) => (val) => setLocal(p => ({ ...p, [key]: val }))
  const save = () => { updateMany(local); onBack() }

  return (
    <FullModal title="Orders" onBack={onBack} onSave={save}>
      <div className={s.fieldGroup}>
        <Field label="Default Deposit %" hint="Percentage of total collected when order is placed.">
          <SegmentControl
            options={[
              { label: '25%', value: 25 },
              { label: '50%', value: 50 },
              { label: '75%', value: 75 },
              { label: '100%', value: 100 },
            ]}
            value={local.defaultDepositPercent}
            onChange={set('defaultDepositPercent')}
          />
        </Field>
        <div className={s.row} style={{ borderBottom: 'none' }}>
          <div className={s.rowText}>
            <div className={s.rowLabel}>Auto-archive Completed Orders</div>
            <div className={s.rowSub}>Move orders to archive once marked Completed</div>
          </div>
          <Toggle
            on={local.autoArchiveCompletedOrders}
            onToggle={() => set('autoArchiveCompletedOrders')(!local.autoArchiveCompletedOrders)}
          />
        </div>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────
// MODAL: Display & Date
// ─────────────────────────────────────────────

function DisplayModal({ onBack }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    theme: settings.theme,
    dateFormat: settings.dateFormat,
  })
  const set = (key) => (val) => setLocal(p => ({ ...p, [key]: val }))
  const save = () => { updateMany(local); onBack() }

  return (
    <FullModal title="Display & Date" onBack={onBack} onSave={save}>
      <div className={s.fieldGroup}>
        <Field label="Theme">
          <SegmentControl
            options={[
              { label: '☀️ Light', value: 'light' },
              { label: '🌙 Dark', value: 'dark' },
              { label: '⚙️ System', value: 'system' },
            ]}
            value={local.theme}
            onChange={set('theme')}
          />
        </Field>
        <Field label="Date Format">
          <SegmentControl
            options={[
              { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
              { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
              { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
            ]}
            value={local.dateFormat}
            onChange={set('dateFormat')}
          />
        </Field>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────
// RESET confirmation sheet
// ─────────────────────────────────────────────

function ResetSheet({ onConfirm, onCancel }) {
  return (
    <div className={s.sheetOverlay} onClick={onCancel}>
      <div className={s.sheet} onClick={e => e.stopPropagation()}>
        <div className={s.sheetHandle} />
        <p className={s.sheetTitle}>Reset all settings?</p>
        <p className={s.sheetSub}>This will restore every setting to its default value. Your customers and orders won't be affected.</p>
        <button className={s.sheetDestructive} onClick={onConfirm}>Reset Settings</button>
        <button className={s.sheetCancel} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Settings page
// ─────────────────────────────────────────────

const MODALS = {
  brand: BrandModal,
  invoice: InvoiceModal,
  measure: MeasureModal,
  orders: OrdersModal,
  display: DisplayModal,
}

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [activeModal, setActiveModal] = useState(null) // key in MODALS
  const [showReset, setShowReset] = useState(false)

  const open = (key) => () => setActiveModal(key)
  const close = () => setActiveModal(null)

  const handleReset = () => {
    resetSettings()
    setShowReset(false)
  }

  const ModalComponent = activeModal ? MODALS[activeModal] : null

  // Derive display strings
  const themeLabel = { light: '☀️ Light', dark: '🌙 Dark', system: '⚙️ System' }[settings.theme]
  const unitLabel = { in: 'Inches', cm: 'Centimetres', yd: 'Yards' }[settings.measureUnit]

  return (
    <div className={s.page}>
      <TopBar title="Settings" />

      <div className={s.scrollArea}>

        {/* ── APPEARANCE ── */}
        <SectionHeader icon="palette" label="Appearance" />
        <div className={s.card}>
          <Row icon="contrast" iconBg="var(--surface2)" label="Theme" value={themeLabel} onClick={open('display')} />
          <Row icon="calendar_today" iconBg="var(--surface2)" label="Date Format" value={settings.dateFormat} onClick={open('display')} divider={false} />
        </div>

        {/* ── BRAND & BUSINESS ── */}
        <SectionHeader icon="storefront" label="Brand & Business" />
        <div className={s.card}>
          <Row
            icon="badge"
            iconBg="#f59e0b22"
            label="Brand Identity"
            sub={settings.brandName || 'Name, logo, colour, tagline'}
            onClick={open('brand')}
          />
          <Row
            icon="receipt_long"
            iconBg="#10b98122"
            label="Invoice Settings"
            sub={`${settings.invoiceCurrency} · ${settings.invoicePrefix} · Due ${settings.invoiceDueDays}d`}
            onClick={open('invoice')}
            divider={false}
          />
        </div>

        {/* ── MEASUREMENTS ── */}
        <SectionHeader icon="straighten" label="Measurements" />
        <div className={s.card}>
          <Row icon="square_foot" iconBg="#6366f122" label="Default Unit" value={unitLabel} onClick={open('measure')} divider={false} />
        </div>

        {/* ── ORDERS ── */}
        <SectionHeader icon="shopping_bag" label="Orders" />
        <div className={s.card}>
          <Row
            icon="payments"
            iconBg="#ec489922"
            label="Deposit & Archiving"
            sub={`${settings.defaultDepositPercent}% default deposit`}
            onClick={open('orders')}
            divider={false}
          />
        </div>

        {/* ── NOTIFICATIONS ── */}
        <SectionHeader icon="notifications" label="Notifications" />
        <div className={s.card}>
          <Row icon="alarm" iconBg="#f97316aa" label="Overdue Tasks" sub="Alert when tasks pass their due date">
            <Toggle
              on={settings.notifyOverdueTasks}
              onToggle={() => updateSetting('notifyOverdueTasks', !settings.notifyOverdueTasks)}
            />
          </Row>
          <Row icon="cake" iconBg="#ec489944" label="Customer Birthdays" sub="Remind you a day before">
            <Toggle
              on={settings.notifyUpcomingBirthdays}
              onToggle={() => updateSetting('notifyUpcomingBirthdays', !settings.notifyUpcomingBirthdays)}
            />
          </Row>
          <Row icon="money_off" iconBg="#ef444444" label="Unpaid Invoices" sub="Alert for invoices past due date" divider={false}>
            <Toggle
              on={settings.notifyUnpaidInvoices}
              onToggle={() => updateSetting('notifyUnpaidInvoices', !settings.notifyUnpaidInvoices)}
            />
          </Row>
        </div>

        {/* ── DANGER ZONE ── */}
        <SectionHeader icon="warning" label="Data" />
        <div className={s.card}>
          <Row
            icon="restart_alt"
            iconBg="#ef444422"
            label="Reset All Settings"
            sub="Restore defaults. Your data is safe."
            onClick={() => setShowReset(true)}
            divider={false}
          />
        </div>

        <div style={{ height: 32 }} />
      </div>

      {/* ── Active modal ── */}
      {ModalComponent && <ModalComponent onBack={close} />}

      {/* ── Reset confirmation ── */}
      {showReset && <ResetSheet onConfirm={handleReset} onCancel={() => setShowReset(false)} />}
    </div>
  )
}
