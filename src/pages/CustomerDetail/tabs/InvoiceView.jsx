import { useBrand } from '../../../contexts/BrandContext'
import styles from './InvoiceView.module.css'

function fmt(currency, amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function calcSubtotal(price, qty) {
  return (parseFloat(price) || 0) * (parseFloat(qty) || 1)
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
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

// ─────────────────────────────────────────────────────────────
// Shared inner pieces
// ─────────────────────────────────────────────────────────────

function LogoOrName({ brand, darkBg = false }) {
  if (brand.logo) {
    return <img src={brand.logo} alt={brand.name} className={styles.logoImg} />
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
  const tax = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (
    <>
      <div className={styles.itemsTable}>
        <div>Description</div>
        <div>Price</div>
        <div>Qty</div>
        <div>Total</div>

        <div>{invoice.orderDesc || 'Garment order'}</div>
        <div>{fmt(currency, invoice.price)}</div>
        <div>{invoice.qty || 1}</div>
        <div>{fmt(currency, subtotal)}</div>
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
// TEMPLATE 1 — Editable
// ─────────────────────────────────────────────────────────────

function EditableTemplate({ invoice, customer, brand }) {
  const subtotal = calcSubtotal(invoice.price, invoice.qty)
  const dueDate = getDueDate(invoice, brand.dueDays)

  return (
    <div className={styles.tplBase}>
      <div className={styles.editHeader}>
        <LogoOrName brand={brand} />
        {brand.tagline && (
          <div className={styles.editTagline}>{brand.tagline}</div>
        )}
        {brand.address && (
          <div className={styles.editAddr}>{brand.address}</div>
        )}
        <div className={styles.editTitle}>INVOICE</div>
      </div>

      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && (
            <div className={styles.metaSub}>{customer.phone}</div>
          )}
          {customer.address && (
            <div className={styles.metaSub}>{customer.address}</div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>INVOICE #</div>
          <div className={styles.metaVal}>{invoice.number}</div>
          <div className={styles.metaSub}>Issue: {invoice.date}</div>
          <div className={styles.metaSub}>Due: {dueDate}</div>
        </div>
      </div>

      <ItemsTable invoice={invoice} brand={brand} subtotal={subtotal} />

      {(brand.address || brand.footer) && (
        <div className={styles.editFooter}>
          {brand.address && (
            <div className={styles.footSection}>
              <strong>Payment / Contact</strong>
              <br />
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
// TEMPLATE 2 — Printable
// ─────────────────────────────────────────────────────────────

function PrintableTemplate({ invoice, customer, brand }) {
  const subtotal = calcSubtotal(invoice.price, invoice.qty)
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

      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>BILL FROM</div>
          <div className={styles.metaVal}>{brand.name || brand.ownerName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
        </div>
      </div>

      <ItemsTable invoice={invoice} brand={brand} subtotal={subtotal} />

      <div className={styles.printFooter}>
        {brand.footer && <div>{brand.footer}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE SWITCHER
// ─────────────────────────────────────────────────────────────

const TEMPLATE_MAP = {
  editable: EditableTemplate,
  printable: PrintableTemplate,
}

// ─────────────────────────────────────────────────────────────
// InvoiceView
// ─────────────────────────────────────────────────────────────

export default function InvoiceView({ invoice, customer, onClose }) {
  const { brand } = useBrand()

  const templateKey = brand.template || 'editable'
  const Template = TEMPLATE_MAP[templateKey] || EditableTemplate

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
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <button className={styles.topBtn} onClick={onClose}>
          <span className="mi">arrow_back</span>
        </button>

        <div className={styles.topCenter}>
          <div className={styles.topInvNum}>{invoice.number}</div>
          <div className={styles.statusBadge}>
            {invoice.status}
          </div>
        </div>

        <button className={styles.topBtn} onClick={handleShare}>
          <span className="mi">share</span>
        </button>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.paperWrap}>
          <Template
            invoice={invoice}
            customer={customer}
            brand={brand}
          />
        </div>
      </div>
    </div>
  )
}