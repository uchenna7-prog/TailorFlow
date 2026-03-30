import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

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
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.15rem' }}>{icon}</span>
      </div>
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
        <button
          key={opt.value}
          className={`${styles.segBtn} ${value === opt.value ? styles.segActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <span className="mi" style={{ fontSize: '1rem' }}>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── TEMPLATE SELECTION MODAL ──
function TemplateModal({ isOpen, current, onClose, onSelect }) {
  if (!isOpen) return null

  const templates = [
    { id: 'standard', name: 'Standard (A5)', img: '/templates/standard.png', desc: 'Itemized list with delivery dates' },
    { id: 'consolidated', name: 'Consolidated (A5)', img: '/templates/consolidated.png', desc: 'Grouped items by category' },
    { id: 'breakup', name: 'Price Breakup (A5)', img: '/templates/breakup.png', desc: 'Detailed labor and material costs' }
  ]

  return (
    <div className={styles.editOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.editSheet} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.editHeader}>
          <span className={styles.editTitle}>Select Invoice Template</span>
          <button className={styles.editClose} onClick={onClose}>
            <span className="mi">close</span>
          </button>
        </div>
        <div className={styles.templateList}>
          {templates.map(t => (
            <div 
              key={t.id} 
              className={`${styles.templateCard} ${current === t.id ? styles.templateActive : ''}`}
              onClick={() => onSelect(t.id)}
            >
              <div className={styles.templatePreview}>
                {/* Placeholder for the actual visual style */}
                <div className={styles.previewHeader}>BILL</div>
                <div className={styles.previewLine} style={{ width: '40%' }} />
                <div className={styles.previewTable}>
                  <div className={styles.previewRow} />
                  <div className={styles.previewRow} />
                </div>
                <div className={styles.previewBadge}>{t.name}</div>
              </div>
              <div className={styles.templateInfo}>
                <div className={styles.radioCircle}>
                    {current === t.id && <div className={styles.radioInner} />}
                </div>
                <span>{t.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.editFooter}>
          <button className={styles.editSave} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

// ── EDIT MODAL ──
function EditModal({ isOpen, title, value, placeholder, multiline, onClose, onSave }) {
  const [val, setVal] = useState(value)
  const handleSave = () => { onSave(val); onClose() }
  if (!isOpen) return null

  return (
    <div className={styles.editOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.editSheet}>
        <div className={styles.editHeader}>
          <span className={styles.editTitle}>{title}</span>
          <button className={styles.editClose} onClick={onClose}><span className="mi">close</span></button>
        </div>
        <div className={styles.editBody}>
          {multiline ? (
            <textarea className={styles.editInput} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} rows={3} autoFocus />
          ) : (
            <input type="text" className={styles.editInput} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} autoFocus />
          )}
        </div>
        <div className={styles.editFooter}>
          <button className={styles.editSave} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function Settings({ onMenuClick }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [toastMsg, setToastMsg] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const handleExportData = () => {
    try {
      const data = {}
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('tailorbook')) data[k] = JSON.parse(localStorage.getItem(k))
      })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tailorbook-backup-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Data exported ✓')
    } catch { showToast('Export failed') }
  }

  const THEME_OPTIONS = [
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'system', label: 'System', icon: 'brightness_auto' },
  ]

  const CURRENCY_OPTIONS = [
    { value: '₦', label: '₦' },
    { value: '$', label: '$' },
    { value: '£', label: '£' },
    { value: '€', label: '€' },
  ]

  return (
    <div className={styles.page}>
      <Header title="Settings" leftIcon="menu" onLeftClick={onMenuClick} />
      
      <div className={styles.scrollArea}>
        {/* ── APPEARANCE ── */}
        <SectionHeader icon="palette" label="Appearance" />
        <div className={styles.card}>
          <SettingRow icon="dark_mode" label="Theme" sub="Choose your preferred appearance">
            <SegmentControl 
              options={THEME_OPTIONS} 
              value={settings.theme} 
              onChange={v => { updateSetting('theme', v); showToast(`${v} mode`) }} 
            />
          </SettingRow>
        </div>

        {/* ── INVOICE ── */}
        <SectionHeader icon="receipt_long" label="Invoice Configuration" />
        <div className={styles.card}>
          <SettingRow 
            icon="description" 
            label="Invoice Template" 
            sub={settings.invoiceTemplate === 'breakup' ? 'Price Breakup' : settings.invoiceTemplate === 'consolidated' ? 'Consolidated' : 'Standard'} 
            chevron 
            onClick={() => setTemplateOpen(true)} 
          />
          <div className={styles.divider} />
          <SettingRow 
            icon="tag" 
            label="Invoice Prefix" 
            sub={`Current: ${settings.invoicePrefix}`} 
            chevron 
            onClick={() => setEditModal({ key: 'invoicePrefix', title: 'Invoice Prefix', placeholder: 'e.g. INV' })}
          >
            <span className={styles.rowValue}>{settings.invoicePrefix}</span>
          </SettingRow>
          <div className={styles.divider} />
          <SettingRow icon="currency_exchange" label="Currency">
            <div className={styles.currencyPicker}>
              {CURRENCY_OPTIONS.map(c => (
                <button 
                  key={c.value} 
                  className={`${styles.currencyBtn} ${settings.invoiceCurrency === c.value ? styles.currencyActive : ''}`}
                  onClick={() => { updateSetting('invoiceCurrency', c.value); showToast('Currency updated') }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </SettingRow>
          <div className={styles.divider} />
          <SettingRow 
            icon="chat" 
            label="Footer Message" 
            sub={settings.invoiceFooter || 'Thank you for your patronage!'} 
            chevron 
            onClick={() => setEditModal({ key: 'invoiceFooter', title: 'Invoice Footer', placeholder: 'Footer message...', multiline: true })} 
          />
        </div>

        {/* ── NOTIFICATIONS ── */}
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

        {/* ── DATA ── */}
        <SectionHeader icon="storage" label="Data Management" />
        <div className={styles.card}>
          <SettingRow icon="download" label="Export Data" sub="Download JSON backup" chevron onClick={handleExportData} />
          <div className={styles.divider} />
          <SettingRow icon="restart_alt" label="Reset Settings" chevron onClick={() => setResetConfirm(true)} />
          <div className={styles.divider} />
          <SettingRow icon="delete_forever" label="Clear All Data" chevron onClick={() => setClearConfirm(true)}>
            <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700 }}>Danger</span>
          </SettingRow>
        </div>

        <div style={{ height: 40 }} />
      </div>

      <TemplateModal 
        isOpen={templateOpen} 
        current={settings.invoiceTemplate || 'standard'} 
        onClose={() => setTemplateOpen(false)}
        onSelect={(id) => { updateSetting('invoiceTemplate', id); showToast('Template updated') }}
      />

      <EditModal 
        isOpen={!!editModal} 
        {...editModal}
        value={editModal ? settings[editModal.key] : ''}
        onClose={() => setEditModal(null)} 
        onSave={(val) => { updateSetting(editModal.key, val); showToast('Saved ✓') }} 
      />

      <ConfirmSheet open={clearConfirm} title="Clear All Data?" message="This cannot be undone." onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared'); }} onCancel={() => setClearConfirm(false)} />
      <ConfirmSheet open={resetConfirm} title="Reset Settings?" message="Return to defaults?" onConfirm={() => { resetSettings(); setResetConfirm(false); showToast('Reset'); }} onCancel={() => setResetConfirm(false)} />
      <Toast message={toastMsg} />
    </div>
  )
}
