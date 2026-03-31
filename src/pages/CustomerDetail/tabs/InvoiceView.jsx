import { useBrand } from '../../contexts/BrandContext'
import styles from './InvoiceView.module.css'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmt(currency, amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calcSubtotal(price, qty) {
  return (parseFloat(price) || 0) * (parseFloat(qty) || 1)
}

function calcTax(subtotal, taxRate, showTax) {
  if (!showTax || !taxRate) return 0
  return subtotal * (taxRate / 100)
}

// Due date: invoice.due is already a string from the order, else compute from issue date + dueDays
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
    return (
      <img
        src={brand.logo}
        alt={brand.name}
        className={styles.logoImg}
      />
    )
  }
  return (
    <div
      className={styles.logoText}
      style={{ color: darkBg ? '#fff' : '#1a1a1a' }}
    >
      {brand.name || 'Your Brand'}
    </div>
  )
}

function ItemsTable({ invoice, brand, subtotal }) {
  const { currency, showTax, taxRate } = brand
  const tax   = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (
    <>
      <div className={styles.tHead}>
        <span className={styles.tColDesc}>Description</span>
        <span className={styles.tColNum}>Price</span>
        <span className={styles.tColNum}>Qty</span>
        <span className={styles.tColNum}>Total</span>
      </div>
      <div className={styles.tRow}>
        <span className={styles.tColDesc}>{invoice.orderDesc || 'Garment order'}</span>
        <span className={styles.tColNum}>{fmt(currency, invoice.price)}</span>
        <span className={styles.tColNum}>{invoice.qty || 1}</span>
        <span className={styles.tColNum}>{fmt(currency, subtotal)}</span>
      </div>

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
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE 1 — Editable (classic centered brand header)
// ─────────────────────────────────────────────────────────────

function EditableTemplate({ invoice, customer, brand }) {
  const subtotal = calcSubtotal(invoice.price, invoice.qty)
  const dueDate  = getDueDate(invoice, brand.dueDays)

  return (
    <div className={styles.tplBase}>

      {/* Header */}
      <div className={styles.editHeader}>
        <LogoOrName brand={brand} />
        {brand.tagline && <div className={styles.editTagline}>{brand.tagline}</div>}
        {brand.address && <div className={styles.editAddr}>{brand.address}</div>}
        <div className={styles.editTitle}>INVOICE</div>
      </div>

      {/* Bill to / meta */}
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

      {/* Items */}
      <ItemsTable invoice={invoice} brand={brand} subtotal={subtotal} />

      {/* Footer */}
      {(brand.address || brand.footer) && (
        <div className={styles.editFooter}>
          {brand.address && (
            <div className={styles.footSection}>
              <strong>Payment / Contact</strong><br />
              {brand.phone && <span>{brand.phone}<br /></span>}
              {brand.email && <span>{brand.email}<br /></span>}
              {brand.website && <span>{brand.website}</span>}
            </div>
          )}
          {brand.footer && (
            <div className={styles.footSection}>{brand.footer}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE 2 — Printable (gold bar top, split header)
// ─────────────────────────────────────────────────────────────

function PrintableTemplate({ invoice, customer, brand }) {
  const subtotal = calcSubtotal(invoice.price, invoice.qty)
  const dueDate  = getDueDate(invoice, brand.dueDays)
  const barColor = brand.colour || '#eab308'

  return (
    <div className={styles.tplBase}>

      {/* Colour bar */}
      <div className={styles.printBar} style={{ background: barColor }} />

      {/* Title + meta */}
      <div className={styles.printHeaderSplit}>
        <div className={styles.printTitle}>INVOICE</div>
        <div style={{ textAlign: 'right', fontSize: 9 }}>
          <div>ISSUE DATE: <strong>{invoice.date}</strong></div>
          <div>DUE DATE: <strong>{dueDate}</strong></div>
          <div>INVOICE #: <strong>{invoice.number}</strong></div>
        </div>
      </div>

      {/* From / To */}
      <div className={styles.metaRow} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 16 }}>
        <div>
          <div className={styles.metaLabel}>BILL FROM</div>
          <div className={styles.metaVal}>{brand.name || brand.ownerName}</div>
          {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
          {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
          {brand.email   && <div className={styles.metaSub}>{brand.email}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaSub}>{customer.address}</div>}
        </div>
      </div>

      <ItemsTable invoice={invoice} brand={brand} subtotal={subtotal} />

      <div className={styles.printFooter}>
        {brand.footer && <div className={styles.footSection}>{brand.footer}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE 3 — Custom (coloured banner, brand logo prominent)
// ─────────────────────────────────────────────────────────────

function CustomTemplate({ invoice, customer, brand }) {
  const subtotal  = calcSubtotal(invoice.price, invoice.qty)
  const dueDate   = getDueDate(invoice, brand.dueDays)
  const bannerBg  = brand.colour || '#7c3aed'

  return (
    <div className={styles.tplBase} style={{ padding: 0 }}>

      {/* Coloured banner */}
      <div className={styles.customBanner} style={{ background: bannerBg }}>
        <div className={styles.customBannerLogo}>
          {brand.logo
            ? <img src={brand.logo} alt={brand.name} className={styles.bannerLogoImg} />
            : <div className={styles.bannerLogoText}>{brand.name || 'Brand'}</div>
          }
        </div>
        <div className={styles.customBannerRight}>
          <div className={styles.customBannerTitle}>INVOICE</div>
          <div className={styles.customBannerNum}>{invoice.number}</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* From / To / Date */}
        <div className={styles.metaRow} style={{ marginBottom: 16 }}>
          <div>
            <div className={styles.metaLabel}>BILL FROM</div>
            <div className={styles.metaVal}>{brand.name || brand.ownerName}</div>
            {brand.phone && <div className={styles.metaSub}>{brand.phone}</div>}
          </div>
          <div>
            <div className={styles.metaLabel}>BILL TO</div>
            <div className={styles.metaVal}>{customer.name}</div>
            {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.metaLabel}>DATE</div>
            <div className={styles.metaSub}>{invoice.date}</div>
            <div className={styles.metaLabel} style={{ marginTop: 4 }}>DUE</div>
            <div className={styles.metaSub}>{dueDate}</div>
          </div>
        </div>

        <ItemsTable invoice={invoice} brand={brand} subtotal={subtotal} />
      </div>

      {/* Coloured footer */}
      <div className={styles.customFooter} style={{ background: bannerBg }}>
        <div className={styles.customFooterText}>
          {brand.footer || 'Thank you for your patronage'}
        </div>
        {brand.email && (
          <div className={styles.customFooterSub}>{brand.email}</div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE 4 — Free (minimal, logo top-right)
// ─────────────────────────────────────────────────────────────

function FreeTemplate({ invoice, customer, brand }) {
  const subtotal = calcSubtotal(invoice.price, invoice.qty)
  const dueDate  = getDueDate(invoice, brand.dueDays)

  return (
    <div className={styles.tplBase}>

      {/* Header row */}
      <div className={styles.freeHeader}>
        <div>
          <div className={styles.printTitle}>INVOICE</div>
          <div className={styles.freeNum}>{invoice.number}</div>
        </div>
        <div className={styles.freeLogoBox}>
          {brand.logo
            ? <img src={brand.logo} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span className={styles.freeLogoPlaceholder}>{brand.name || 'LOGO'}</span>
          }
        </div>
      </div>

      {/* 3-column info grid */}
      <div className={styles.freeGrid}>
        <div className={styles.freeBox}>
          <strong>BILL FROM</strong><br />
          {brand.name || brand.ownerName}<br />
          {brand.address && <>{brand.address}<br /></>}
          {brand.phone}
        </div>
        <div className={styles.freeBox}>
          <strong>BILL TO</strong><br />
          {customer.name}<br />
          {customer.phone && <>{customer.phone}<br /></>}
          {customer.address}
        </div>
        <div className={styles.freeBox}>
          <strong>DETAILS</strong><br />
          Issue: {invoice.date}<br />
          Due: {dueDate}
        </div>
      </div>

      <ItemsTable invoice={invoice} brand={brand} subtotal={subtotal} />

      <div className={styles.freeFooter}>
        {brand.footer || 'Thank you for your business!'}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE SWITCHER
// ─────────────────────────────────────────────────────────────

const TEMPLATE_MAP = {
  editable:  EditableTemplate,
  printable: PrintableTemplate,
  custom:    CustomTemplate,
  free:      FreeTemplate,
}

// ─────────────────────────────────────────────────────────────
// InvoiceView — full-screen overlay
// ─────────────────────────────────────────────────────────────

export default function InvoiceView({ invoice, customer, onClose }) {
  const { brand } = useBrand()

  const templateKey = brand.template || 'editable'
  const Template    = TEMPLATE_MAP[templateKey] || EditableTemplate

  const handleShare = () => {
    const text =
      `*${brand.name || 'Invoice'}*\n` +
      `Invoice: ${invoice.number}\n` +
      `Date: ${invoice.date}\n` +
      `Amount: ${brand.currency}${invoice.price}\n` +
      `Status: ${invoice.status}\n\n` +
      (brand.footer || '')

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className={styles.overlay}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.topBtn} onClick={onClose}>
          <span className="mi">arrow_back</span>
        </button>
        <div className={styles.topCenter}>
          <div className={styles.topInvNum}>{invoice.number}</div>
          <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
            {invoice.status}
          </div>
        </div>
        <button className={styles.topBtn} onClick={handleShare}>
          <span className="mi">share</span>
        </button>
      </div>

      {/* ── Template area ── */}
      <div className={styles.scrollArea}>
        <div className={styles.paperWrap}>
          <Template invoice={invoice} customer={customer} brand={brand} />
        </div>

        {/* Linked measurements note */}
        {invoice.linkedNames?.length > 0 && (
          <div className={styles.linkedNote}>
            <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>straighten</span>
            <span className={styles.linkedNoteText}>
              Measurements: {invoice.linkedNames.join(', ')}
            </span>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>Notes</div>
            <div className={styles.notesText}>{invoice.notes}</div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
