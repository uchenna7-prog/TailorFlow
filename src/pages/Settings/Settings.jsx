import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ─────────────────────────────────────────────────────────────
// Invoice template previews
// ─────────────────────────────────────────────────────────────

function EditableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pHeader}>
        <div className={styles.pBrandCenter}>
          <div className={styles.pBrandName}>Your Company Name</div>
          <div className={styles.pBrandSub}>123 Street Address, City, State, Zip Code</div>
        </div>
        <div className={styles.pLargeTitleCenter}>INVOICE</div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pMetaRow}>
          <div><strong>BILL TO:</strong><br />Customer Name<br />Street Address<br />City, State, Zip</div>
          <div style={{ textAlign: 'right' }}>
            Invoice #: <strong>0000001</strong><br />
            Issue Date: <strong>Date Field</strong><br />
            Due Date: <strong>Date Field</strong>
          </div>
        </div>
        <div className={styles.pTableModern}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={styles.pSumRow}><span>Tax</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}><strong>Payment Terms:</strong><br />Add your payment terms such as bank details.</div>
        <div className={styles.pFootSection}><strong>Notes:</strong><br />Add any additional notes.</div>
      </div>
    </div>
  )
}

function PrintableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pGoldBarFull} />
      <div className={styles.pHeaderSplit}>
        <div className={styles.pLargeTitle}>INVOICE</div>
        <div className={styles.pMetaRight}>
          <div>ISSUE DATE: <strong>Date Field</strong></div>
          <div>DUE DATE: <strong>Date Field</strong></div>
          <div>INVOICE #: <strong>0000001</strong></div>
        </div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pMetaRow} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <div><strong>BILL FROM:</strong><br />Your Company Name<br />Street Address<br />Phone Number</div>
          <div style={{ textAlign: 'right' }}><strong>BILL TO:</strong><br />Customer Name<br />Street Address<br />City, State, Zip</div>
        </div>
        <div className={styles.pTableModern} style={{ marginTop: '20px' }}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummarySide}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={styles.pSumRow}><span>Tax</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pTotalBox}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}><strong>Payment Terms:</strong><br />Bank Name, Account #</div>
      </div>
    </div>
  )
}

function CustomTemplate() {
  return (
    <div className={styles.pBase} style={{ padding: 0 }}>
      <div className={styles.pPurpleBanner}>
        <div className={styles.pLogoBoxWhite}>Place logo here</div>
        <div className={styles.pLargeTitleWhite}>INVOICE</div>
        <div className={styles.pWhiteNo}>0000001</div>
      </div>
      <div className={styles.pBody} style={{ padding: '20px' }}>
        <div className={styles.pMetaRow}>
          <div><strong>BILL FROM:</strong><br />Your Company Name</div>
          <div><strong>BILL TO:</strong><br />Customer Name</div>
          <div style={{ textAlign: 'right' }}><strong>DATE:</strong><br />Date Field</div>
        </div>
        <div className={styles.pTableModern} style={{ marginTop: '20px' }}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pPurpleBottom}>
        <div className={styles.pFootSectionWhite}><strong>Payment Terms:</strong> Add details here</div>
      </div>
    </div>
  )
}

function FreeTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pHeaderFree}>
        <div className={styles.pTitleBlock}>
          <div className={styles.pLargeTitle}>INVOICE</div>
          <div className={styles.pSubNo}>0000001</div>
        </div>
        <div className={styles.pLogoPlaceholderBig}>ADD YOUR LOGO</div>
      </div>
      <div className={styles.pFreeGrid}>
        <div className={styles.pFreeBox}><strong>BILL FROM:</strong><br />Your Company Name<br />Address<br />Phone</div>
        <div className={styles.pFreeBox}><strong>BILL TO:</strong><br />Customer Name<br />Address</div>
        <div className={styles.pFreeBox}><strong>DETAILS:</strong><br />Issue: Date<br />Due: Date</div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pTableModern}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pFooterGray}>Thank you for your business!</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, premium = false }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
      {premium && (
        <span className={styles.premiumBadge}>
          <span className="mi" style={{ fontSize: '0.7rem' }}>workspace_premium</span>
          PRO
        </span>
      )}
    </div>
  )
}

function SettingRow({ icon, label, sub, value, children, onClick, chevron, divider = true, locked = false }) {
  return (
    <div
      className={`${styles.row} ${onClick && !locked ? styles.rowTappable : ''} ${locked ? styles.rowLocked : ''} ${!divider ? styles.noDivider : ''}`}
      onClick={locked ? undefined : onClick}
    >
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.15rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {locked
          ? <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)', opacity: 0.7 }}>lock</span>
          : <>
              {value && <span className={styles.rowValue}>{value}</span>}
              {children}
              {chevron && <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 6 }}>chevron_right</span>}
            </>
        }
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!value); }}
      role="switch"
      aria-checked={value}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.segBtn} ${value === opt.value ? styles.segActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function FieldGroup({ children }) {
  return <div className={styles.fieldGroup}>{children}</div>
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
      {children}
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
// Full-screen modal shell
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
      <div className={styles.fullContent}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Invoice Template Picker
// ─────────────────────────────────────────────────────────────

function TemplateModal({ isOpen, currentTemplate, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'editable')

  const TEMPLATES = [
    { id: 'editable',  label: 'Template #1',  Component: EditableTemplate },
    { id: 'printable', label: 'Template #2', Component: PrintableTemplate },
    { id: 'custom',    label: 'Template #3',    Component: CustomTemplate },
    { id: 'free',      label: 'Template #4',      Component: FreeTemplate },
  ]

  if (!isOpen) return null

  return (
    <div className={styles.fullOverlay}>
      <Header 
        type="back" 
        title="Invoice Templates" 
        onBackClick={onClose} 
        customActions={[{ label: 'Select', onClick: () => { onSelect(selected); onClose() } }]}
      />
      <div className={styles.fullContent}>
        {TEMPLATES.map(t => (
          <div key={t.id} className={styles.templateWrapper} onClick={() => setSelected(t.id)}>
            <div className={`${styles.fullPreviewContainer} ${selected === t.id ? styles.fullPreviewActive : ''}`}>
              <t.Component />
            </div>
            <div className={styles.templateInfo}>
              <div className={`${styles.radio} ${selected === t.id ? styles.radioActive : ''}`} />
              <span className={styles.templateLabel}>{t.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Invoice Settings
// ─────────────────────────────────────────────────────────────

function InvoiceSettingsModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()

  const [local, setLocal] = useState({
    invoicePrefix:   settings.invoicePrefix,
    invoiceCurrency: settings.invoiceCurrency,
    invoiceDueDays:  settings.invoiceDueDays,
    invoiceShowTax:  settings.invoiceShowTax,
    invoiceTaxRate:  settings.invoiceTaxRate,
    invoiceFooter:   settings.invoiceFooter,
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    updateMany(local)
    showToast('Invoice settings saved')
    onBack()
  }

  return (
    <FullModal title="Invoice Settings" onBack={onBack} onSave={save}>
      <div>
        <FieldGroup>
          <Field label="Invoice Number Prefix" hint="Shown before the number, e.g. INV-0042.">
            <TextInput value={local.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" />
          </Field>
          <Field label="Currency">
            <SegmentControl
              options={[
                { label: '₦ Naira',  value: '₦' },
                { label: '$ Dollar', value: '$' },
                { label: '£ Pound',  value: '£' },
                { label: '€ Euro',   value: '€' },
              ]}
              value={local.invoiceCurrency}
              onChange={set('invoiceCurrency')}
            />
          </Field>
          <Field label="Default Due Period" hint="Days after issue date the invoice is due.">
            <SegmentControl
              options={[
                { label: '3 days',  value: 3 },
                { label: '7 days',  value: 7 },
                { label: '14 days', value: 14 },
                { label: '30 days', value: 30 },
              ]}
              value={local.invoiceDueDays}
              onChange={set('invoiceDueDays')}
            />
          </Field>
        </FieldGroup>

        <div style={{ height: 12 }} />

        <FieldGroup>
          <div className={styles.row} style={{ borderBottom: local.invoiceShowTax ? '1px solid var(--border)' : 'none' }}>
            <div className={styles.rowIcon}>
              <span className="mi" style={{ fontSize: '1.15rem' }}>percent</span>
            </div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Show Tax Line</div>
              <div className={styles.rowSub}>Add a VAT / tax row to invoice totals</div>
            </div>
            <div className={styles.rowRight}>
              <Toggle value={local.invoiceShowTax} onChange={v => set('invoiceShowTax')(v)} />
            </div>
          </div>
          {local.invoiceShowTax && (
            <Field label="Tax Rate (%)" hint="e.g. 7.5 for 7.5% VAT">
              <TextInput
                type="number"
                value={String(local.invoiceTaxRate)}
                onChange={v => set('invoiceTaxRate')(parseFloat(v) || 0)}
                placeholder="7.5"
              />
            </Field>
          )}
        </FieldGroup>

        <div style={{ height: 12 }} />

        <FieldGroup>
          <Field label="Invoice Footer Text" hint="Printed at the bottom of every invoice.">
            <Textarea
              value={local.invoiceFooter}
              onChange={set('invoiceFooter')}
              placeholder="Thank you for your patronage 🙏"
              rows={3}
            />
          </Field>
        </FieldGroup>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Settings page
// ─────────────────────────────────────────────────────────────

export default function Settings({ onMenuClick, isPremium = false, onUpgrade = () => {} }) {
  const { settings, updateSetting, resetSettings } = useSettings()

  const [toastMsg,      setToastMsg]      = useState('')
  const [templateModal, setTemplateModal] = useState(false)
  const [invoiceModal,  setInvoiceModal]  = useState(false)
  const [clearConfirm,  setClearConfirm]  = useState(false)
  const [resetConfirm,  setResetConfirm]  = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback(msg => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const isDark = settings.theme === 'dark'

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.scrollArea}>

        {/* ── APPEARANCE ── */}
        <SectionHeader icon="palette" label="Appearance" />
        <SettingRow
          icon="dark_mode"
          label="Dark Mode"
          sub={isDark ? 'Dark theme active' : 'Light theme active'}
        >
          <Toggle
            value={isDark}
            onChange={v => updateSetting('theme', v ? 'dark' : 'light')}
          />
        </SettingRow>

        {/* ── INVOICE ── */}
        <SectionHeader icon="receipt_long" label="Invoice" />
        <SettingRow
          icon="tune"
          label="Invoice Settings"
          sub={`${settings.invoiceCurrency} · ${settings.invoicePrefix} · Due ${settings.invoiceDueDays}d`}
          onClick={() => setInvoiceModal(true)}
          chevron
        />
        <SettingRow
          icon="description"
          label="Invoice Template"
          sub="Choose your preferred invoice design"
          value={settings.invoiceTemplate}
          onClick={() => setTemplateModal(true)}
          chevron
        />

        {/* ── NOTIFICATIONS ── */}
        <SectionHeader icon="notifications" label="Notifications" />
        <SettingRow icon="alarm" label="Overdue Tasks" sub="Alert when tasks pass their due date">
          <Toggle
            value={settings.notifyOverdueTasks}
            onChange={v => updateSetting('notifyOverdueTasks', v)}
          />
        </SettingRow>
        <SettingRow icon="cake" label="Customer Birthdays" sub="Remind you a day before">
          <Toggle
            value={settings.notifyUpcomingBirthdays}
            onChange={v => updateSetting('notifyUpcomingBirthdays', v)}
          />
        </SettingRow>
        <SettingRow icon="money_off" label="Unpaid Invoices" sub="Alert for invoices past due date">
          <Toggle
            value={settings.notifyUnpaidInvoices}
            onChange={v => updateSetting('notifyUnpaidInvoices', v)}
          />
        </SettingRow>

        {/* ── DATA ── */}
        <SectionHeader icon="storage" label="Data" />
        <SettingRow
          icon="restart_alt"
          label="Reset All Settings"
          sub="Restore defaults. Your customers and orders are safe."
          onClick={() => setResetConfirm(true)}
          chevron
        />
        <SettingRow
          icon="delete_forever"
          label="Clear All Data"
          sub="Permanently delete everything"
          onClick={() => setClearConfirm(true)}
          chevron
          divider={false}
        />

        <div style={{ height: 32 }} />
      </div>

      <TemplateModal
        isOpen={templateModal}
        currentTemplate={settings.invoiceTemplate}
        onClose={() => setTemplateModal(false)}
        onSelect={v => { updateSetting('invoiceTemplate', v); showToast('Template selected') }}
      />

      {invoiceModal && (
        <InvoiceSettingsModal
          onBack={() => setInvoiceModal(false)}
          showToast={showToast}
        />
      )}

      <ConfirmSheet
        open={clearConfirm}
        title="Delete All Data?"
        onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared') }}
        onCancel={() => setClearConfirm(false)}
      />
      <ConfirmSheet
        open={resetConfirm}
        title="Reset All Settings?"
        onConfirm={() => { resetSettings(); setResetConfirm(false); showToast('Settings reset') }}
        onCancel={() => setResetConfirm(false)}
      />

      <Toast message={toastMsg} />
    </div>
  )
}
