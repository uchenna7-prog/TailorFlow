import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ── TEMPLATE COMPONENT 1: EDITABLE (Centered Brand) ──
function EditableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pEditHeader}>
        <div className={styles.pBrandSmall}>Your Company Name</div>
        <div className={styles.pBrandSub}>Street Address, City, State</div>
        <div className={styles.pLargeTitle}>INVOICE</div>
      </div>
      <div className={styles.pMetaRow}>
        <div className={styles.pBillTo}><strong>BILL TO:</strong><br/>Customer Name</div>
        <div className={styles.pInvoiceInfo}>
          <div>Inv #: 0000001</div>
          <div>Date: 30/03/2026</div>
        </div>
      </div>
      <div className={styles.pModernTable}>
        <div className={styles.pMHead}><span>Description</span><span>Price</span><span>Total</span></div>
        <div className={styles.pMRow}><span>Tailored Suit</span><span>$0.00</span><span>$0.00</span></div>
      </div>
    </div>
  )
}

// ── TEMPLATE COMPONENT 2: PRINTABLE (Gold Accent) ──
function PrintableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pGoldBar} />
      <div className={styles.pPrintHeader}>
        <div className={styles.pLargeTitle}>INVOICE</div>
        <div className={styles.pInvoiceInfoRight}>
          <span>ISSUE DATE: 30/03/2026</span>
          <span>INVOICE #: 0000001</span>
        </div>
      </div>
      <div className={styles.pMetaSplit}>
        <div><strong>BILL FROM:</strong><br/>Your Company</div>
        <div style={{textAlign: 'right'}}><strong>BILL TO:</strong><br/>Customer Name</div>
      </div>
      <div className={styles.pModernTable}>
        <div className={styles.pMHead}><span>Description</span><span>QTY</span><span>Total</span></div>
        <div className={styles.pMRow}><span>Line Item</span><span>1</span><span>$0.00</span></div>
      </div>
    </div>
  )
}

// ── TEMPLATE COMPONENT 3: CUSTOM (Purple Banner) ──
function CustomTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pPurpleHeader}>
        <div className={styles.pLogoBox}>Place logo here</div>
        <div className={styles.pLargeTitleWhite}>INVOICE</div>
      </div>
      <div className={styles.pMetaRow} style={{marginTop: 10}}>
        <div><strong>BILL FROM:</strong><br/>Your Company</div>
        <div><strong>BILL TO:</strong><br/>Customer Name</div>
      </div>
      <div className={styles.pModernTable}>
        <div className={styles.pMHead}><span>Description</span><span>Price</span><span>Total</span></div>
        <div className={styles.pMRow}><span>Service Item</span><span>$0.00</span><span>$0.00</span></div>
      </div>
      <div className={styles.pPurpleFooter} />
    </div>
  )
}

// ── TEMPLATE COMPONENT 4: FREE (Boxed Header) ──
function FreeTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pFreeHeader}>
        <div className={styles.pTitleBlock}>
          <div className={styles.pLargeTitle}>INVOICE</div>
          <div className={styles.pSubNo}>0000001</div>
        </div>
        <div className={styles.pLogoPlaceholder}>ADD YOUR LOGO</div>
      </div>
      <div className={styles.pGrayBorderBox}>
        <div className={styles.pBoxCol}><strong>BILL FROM:</strong><br/>Your Company</div>
        <div className={styles.pBoxCol}><strong>BILL TO:</strong><br/>Customer Name</div>
        <div className={styles.pBoxCol}><strong>DATE:</strong><br/>30/03/2026</div>
      </div>
      <div className={styles.pModernTable}>
        <div className={styles.pMHead}><span>Description</span><span>Total</span></div>
        <div className={styles.pMRow}><span>Line Item & Description</span><span>$0.00</span></div>
      </div>
    </div>
  )
}

// ── SMALL REUSABLE COMPONENTS ──
function SectionHeader({ icon, label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
    </div>
  )
}

function SettingRow({ icon, label, sub, children, onClick, chevron }) {
  return (
    <div className={`${styles.row} ${onClick ? styles.rowTappable : ''}`} onClick={onClick}>
      <div className={styles.rowIcon}><span className="mi" style={{ fontSize: '1.15rem' }}>{icon}</span></div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {children}
        {chevron && <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 6 }}>chevron_right</span>}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button className={`${styles.toggle} ${value ? styles.toggleOn : ''}`} onClick={() => onChange(!value)}>
      <span className={styles.toggleThumb} />
    </button>
  )
}

// ── TEMPLATE MODAL ──
function TemplateModal({ isOpen, currentTemplate, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'editable')

  const TEMPLATES = [
    { id: 'editable', label: 'Editable Template', Component: EditableTemplate },
    { id: 'printable', label: 'Printable Template', Component: PrintableTemplate },
    { id: 'custom', label: 'Custom Template', Component: CustomTemplate },
    { id: 'free', label: 'Free Template', Component: FreeTemplate }
  ]

  if (!isOpen) return null

  return (
    <div className={styles.editOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.templateSheet}>
        <div className={styles.editHandle} />
        <div className={styles.editHeader}>
          <span className={styles.editTitle}>Choose Invoice Template</span>
          <button className={styles.editClose} onClick={onClose}><span className="mi">close</span></button>
        </div>
        <div className={styles.templateList}>
          {TEMPLATES.map(t => (
            <div key={t.id} className={styles.templateOption} onClick={() => setSelected(t.id)}>
              <div className={`${styles.templatePreview} ${selected === t.id ? styles.previewActive : ''}`}>
                <t.Component />
              </div>
              <div className={styles.templateFooter}>
                <div className={`${styles.radio} ${selected === t.id ? styles.radioActive : ''}`} />
                <span className={styles.templateLabel}>{t.label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.editFooter}>
          <button className={styles.editSave} onClick={() => { onSelect(selected); onClose() }}>Select</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function Settings({ onMenuClick }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [toastMsg, setToastMsg]   = useState('')
  const [templateModal, setTemplateModal] = useState(false)
  const [clearConfirm, setClearConfirm]   = useState(false)
  const [resetConfirm, setResetConfirm]   = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />
      <div className={styles.scrollArea}>
        <SectionHeader icon="palette" label="Appearance" />
        <div className={styles.card}>
          <SettingRow icon="dark_mode" label="Dark Mode" sub="Toggle dark appearance">
            <Toggle value={settings.theme === 'dark'} onChange={v => updateSetting('theme', v ? 'dark' : 'light')} />
          </SettingRow>
        </div>

        <SectionHeader icon="receipt_long" label="Invoice" />
        <div className={styles.card}>
          <SettingRow icon="description" label="Invoice Template" sub="Choose your design" chevron onClick={() => setTemplateModal(true)}>
            <span className={styles.rowValue}>{settings.invoiceTemplate || 'Editable'}</span>
          </SettingRow>
          <div className={styles.divider} />
          <SettingRow icon="tag" label="Prefix" sub="Invoice Numbering">
            <span className={styles.rowValue}>{settings.invoicePrefix}</span>
          </SettingRow>
        </div>

        <SectionHeader icon="storage" label="Data Management" />
        <div className={styles.card}>
          <SettingRow icon="restart_alt" label="Reset Settings" chevron onClick={() => setResetConfirm(true)} />
          <div className={styles.divider} />
          <SettingRow icon="delete_forever" label="Clear All Data" chevron onClick={() => setClearConfirm(true)}>
            <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700 }}>Danger</span>
          </SettingRow>
        </div>
      </div>

      <TemplateModal isOpen={templateModal} currentTemplate={settings.invoiceTemplate} onClose={() => setTemplateModal(false)} onSelect={(val) => { updateSetting('invoiceTemplate', val); showToast('Template updated ✓') }} />
      <ConfirmSheet open={clearConfirm} title="Clear All Data?" onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared'); }} onCancel={() => setClearConfirm(false)} />
      <ConfirmSheet open={resetConfirm} title="Reset Settings?" onConfirm={() => { resetSettings(); setResetConfirm(false); showToast('Reset'); }} onCancel={() => setResetConfirm(false)} />
      <Toast message={toastMsg} />
    </div>
  )
}
