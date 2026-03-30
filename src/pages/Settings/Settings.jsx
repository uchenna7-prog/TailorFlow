import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'


function StandardTemplate() {
  return (
    <div className={styles.previewBase}>
      <div className={styles.pHeader}>BILL</div>
      <div className={styles.pBrand}>TailorMate Demo</div>
      <div className={styles.pDetails}>Date: Apr 14, 2025 • Order: DJ458</div>
      <div className={styles.pTable}>
        <div className={styles.pRow}><span>Pants #1</span><span>1000.00</span></div>
        <div className={styles.pRow}><span>Pants #2</span><span>1000.00</span></div>
        <div className={styles.pRow}><span>Pants #3</span><span>1200.00</span></div>
      </div>
      <div className={styles.pTotal}>Total: 5600.00</div>
    </div>
  )
}

function ConsolidatedTemplate() {
  return (
    <div className={styles.previewBase}>
      <div className={styles.pHeader}>BILL</div>
      <div className={styles.pBrand}>TailorMate Demo</div>
      <div className={styles.pDetails}>Date: Apr 14, 2025 • Order: DJ458</div>
      <div className={styles.pTable}>
        <div className={styles.pHead}><span>Name</span><span>Qty</span><span>Price</span></div>
        <div className={styles.pRow}><span>Pants</span><span>2</span><span>1200.00</span></div>
        <div className={styles.pRow}><span>Shirt</span><span>3</span><span>1500.00</span></div>
      </div>
      <div className={styles.pTotal}>Total: 2700.00</div>
    </div>
  )
}

function PriceBreakupTemplate() {
  return (
    <div className={styles.previewBase}>
      <div className={styles.pHeader}>BILL</div>
      <div className={styles.pBrand}>TailorMate Demo</div>
      <div className={styles.pDetails}>Date: May 23, 2025 • Order: BD926</div>
      <div className={styles.pTable}>
        <div className={styles.pRow}><strong>Kurti #1</strong><strong>1600.00</strong></div>
        <div className={styles.pSub}>Standard Price: 800</div>
        <div className={styles.pSub}>Lining: 300</div>
        <div className={styles.pSub}>Embroidery: 500</div>
      </div>
      <div className={styles.pTotal}>Total: 3400.00</div>
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

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt => (
        <button key={opt.value} className={`${styles.segBtn} ${value === opt.value ? styles.segActive : ''}`} onClick={() => onChange(opt.value)}>
          {opt.icon && <span className="mi" style={{ fontSize: '1rem' }}>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── TEMPLATE MODAL ──
function TemplateModal({ isOpen, currentTemplate, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'standard')

  const TEMPLATES = [
    { id: 'standard', label: 'Standard (A5)', Component: StandardTemplate },
    { id: 'consolidated', label: 'Consolidated (A5)', Component: ConsolidatedTemplate },
    { id: 'price_breakup', label: 'Price Breakup (A5)', Component: PriceBreakupTemplate }
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

// ── EDIT MODAL ──
function EditModal({ isOpen, title, value, placeholder, multiline, onClose, onSave }) {
  const [val, setVal] = useState(value)
  const handleSave = () => { onSave(val); onClose() }
  const handleClose = () => { setVal(value); onClose() }
  if (!isOpen) return null
  return (
    <div className={styles.editOverlay} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className={styles.editSheet}>
        <div className={styles.editHandle} />
        <div className={styles.editHeader}>
          <span className={styles.editTitle}>{title}</span>
          <button className={styles.editClose} onClick={handleClose}><span className="mi">close</span></button>
        </div>
        <div className={styles.editBody}>
          {multiline ? (
            <textarea className={styles.editInput} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} rows={3} autoFocus />
          ) : (
            <input type="text" className={styles.editInput} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} autoFocus />
          )}
        </div>
        <div className={styles.editFooter}><button className={styles.editSave} onClick={handleSave}>Save</button></div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function Settings({ onMenuClick }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [toastMsg, setToastMsg]   = useState('')
  const [editModal, setEditModal] = useState(null)
  const [templateModal, setTemplateModal] = useState(false)
  const [clearConfirm, setClearConfirm]   = useState(false)
  const [resetConfirm, setResetConfirm]   = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const openEdit = (key, title, placeholder, multiline = false) => setEditModal({ key, title, placeholder, multiline })
  const handleEditSave = (val) => {
    if (!editModal) return
    updateSetting(editModal.key, val)
    showToast('Saved ✓')
  }

  const THEME_OPTIONS = [
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'system', label: 'System', icon: 'brightness_auto' },
  ]

  const CURRENCY_OPTIONS = [
    { value: '₦', label: '₦ NGN' }, { value: '$', label: '$ USD' }, { value: '£', label: '£ GBP' },
    { value: '€', label: '€ EUR' }, { value: 'GH₵', label: 'GH₵ GHS' },
  ]

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />
      <div className={styles.scrollArea}>
        <SectionHeader icon="palette" label="Appearance" />
        <div className={styles.card}>
          <SettingRow icon="dark_mode" label="Theme" sub="Choose your preferred appearance">
            <SegmentControl options={THEME_OPTIONS} value={settings.theme} onChange={v => { updateSetting('theme', v); showToast(`${v} mode`) }} />
          </SettingRow>
        </div>

        <SectionHeader icon="receipt_long" label="Invoice" />
        <div className={styles.card}>
          <SettingRow icon="description" label="Invoice Template" sub="Choose your layout design" chevron onClick={() => setTemplateModal(true)}>
            <span className={styles.rowValue}>{settings.invoiceTemplate?.replace('_', ' ') || 'Standard'}</span>
          </SettingRow>
          <div className={styles.divider} />
          <SettingRow icon="tag" label="Invoice Prefix" sub={`Starting with ${settings.invoicePrefix}`} chevron onClick={() => openEdit('invoicePrefix', 'Invoice Prefix', 'e.g. INV')}>
            <span className={styles.rowValue}>{settings.invoicePrefix}</span>
          </SettingRow>
          <div className={styles.divider} />
          <SettingRow icon="currency_exchange" label="Currency">
            <div className={styles.currencyPicker}>
              {CURRENCY_OPTIONS.map(c => (
                <button key={c.value} className={`${styles.currencyBtn} ${settings.invoiceCurrency === c.value ? styles.currencyActive : ''}`} onClick={() => { updateSetting('invoiceCurrency', c.value); showToast('Currency updated ✓') }}>{c.label}</button>
              ))}
            </div>
          </SettingRow>
        </div>

        <SectionHeader icon="notifications" label="Notifications" />
        <div className={styles.card}>
          <SettingRow icon="schedule" label="Overdue Tasks" sub="Alert when tasks are past due">
            <Toggle value={settings.notifyOverdueTasks} onChange={v => updateSetting('notifyOverdueTasks', v)} />
          </SettingRow>
          <div className={styles.divider} />
          <SettingRow icon="money_off" label="Unpaid Invoices" sub="Highlight invoices awaiting payment">
            <Toggle value={settings.notifyUnpaidInvoices} onChange={v => updateSetting('notifyUnpaidInvoices', v)} />
          </SettingRow>
        </div>

        <SectionHeader icon="storage" label="Data Management" />
        <div className={styles.card}>
          <SettingRow icon="restart_alt" label="Reset Settings" sub="Restore defaults" chevron onClick={() => setResetConfirm(true)} />
          <div className={styles.divider} />
          <SettingRow icon="delete_forever" label="Clear All Data" sub="Delete all shop data" chevron onClick={() => setClearConfirm(true)}>
            <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700 }}>Danger</span>
          </SettingRow>
        </div>
        <div style={{ height: 40 }} />
      </div>

      <TemplateModal isOpen={templateModal} currentTemplate={settings.invoiceTemplate} onClose={() => setTemplateModal(false)} onSelect={(val) => { updateSetting('invoiceTemplate', val); showToast('Template updated ✓') }} />
      <EditModal isOpen={!!editModal} title={editModal?.title ?? ''} value={editModal ? settings[editModal.key] ?? '' : ''} placeholder={editModal?.placeholder ?? ''} multiline={editModal?.multiline ?? false} onClose={() => setEditModal(null)} onSave={handleEditSave} />
      <ConfirmSheet open={clearConfirm} title="Clear All Data?" message="This cannot be undone." onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared'); }} onCancel={() => setClearConfirm(false)} />
      <ConfirmSheet open={resetConfirm} title="Reset Settings?" message="Return to defaults?" onConfirm={() => { resetSettings(); setResetConfirm(false); showToast('Reset'); }} onCancel={() => setResetConfirm(false)} />
      <Toast message={toastMsg} />
    </div>
  )
}
