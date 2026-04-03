import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useBrand } from '../../../contexts/BrandContext'
import Header from '../../../components/Header/Header'
import styles from './InvoiceView.module.css'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmt(currency, amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calcTax(subtotal, taxRate, showTax) {
  if (!showTax || !taxRate) return 0
  return subtotal * (taxRate / 100)
}

function getDueDate(invoice, dueDays) {
  if (invoice.due) return invoice.due
  try {
    const d = new Date(invoice.date)
    d.setDate(d.getDate() + (dueDays || 7))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

// ─────────────────────────────────────────────────────────────
// Shared inner pieces
// ─────────────────────────────────────────────────────────────

function LogoOrName({ brand, darkBg = false }) {
  if (brand.logo) {
    return <img src={brand.logo} alt={brand.name} className={styles.logoImg} />
  }
  return (
    <div className={styles.logoText} style={{ color: darkBg ? '#fff' : '#1a1a1a' }}>
      {brand.name || 'Your Brand'}
    </div>
  )
}

function ItemsTable({ invoice, brand }) {
  const { currency, showTax, taxRate } = brand

  // ───── UPDATED: correct subtotal calculation ─────
  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : 0

  const tax   = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tHead}>
        <span className={styles.tColDesc}>Description</span>
        <span className={styles.tColNum}>Price</span>
      </div>

      {/* Main Order Row */}
      <div className={styles.tRowMain}>
        <div className={styles.tColDesc}>{invoice.orderDesc || 'Garment Order'}</div>
        <div className={styles.tColNum}>{fmt(currency, subtotal)}</div>
      </div>

      {/* Itemized breakdown (Cloths Involved) */}
      {invoice.items?.length > 0 && (
        <div className={styles.itemizedSection}>
          <div className={styles.itemizedLabel}>Garments Included:</div>
          {invoice.items.map((item, idx) => (
            <div key={idx} className={styles.tRowSub}>
              <span className={styles.tColDesc}>• {item.name}</span>
              <span className={styles.tColNum}>{fmt(currency, item.price)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.sumRow}>
          <span>Subtotal</span>
          <span>{fmt(currency, subtotal)}</span>
        </div>
        {showTax && taxRate > 0 && (
          <div className={styles.sumRow}>
            <span>Tax ({taxRate}%)</span>
            <span>{fmt(currency, tax)}</span>
          </div>
        )}
        <div className={`${styles.sumRow} ${styles.sumTotal}`}>
          <span>Total Due</span>
          <span>{fmt(currency, total)}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES (Editable, Printable, Custom, Free)
// ─────────────────────────────────────────────────────────────

function EditableTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  return (
    <div className={styles.tplBase}>
      <div className={styles.editHeader}>
        <LogoOrName brand={brand} />
        {brand.tagline && <div className={styles.editTagline}>{brand.tagline}</div>}
        {brand.address && <div className={styles.editAddr}>{brand.address}</div>}
        <div className={styles.editTitle}>INVOICE</div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaSub}>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>INVOICE #</div>
          <div className={styles.metaVal}>{invoice.number}</div>
          <div className={styles.metaSub}>Issue: {invoice.date}</div>
          <div className={styles.metaSub}>Due: {dueDate}</div>
        </div>
      </div>
      <ItemsTable invoice={invoice} brand={brand} />
      {(brand.phone || brand.email || brand.footer) && (
        <div className={styles.editFooter}>
          <div className={styles.footSection}>
            <strong>Payment / Contact</strong><br />
            {brand.phone && <span>{brand.phone}<br /></span>}
            {brand.email && <span>{brand.email}<br /></span>}
            {brand.footer && <span>{brand.footer}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function PrintableTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const barColor = brand.colour || '#eab308'
  return (
    <div className={styles.tplBase}>
      <div className={styles.printBar} style={{ background: barColor }} />
      <div className={styles.printHeaderSplit}>
        <div className={styles.printTitle}>INVOICE</div>
        <div style={{ textAlign: 'right', fontSize: 9 }}>
          <div>ISSUE DATE: <strong>{invoice.date}</strong></div>
          <div>DUE DATE: <strong>{dueDate}</strong></div>
          <div>INVOICE #: <strong>{invoice.number}</strong></div>
        </div>
      </div>
      <div className={styles.metaRow} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 16 }}>
        <div>
          <div className={styles.metaLabel}>BILL FROM</div>
          <div className={styles.metaVal}>{brand.name || brand.ownerName}</div>
          {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
          {brand.phone && <div className={styles.metaSub}>{brand.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
        </div>
      </div>
      <ItemsTable invoice={invoice} brand={brand} />
      <div className={styles.printFooter}>
        {brand.footer && <div className={styles.footSection}>{brand.footer}</div>}
      </div>
    </div>
  )
}

function CustomTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const bannerBg = brand.colour || '#7c3aed'
  return (
    <div className={styles.tplBase} style={{ padding: 0 }}>
      <div className={styles.customBanner} style={{ background: bannerBg }}>
        <div className={styles.customBannerLogo}><LogoOrName brand={brand} darkBg /></div>
        <div className={styles.customBannerRight}>
          <div className={styles.customBannerTitle}>INVOICE</div>
          <div className={styles.customBannerNum}>{invoice.number}</div>
        </div>
      </div>
      <div className={styles.customBody}>
        <div className={styles.metaRow} style={{ marginBottom: 16 }}>
          <div>
            <div className={styles.metaLabel}>BILL FROM</div>
            <div className={styles.metaVal}>{brand.name}</div>
            {brand.phone && <div className={styles.metaSub}>{brand.phone}</div>}
          </div>
          <div>
            <div className={styles.metaLabel}>BILL TO</div>
            <div className={styles.metaVal}>{customer.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.metaLabel}>DATE</div>
            <div className={styles.metaSub}>{invoice.date}</div>
          </div>
        </div>
        <ItemsTable invoice={invoice} brand={brand} />
      </div>
      <div className={styles.customFooter} style={{ background: bannerBg }}>
        <div className={styles.customFooterText}>{brand.footer || 'Thank you for your patronage'}</div>
      </div>
    </div>
  )
}

function FreeTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  return (
    <div className={styles.tplBase}>
      <div className={styles.freeHeader}>
        <div><div className={styles.printTitle}>INVOICE</div><div className={styles.freeNum}>{invoice.number}</div></div>
        <div className={styles.freeLogoBox}><LogoOrName brand={brand} /></div>
      </div>
      <div className={styles.freeGrid}>
        <div className={styles.freeBox}><strong>BILL FROM</strong><br />{brand.name}<br />{brand.phone}</div>
        <div className={styles.freeBox}><strong>BILL TO</strong><br />{customer.name}<br />{customer.phone}</div>
        <div className={styles.freeBox}><strong>DETAILS</strong><br />Date: {invoice.date}<br />Due: {dueDate}</div>
      </div>
      <ItemsTable invoice={invoice} brand={brand} />
      <div className={styles.freeFooter}>{brand.footer || 'Thank you!'}</div>
    </div>
  )
}

const TEMPLATE_MAP = {
  editable:  EditableTemplate,
  printable: PrintableTemplate,
  custom:    CustomTemplate,
  free:      FreeTemplate,
}

const STATUS_LABELS = { unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue' }
const STATUS_NEXT   = { unpaid: 'paid', paid: 'unpaid', overdue: 'paid' }

async function generatePDF(paperEl, filename) {
  const canvas = await html2canvas(paperEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = (canvas.height * pdfW) / canvas.width
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
  pdf.save(filename)
}

export default function InvoiceView({ invoice: initialInvoice, customer, onClose, onStatusChange, onDelete, showToast }) {
  const { brand } = useBrand()
  const paperRef = useRef(null)
  const [invoice, setInvoice] = useState(initialInvoice)
  const [pdfLoading, setPdfLoading] = useState(false)

  const templateKey = brand.template || 'editable'
  const Template = TEMPLATE_MAP[templateKey] || EditableTemplate

  const handleToggleStatus = () => {
    const newStatus = STATUS_NEXT[invoice.status] || 'paid'
    onStatusChange(invoice.id, newStatus)
    setInvoice(prev => ({ ...prev, status: newStatus }))
    showToast?.(`Marked as ${newStatus}`)
  }

  const handleShare = async () => {
    if (!paperRef.current) return
    setPdfLoading(true)
    showToast?.('Generating PDF…')
    try {
      const filename = `${invoice.number}-${customer.name.replace(/\s+/g, '_')}.pdf`
      await generatePDF(paperRef.current, filename)
      showToast?.('PDF downloaded ✓')
    } catch (err) {
      showToast?.('PDF failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <Header
        type="back"
        title={invoice.number}
        onBackClick={onClose}
        customActions={[
          { 
            icon: pdfLoading ? 'hourglass_top' : 'download',  
            onClick: handleShare, 
            disabled: pdfLoading 
          }
        ]}
      />

      <div className={styles.scrollArea}>
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
            {STATUS_LABELS[invoice.status] || invoice.status}
          </div>
        </div>

        <div className={styles.paperWrap} ref={paperRef}>
          <Template invoice={invoice} customer={customer} brand={brand} />
        </div>
        {invoice.notes && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>Notes</div>
            <div className={styles.notesText}>{invoice.notes}</div>
          </div>
        )}
        <div style={{ height: 100 }} />
      </div>

      <div className={styles.bottomBar}>
        <button className={`${styles.statusBtn} ${invoice.status === 'paid' ? styles.statusBtnUnpaid : styles.statusBtnPaid}`} onClick={handleToggleStatus}>
          <span className="mi" style={{ fontSize: '1rem' }}>{invoice.status === 'paid' ? 'undo' : 'check_circle'}</span>
          {invoice.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
        </button>
        <button className={styles.deleteBtn} onClick={() => onDelete(invoice.id)}><span className="mi">delete</span></button>
      </div>
    </div>
  )
}

