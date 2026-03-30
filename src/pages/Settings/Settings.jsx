import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ── 1. EDITABLE TEMPLATE (Full Document) ──
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
          <div><strong>BILL TO:</strong><br/>Customer Name<br/>Street Address<br/>City, State, Zip</div>
          <div style={{ textAlign: 'right' }}>
            Invoice #: <strong>0000001</strong><br/>
            Issue Date: <strong>Date Field</strong><br/>
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
        <div className={styles.pFootSection}><strong>Payment Terms:</strong><br/>Add your payment terms such as bank details.</div>
        <div className={styles.pFootSection}><strong>Notes:</strong><br/>Add any additional notes.</div>
      </div>
    </div>
  )
}

// ── 2. PRINTABLE TEMPLATE (Full Document) ──
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
          <div><strong>BILL FROM:</strong><br/>Your Company Name<br/>Street Address<br/>Phone Number</div>
          <div style={{ textAlign: 'right' }}><strong>BILL TO:</strong><br/>Customer Name<br/>Street Address<br/>City, State, Zip</div>
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
        <div className={styles.pFootSection}><strong>Payment Terms:</strong><br/>Bank Name, Account #</div>
      </div>
    </div>
  )
}

// ── 3. CUSTOM TEMPLATE (Full Document) ──
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
          <div><strong>BILL FROM:</strong><br/>Your Company Name</div>
          <div><strong>BILL TO:</strong><br/>Customer Name</div>
          <div style={{ textAlign: 'right' }}><strong>DATE:</strong><br/>Date Field</div>
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

// ── 4. FREE TEMPLATE (Full Document) ──
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
        <div className={styles.pFreeBox}><strong>BILL FROM:</strong><br/>Your Company Name<br/>Address<br/>Phone</div>
        <div className={styles.pFreeBox}><strong>BILL TO:</strong><br/>Customer Name<br/>Address</div>
        <div className={styles.pFreeBox}><strong>DETAILS:</strong><br/>Issue: Date<br/>Due: Date</div>
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
      <div className={styles.pFooterGray}>
        Thank you for your business!
      </div>
    </div>
  )
}

// ── SETTINGS PAGE COMPONENTS ──

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

function TemplateModal({ isOpen, currentTemplate, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'editable')

  const TEMPLATES = [
    { id: 'editable', label: 'Editable Clothing Store', Component: EditableTemplate },
    { id: 'printable', label: 'Printable Clothing Store', Component: PrintableTemplate },
    { id: 'custom', label: 'Custom Clothing Store', Component: CustomTemplate },
    { id: 'free', label: 'Free Clothing Store', Component: FreeTemplate }
  ]

  if (!isOpen) return null

  return (
    <div className={styles.fullOverlay}>
      <div className={styles.fullHeader}>
        <button className={styles.backBtn} onClick={onClose}>
          <span className="mi">arrow_back</span>
        </button>
        <span className={styles.fullTitle}>Invoice Templates</span>
        <button className={styles.fullSave} onClick={() => { onSelect(selected); onClose() }}>Select</button>
      </div>
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
          <SettingRow icon="dark_mode" label="Dark Mode" sub="Toggle interface theme">
            <Toggle value={settings.theme === 'dark'} onChange={v => updateSetting('theme', v ? 'dark' : 'light')} />
          </SettingRow>
        </div>

        <SectionHeader icon="receipt_long" label="Invoice" />
        <div className={styles.card}>
          <SettingRow icon="description" label="Choose Template" sub="Select your preferred invoice design" chevron onClick={() => setTemplateModal(true)}>
            <span className={styles.rowValue}>{settings.invoiceTemplate || 'Editable'}</span>
          </SettingRow>
        </div>

        <SectionHeader icon="storage" label="Data" />
        <div className={styles.card}>
          <SettingRow icon="delete_forever" label="Clear Data" chevron onClick={() => setClearConfirm(true)} />
        </div>
      </div>

      <TemplateModal 
        isOpen={templateModal} 
        currentTemplate={settings.invoiceTemplate} 
        onClose={() => setTemplateModal(false)} 
        onSelect={(v) => { updateSetting('invoiceTemplate', v); showToast('Template Selected') }} 
      />

      <ConfirmSheet open={clearConfirm} title="Delete All Data?" onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared'); }} onCancel={() => setClearConfirm(false)} />
      <ConfirmSheet open={resetConfirm} title="Reset?" onConfirm={() => { resetSettings(); setResetConfirm(false); showToast('Reset'); }} onCancel={() => setResetConfirm(false)} />
      <Toast message={toastMsg} />
    </div>
  )
}
