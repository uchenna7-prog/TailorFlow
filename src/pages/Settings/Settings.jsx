import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ─────────────────────────────────────────────────────────────
// Invoice template previews (Preserved exactly)
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
// Shared primitives (Updated to match photo style)
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1.2rem', color: 'var(--text)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
    </div>
  )
}

function SettingRow({ icon, label, sub, value, children, onClick, edit, divider = true }) {
  return (
    <div
      className={`${styles.row} ${onClick ? styles.rowTappable : ''}`}
      onClick={onClick}
      style={!divider ? { borderBottom: 'none' } : {}}
    >
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.4rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {value && <span className={styles.rowValue}>{value}</span>}
        {children}
        {edit && <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 6 }}>edit</span>}
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

function FieldGroup({ children }) { return <div className={styles.fieldGroup}>{children}</div> }
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
  return <input className={styles.textInput} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
}
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className={styles.textarea} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
}

// ─────────────────────────────────────────────────────────────
// Modals (Unchanged)
// ─────────────────────────────────────────────────────────────

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={styles.fullOverlay}>
      <Header type="back" title={title} onBackClick={onBack} customActions={onSave ? [{ label: 'Save', onClick: onSave }] : []} />
      <div className={styles.fullContent}>{children}</div>
    </div>
  )
}

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
      <Header type="back" title="Invoice Templates" onBackClick={onClose} customActions={[{ label: 'Select', onClick: () => { onSelect(selected); onClose() } }]} />
      <div className={styles.fullContent}>
        {TEMPLATES.map(t => (
          <div key={t.id} className={styles.templateWrapper} onClick={() => setSelected(t.id)}>
            <div className={`${styles.fullPreviewContainer} ${selected === t.id ? styles.fullPreviewActive : ''}`}><t.Component /></div>
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

function InvoiceSettingsModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    invoicePrefix: settings.invoicePrefix,
    invoiceCurrency: settings.invoiceCurrency,
    invoiceDueDays: settings.invoiceDueDays,
    invoiceShowTax: settings.invoiceShowTax,
    invoiceTaxRate: settings.invoiceTaxRate,
    invoiceFooter: settings.invoiceFooter,
  })
  const set = key => val => setLocal(p => ({ ...p, [key]: val }))
  const save = () => { updateMany(local); showToast('Invoice settings saved'); onBack() }
  return (
    <FullModal title="Invoice Settings" onBack={onBack} onSave={save}>
      <FieldGroup>
        <Field label="Invoice Number Prefix"><TextInput value={local.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" /></Field>
        <Field label="Currency">
          <SegmentControl options={[{ label: '₦ Naira', value: '₦' }, { label: '$ Dollar', value: '$' }, { label: '£ Pound', value: '£' }, { label: '€ Euro', value: '€' }]} value={local.invoiceCurrency} onChange={set('invoiceCurrency')} />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <div className={styles.row} style={{ borderBottom: local.invoiceShowTax ? '1px solid var(--border)' : 'none' }}>
           <div className={styles.rowText}><div className={styles.rowLabel}>Show Tax Line</div></div>
           <Toggle value={local.invoiceShowTax} onChange={v => set('invoiceShowTax')(v)} />
        </div>
        {local.invoiceShowTax && <Field label="Tax Rate (%)"><TextInput type="number" value={String(local.invoiceTaxRate)} onChange={v => set('invoiceTaxRate')(parseFloat(v) || 0)} /></Field>}
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Settings page
// ─────────────────────────────────────────────────────────────

export default function Settings({ onMenuClick }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [toastMsg, setToastMsg] = useState('')
  const [templateModal, setTemplateModal] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback(msg => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="Settings" />

      <div className={styles.scrollArea}>
        
        {/* Services */}
        <SectionHeader icon="groups" label="Services Offered:" />
        <div className={styles.servicesRow}>
            <div className={styles.chip}><span className={styles.dot} /> Stitching</div>
            <div className={styles.chip}><span className={styles.dot} /> Material</div>
            <div className={styles.chip}><span className={styles.dot} /> Readymade</div>
        </div>
        <SettingRow icon="person" label="Cloth Pickup from Customer Site:">
          <Toggle value={settings.pickupEnabled} onChange={v => updateSetting('pickupEnabled', v)} />
        </SettingRow>
        <SettingRow icon="person" label="Measurement at Customer Site:">
          <Toggle value={settings.siteMeasurement} onChange={v => updateSetting('siteMeasurement', v)} />
        </SettingRow>
        <SettingRow icon="person" label="Accept Online Orders from Customer via TailorMate App:">
          <Toggle value={settings.onlineOrders} onChange={v => updateSetting('onlineOrders', v)} />
        </SettingRow>

        {/* Measurement */}
        <div className={styles.row}>
          <div className={styles.rowIcon}><span className="mi">straighten</span></div>
          <div className={styles.rowText}><div className={styles.rowLabel}>Measurement Unit :</div></div>
          <SegmentControl 
            options={[{label: 'Cms', value: 'cms'}, {label: 'Inch', value: 'inch'}]} 
            value={settings.unit || 'inch'} 
            onChange={v => updateSetting('unit', v)} 
          />
        </div>

        {/* Tax */}
        <SectionHeader icon="receipt" label="Tax Details:" />
        <SettingRow icon="person" label="VAT Bill">
          <Toggle value={settings.invoiceShowTax} onChange={v => updateSetting('invoiceShowTax', v)} />
        </SettingRow>

        {/* Order Format */}
        <div className={styles.row}>
          <div className={styles.rowIcon}><span className="mi">format_list_numbered</span></div>
          <div className={styles.rowText}><div className={styles.rowLabel}>Order Number Format :</div></div>
          <SegmentControl 
            options={[{label: 'Random', value: 'random'}, {label: 'Serial', value: 'serial'}, {label: 'Custom', value: 'custom'}]} 
            value={settings.orderFormat || 'serial'} 
            onChange={v => updateSetting('orderFormat', v)} 
          />
        </div>

        {/* App Customisation */}
        <SectionHeader icon="list" label="App Customisation:" />
        <SettingRow icon="person" label="Customize when to send Message to Cu...">
           <Toggle value={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow icon="person" label="Customize Terms on Bill:">
           <Toggle value={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow icon="person" label="Customize Bill Number:">
           <Toggle value={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow icon="person" label="Hide Standard Dress Items:">
           <Toggle value={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow icon="person" label="Default No. of Days to Show in Order List:" value="90" onClick={() => {}} edit />

        {/* Templates */}
        <SectionHeader icon="grid_view" label="Templates:" />
        <SettingRow icon="picture_as_pdf" label="Invoice Format:" value="Standard (A5)" onClick={() => setInvoiceModal(true)} edit />
        <SettingRow icon="picture_as_pdf" label="Order PDF Format:" value="Quick Print (A5)" onClick={() => setTemplateModal(true)} edit />

        <div className={styles.btnContainer}>
            <button className={styles.saveBtn} onClick={() => showToast('Settings Saved')}>Save Settings</button>
            <button className={styles.deleteBtn} onClick={() => setClearConfirm(true)}>Delete My Account</button>
        </div>

        <div style={{ height: 40 }} />
      </div>

      <TemplateModal isOpen={templateModal} currentTemplate={settings.invoiceTemplate} onClose={() => setTemplateModal(false)} onSelect={v => { updateSetting('invoiceTemplate', v); showToast('Template selected') }} />
      {invoiceModal && <InvoiceSettingsModal onBack={() => setInvoiceModal(false)} showToast={showToast} />}
      <ConfirmSheet open={clearConfirm} title="Delete Account?" onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared') }} onCancel={() => setClearConfirm(false)} />
      <Toast message={toastMsg} />
    </div>
  )
}
