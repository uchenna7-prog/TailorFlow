import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ─────────────────────────────────────────────────────────────
// Shared tailoring data
// ─────────────────────────────────────────────────────────────
const TAILOR_ROWS = [
  ['Custom Agbada Sewing','₦8,500','1','₦8,500'],
  ['Senator Suit Stitching','₦6,200','2','₦12,400'],
  ['Ankara Dress Alteration','₦2,500','3','₦7,500'],
  ['Bridal Gown Fitting','₦15,000','1','₦15,000'],
  ['Trouser Hemming','₦1,200','4','₦4,800'],
  ['Kaftan Embroidery','₦4,000','2','₦8,000'],
]

// ══════════════════════════════════════════════════════════════
// UI PRIMITIVES (Moved up for clarity)
// ══════════════════════════════════════════════════════════════

function SectionHeader({ icon, label, premium = false }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize:'1rem',color:'var(--text3)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
      {premium && (
        <span className={styles.premiumBadge}>
          <span className="mi" style={{ fontSize:'0.7rem' }}>workspace_premium</span>PRO
        </span>
      )}
    </div>
  )
}

function SettingRow({ icon, label, sub, value, children, onClick, chevron, divider=true, locked=false }) {
  return (
    <div
      className={`${styles.row} ${onClick&&!locked?styles.rowTappable:''} ${locked?styles.rowLocked:''} ${!divider?styles.noDivider:''}`}
      onClick={locked?undefined:onClick}
    >
      <div className={styles.rowIcon}><span className="mi" style={{ fontSize:'1.15rem' }}>{icon}</span></div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {sub&&<div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {locked
          ?<span className="mi" style={{ fontSize:'1.1rem',color:'var(--accent)',opacity:0.7 }}>lock</span>
          :<>{value&&<span className={styles.rowValue}>{value}</span>}{children}{chevron&&<span className="mi" style={{ fontSize:'1rem',color:'var(--text3)',marginLeft:6 }}>chevron_right</span>}</>
        }
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button className={`${styles.toggle} ${value?styles.toggleOn:''}`} onClick={e=>{e.stopPropagation();onChange(!value);}} role="switch" aria-checked={value}>
      <span className={styles.toggleThumb} />
    </button>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt=>(
        <button key={opt.value} className={`${styles.segBtn} ${value===opt.value?styles.segActive:''}`} onClick={()=>onChange(opt.value)}>{opt.label}</button>
      ))}
    </div>
  )
}

function FieldGroup({ children }) { return <div className={styles.fieldGroup}>{children}</div> }

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint&&<p className={styles.fieldHint}>{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type='text' }) {
  return <input className={styles.textInput} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} />
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  return <textarea className={styles.textarea} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} />
}

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={styles.fullOverlay}>
      <Header type="back" title={title} onBackClick={onBack} customActions={onSave?[{label:'Save',onClick:onSave}]:[]} />
      <div className={styles.fullContent}>{children}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATES (Grouped together cleanly)
// ══════════════════════════════════════════════════════════════

// GROUP A
function EditableTemplate() { return (<div className={styles.pBase}>...</div>) }
function FreeTemplate() { return (<div className={styles.pBase}>...</div>) }

// GROUP B
function CustomTemplate() { return (<div className={styles.pBase}>...</div>) }
function PrintableTemplate() { return (<div className={styles.p4Base}>...</div>) }

// GROUP C
function CanvaTemplate() { return (<div className={styles.t5Base}>...</div>) }

// GROUP D
function DarkHeaderTemplate() { return (<div className={styles.t6Base}>...</div>) }

// GROUP E
function RedBoldTemplate() { return (<div className={styles.t7Base}>...</div>) }

// GROUP F
function GreenAccentTemplate() { return (<div className={styles.t8Base}>...</div>) }
function TealGeometricTemplate() { return (<div className={styles.t9Base}>...</div>) }

// GROUP G
function PinkDiagonalTemplate() { return (<div className={styles.t10Base}>...</div>) }
function BlackGeometricTemplate() { return (<div className={styles.t12Base}>...</div>) }

// GROUP H
function BlueCleanTemplate() { return (<div className={styles.t11Base}>...</div>) }

// ══════════════════════════════════════════════════════════════
// TEMPLATE GROUP CONFIG
// ══════════════════════════════════════════════════════════════

const TEMPLATE_GROUPS = [
  {
    groupLabel:'Clean & Minimal',
    groupDesc:'No logo, no signature',
    groupIcon:'article',
    templates:[
      { id:'editable', label:'1. Centred Line Invoice', desc:'Bill To, payment terms and notes', Component:EditableTemplate },
      { id:'free', label:'2. Three-Column Info Bar', desc:'Logo placeholder with grey footer', Component:FreeTemplate },
    ]
  },
  {
    groupLabel:'Logo Placeholder',
    groupDesc:'No signature',
    groupIcon:'badge',
    templates:[
      { id:'custom', label:'3. Purple Banner', desc:'Dashed logo box, purple header and footer', Component:CustomTemplate },
      { id:'printable', label:'4. Printable Classic', desc:'Bill From/To side by side, clean totals', Component:PrintableTemplate },
    ]
  },
  {
    groupLabel:'Warm Minimal',
    groupDesc:'Payment info, no logo',
    groupIcon:'receipt',
    templates:[
      { id:'canva', label:'5. Warm Beige Classic', desc:'Bold title with sender info footer', Component:CanvaTemplate },
    ]
  },
  {
    groupLabel:'Dark Header Corporate',
    groupDesc:'Logo with multi-column header',
    groupIcon:'business',
    templates:[
      { id:'darkheader', label:'6. Black Header Corporate', Component:DarkHeaderTemplate },
    ]
  },
  {
    groupLabel:'Bold From / To',
    groupDesc:'Numbered items with red accent',
    groupIcon:'format_list_numbered',
    templates:[
      { id:'redbold', label:'7. Red Bold From/To', Component:RedBoldTemplate },
    ]
  },
  {
    groupLabel:'Brand Colour Box',
    groupDesc:'Logo, colour panel and signature',
    groupIcon:'palette',
    templates:[
      { id:'greenaccent', label:'8. Green Accent', Component:GreenAccentTemplate },
      { id:'tealgeometric', label:'9. Teal Geometric', Component:TealGeometricTemplate },
    ]
  },
  {
    groupLabel:'Angular & Diagonal',
    groupDesc:'Full-width colour bands',
    groupIcon:'style',
    templates:[
      { id:'pinkdiagonal', label:'10. Pink Full Diagonal', Component:PinkDiagonalTemplate },
      { id:'blackgeometric', label:'12. Black Trapezoid', Component:BlackGeometricTemplate },
    ]
  },
  {
    groupLabel:'Blue Professional',
    groupDesc:'Logo, amount and payment boxes',
    groupIcon:'corporate_fare',
    templates:[
      { id:'blueclean', label:'11. Blue Clean', Component:BlueCleanTemplate },
    ]
  },
]

// ══════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════

function TemplateModal({ isOpen, currentTemplate, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'editable')
  if (!isOpen) return null

  return (
    <div className={styles.fullOverlay}>
      <Header type="back" title="Invoice Templates" onBackClick={onClose}
        customActions={[{label:'Select',onClick:()=>{onSelect(selected);onClose()}}]} />

      <div className={styles.fullContent}>
        {TEMPLATE_GROUPS.map(group=>(
          <div key={group.groupLabel}>
            <div className={styles.groupHeader}>
              <div className={styles.groupHeaderInner}>
                <span className={styles.groupLabel}>{group.groupLabel}</span>
                {group.groupDesc && <span className={styles.groupDesc}>{group.groupDesc}</span>}
              </div>
            </div>

            {group.templates.map(t=>(
              <div key={t.id} className={styles.templateWrapper} onClick={()=>setSelected(t.id)}>
                <div className={`${styles.fullPreviewContainer} ${selected===t.id?styles.fullPreviewActive:''}`}>
                  <t.Component />
                </div>
                <div className={styles.templateInfo}>
                  <div className={`${styles.radio} ${selected===t.id?styles.radioActive:''}`} />
                  <div className={styles.templateLabelGroup}>
                    <span className={styles.templateLabel}>{t.label}</span>
                    {t.desc && <span className={styles.templateDesc}>{t.desc}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ══════════════════════════════════════════════════════════════

export default function Settings({ onMenuClick, isPremium=false, onUpgrade=()=>{} }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [toastMsg,setToastMsg]=useState('')
  const [templateModal,setTemplateModal]=useState(false)
  const [invoiceModal,setInvoiceModal]=useState(false)
  const [clearConfirm,setClearConfirm]=useState(false)
  const [resetConfirm,setResetConfirm]=useState(false)

  const toastTimer=useRef(null)
  const showToast=useCallback(msg=>{
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current=setTimeout(()=>setToastMsg(''),2400)
  },[])

  const isDark=settings.theme==='dark'

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.scrollArea}>
        <SectionHeader icon="palette" label="Appearance" />
        <SettingRow icon="dark_mode" label="Dark Mode">
          <Toggle value={isDark} onChange={v=>updateSetting('theme',v?'dark':'light')} />
        </SettingRow>

        <SectionHeader icon="receipt_long" label="Invoice" />
        <SettingRow icon="tune" label="Invoice Settings" onClick={()=>setInvoiceModal(true)} chevron />
        <SettingRow icon="description" label="Invoice Template" onClick={()=>setTemplateModal(true)} chevron />

        <SectionHeader icon="notifications" label="Notifications" />
        <SettingRow icon="alarm" label="Overdue Tasks">
          <Toggle value={settings.notifyOverdueTasks} onChange={v=>updateSetting('notifyOverdueTasks',v)} />
        </SettingRow>

        <SectionHeader icon="storage" label="Data" />
        <SettingRow icon="restart_alt" label="Reset All Settings" onClick={()=>setResetConfirm(true)} chevron />
        <SettingRow icon="delete_forever" label="Clear All Data" onClick={()=>setClearConfirm(true)} chevron />
      </div>

      <TemplateModal isOpen={templateModal} currentTemplate={settings.invoiceTemplate}
        onClose={()=>setTemplateModal(false)}
        onSelect={v=>{updateSetting('invoiceTemplate',v);showToast('Template selected')}} />

      <ConfirmSheet open={clearConfirm} title="Delete All Data?"
        onConfirm={()=>{localStorage.clear();setClearConfirm(false);showToast('Cleared')}}
        onCancel={()=>setClearConfirm(false)} />

      <ConfirmSheet open={resetConfirm} title="Reset All Settings?"
        onConfirm={()=>{resetSettings();setResetConfirm(false);showToast('Settings reset')}}
        onCancel={()=>setResetConfirm(false)} />

      <Toast message={toastMsg} />
    </div>
  )
}