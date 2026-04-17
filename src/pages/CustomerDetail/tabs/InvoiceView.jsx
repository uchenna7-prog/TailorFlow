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

function sanitizePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\D/g, '').replace(/^0/, '')
}

// ─────────────────────────────────────────────────────────────
// Build WhatsApp message for an invoice
// ─────────────────────────────────────────────────────────────

function buildInvoiceWhatsAppMessage(invoice, customer, brand) {
  const currency   = brand?.currency || '₦'
  const subtotal   = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax        = calcTax(subtotal, brand?.taxRate, brand?.showTax)
  const total      = subtotal + tax

  const firstName = customer.name?.split(' ')[0] || customer.name

  const statusMap = { paid: 'Fully Paid ✅', part_paid: 'Part Payment', unpaid: 'Unpaid', overdue: 'Overdue ⚠️' }
  const statusLine = statusMap[invoice.status] || invoice.status

  let lines = []
  lines.push(`Hi ${firstName},`)
  lines.push('')
  lines.push(`Here is your invoice from *${brand?.name || 'us'}*. 🧾`)
  lines.push('')
  lines.push(`*Invoice Details*`)
  lines.push(`Invoice No: *${invoice.number}*`)
  lines.push(`Date: ${invoice.date}`)
  if (invoice.due) lines.push(`Due Date: ${invoice.due}`)
  lines.push(`Status: ${statusLine}`)
  lines.push('')

  if (invoice.items?.length > 0) {
    lines.push(`*Breakdown*`)
    invoice.items.forEach(item => {
      lines.push(`• ${item.name} — ${fmt(currency, item.price)}`)
    })
    lines.push('')
  }

  if (brand?.showTax && brand?.taxRate > 0) {
    lines.push(`Subtotal: ${fmt(currency, subtotal)}`)
    lines.push(`Tax (${brand.taxRate}%): ${fmt(currency, tax)}`)
  }
  lines.push(`*Total: ${fmt(currency, total)}*`)
  lines.push('')
  lines.push(`📎 The PDF copy of this invoice has been downloaded to your device. Please find and attach it to this message before sending.`)
  lines.push('')
  if (brand?.phone) lines.push(`For any questions, reach us at ${brand.phone}.`)
  lines.push(`Thank you! 🙏`)

  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────
// PDF generator — constrained to 96% of screen width
// ─────────────────────────────────────────────────────────────

async function downloadPDF(paperEl, filename) {
  const canvas = await html2canvas(paperEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    height: paperEl.scrollHeight,
    windowHeight: paperEl.scrollHeight,
  })
  const imgData = canvas.toDataURL('image/png')
  const pdfW = 450
  const pdfH = (canvas.height * pdfW) / canvas.width
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pdfW, pdfH] })
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
  pdf.save(filename)
}

// ─────────────────────────────────────────────────────────────
// Share Sheet
// ─────────────────────────────────────────────────────────────

function ShareSheet({ open, onClose, onDownload, docNumber, customer, brand, docType, buildMessage }) {
  const [copied,       setCopied]       = useState(false)
  const [sharing,      setSharing]      = useState(false)
  const [pdfReady,     setPdfReady]     = useState(false)
  const [showPdfHint,  setShowPdfHint]  = useState(false)

  if (!open) return null

  const phoneRaw    = customer?.phone || ''
  const phoneClean  = sanitizePhone(phoneRaw)
  const hasPhone    = phoneClean.length >= 7
  const message     = buildMessage()
  const shareText   = `${docType} ${docNumber} for ${customer?.name}`

  const handleMessagingApp = async (openUrl) => {
    setSharing(true)
    setShowPdfHint(false)
    try {
      await onDownload()
      setPdfReady(true)
      setShowPdfHint(true)
    } catch {
      // PDF failed — still open the app
    } finally {
      setSharing(false)
    }
    window.open(openUrl, '_blank', 'noopener')
  }

  const handleWhatsApp = () => {
    const url = hasPhone
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    handleMessagingApp(url)
  }

  const handleTelegram = () => {
    handleMessagingApp(`https://t.me/share/url?url=${encodeURIComponent(shareText)}&text=${encodeURIComponent(message)}`)
  }

  const handleSMS = () => {
    handleMessagingApp(`sms:${phoneRaw}?body=${encodeURIComponent(message)}`)
  }

  const handleEmail = () => {
    const subject = `${docType} ${docNumber} — ${customer?.name}`
    const body    = `${message}\n\n(PDF attached separately)`
    handleMessagingApp(`mailto:${customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }

  const handleNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareText, text: message }) } catch { /* cancelled */ }
    }
  }

  const APPS = [
    {
      id: 'whatsapp', label: 'WhatsApp', onClick: handleWhatsApp,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <path d="M23.5 8.5A10.44 10.44 0 0016.01 5.5C10.76 5.5 6.5 9.76 6.5 15.01c0 1.68.44 3.32 1.28 4.77L6.4 25.6l5.97-1.57a10.43 10.43 0 004.63 1.08h.01c5.25 0 9.51-4.26 9.51-9.51A9.44 9.44 0 0023.5 8.5zm-7.49 14.64h-.01a8.66 8.66 0 01-4.42-1.21l-.32-.19-3.3.87.88-3.22-.2-.33a8.67 8.67 0 01-1.33-4.65c0-4.79 3.9-8.69 8.7-8.69a8.64 8.64 0 016.15 2.55 8.64 8.64 0 012.54 6.15c0 4.8-3.9 8.72-8.69 8.72zm4.77-6.51c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.91-.21-.5-.42-.43-.58-.44l-.49-.01c-.17 0-.45.06-.68.32-.23.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.16-.49-.29z" fill="#fff"/>
        </svg>
      ),
    },
    {
      id: 'telegram', label: 'Telegram', onClick: handleTelegram,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#229ED9"/>
          <path d="M22.8 9.6L6.4 15.9c-1.1.4-1.1 1.1-.2 1.4l4 1.2 1.5 4.7c.2.5.4.7.8.7.3 0 .5-.1.7-.3l2.4-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.4-1.7-1.3-1.3zm-9.5 9l-.3 3.2-1.3-4.1 9.8-6.2-8.2 7.1z" fill="#fff"/>
        </svg>
      ),
    },
    {
      id: 'sms', label: 'SMS', onClick: handleSMS,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#34C759"/>
          <path d="M22 9H10a2 2 0 00-2 2v8a2 2 0 002 2h2l2 3 2-3h6a2 2 0 002-2v-8a2 2 0 00-2-2z" fill="#fff"/>
          <circle cx="12" cy="15" r="1.3" fill="#34C759"/>
          <circle cx="16" cy="15" r="1.3" fill="#34C759"/>
          <circle cx="20" cy="15" r="1.3" fill="#34C759"/>
        </svg>
      ),
    },
    {
      id: 'email', label: 'Email', onClick: handleEmail,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#EA4335"/>
          <path d="M24 11H8a1 1 0 00-1 1v9a1 1 0 001 1h16a1 1 0 001-1v-9a1 1 0 00-1-1zm-1.5 2L16 17.5 9.5 13h13zm.5 8H9v-7.3l7 4.8 7-4.8V21z" fill="#fff"/>
        </svg>
      ),
    },
    {
      id: 'copy', label: copied ? 'Copied!' : 'Copy Text', onClick: handleCopy,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#6366f1"/>
          <path d="M20 8h-8a2 2 0 00-2 2v11h2V10h8V8zm3 4h-7a2 2 0 00-2 2v10a2 2 0 002 2h7a2 2 0 002-2V14a2 2 0 00-2-2zm0 12h-7V14h7v10z" fill="#fff"/>
        </svg>
      ),
    },
    {
      id: 'native', label: 'More', onClick: handleNative,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#8e8e93"/>
          <circle cx="10" cy="16" r="2.2" fill="#fff"/>
          <circle cx="16" cy="16" r="2.2" fill="#fff"/>
          <circle cx="22" cy="16" r="2.2" fill="#fff"/>
        </svg>
      ),
    },
  ]

  return (
    <div className={styles.sheetBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>Share {docType}</div>
        <div className={styles.sheetSub}>{docNumber} · {customer?.name}</div>

        {showPdfHint && (
          <div className={styles.pdfHint}>
            <span className="mi" style={{ fontSize: '1rem', flexShrink: 0 }}>info</span>
            <span>PDF downloaded to your device. Open your Files app, find the PDF and attach it to this conversation.</span>
          </div>
        )}

        <div className={styles.shareGrid}>
          {APPS.map(app => (
            <button
              key={app.id}
              className={styles.shareItem}
              onClick={app.onClick}
              disabled={sharing}
            >
              <div className={styles.shareIconWrap}>
                {sharing && ['whatsapp','telegram','sms','email'].includes(app.id)
                  ? <span className="mi" style={{ fontSize: 26, color: 'var(--text3)' }}>hourglass_top</span>
                  : app.icon
                }
              </div>
              <span className={styles.shareLabel}>{app.label}</span>
            </button>
          ))}
        </div>

        <button
          className={styles.sheetDownloadBtn}
          onClick={async () => { await onDownload(); onClose() }}
          disabled={sharing}
        >
          <span className="mi" style={{ fontSize: '1.1rem' }}>download</span>
          Download PDF
        </button>

        <button className={styles.sheetCancelBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared inner pieces
// ─────────────────────────────────────────────────────────────

function LogoOrName({ brand, darkBg = false }) {
  if (brand.logo) return <img src={brand.logo} alt={brand.name} className={styles.logoImg} />
  return (
    <div className={styles.logoText} style={{ color: darkBg ? '#fff' : '#1a1a1a' }}>
      {brand.name || 'Your Brand'}
    </div>
  )
}

// Generic shared items table — used by templates 1, 2, 3, 4, 5, 6
function ItemsTable({ invoice, brand }) {
  const { currency, showTax, taxRate } = brand
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
      <div className={styles.tRowMain}>
        <div className={styles.tColDesc}>{invoice.orderDesc || 'Garment Order'}</div>
        <div className={styles.tColNum}>{fmt(currency, subtotal)}</div>
      </div>
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
        <div className={styles.sumRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && (
          <div className={styles.sumRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
        )}
        <div className={`${styles.sumRow} ${styles.sumTotal}`}>
          <span>Total Due</span><span>{fmt(currency, total)}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────

// ── 1. Centred Line Invoice (editable) ────────────────────────
function EditableTemplate({ invoice, customer, brand }) {
  const dueDate   = getDueDate(invoice, brand.dueDays)
  const lineColor = brand.colour || '#c8a96e'
  return (
    <div className={styles.tplBase}>
      <div className={styles.editHeader}>
        <LogoOrName brand={brand} />
        {brand.tagline && <div className={styles.editTagline}>{brand.tagline}</div>}
        {brand.address && <div className={styles.editAddr}>{brand.address}</div>}
        <div className={styles.editTitleRow}>
          <div className={styles.editTitleLine} style={{ background: lineColor }} />
          <div className={styles.editTitle}>INVOICE</div>
          <div className={styles.editTitleLine} style={{ background: lineColor }} />
        </div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
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
      <div className={styles.tplFooterPush} />
      {(brand.accountBank || brand.phone || brand.email || brand.footer) && (
        <div className={styles.editFooter}>
          {brand.accountBank && (
            <div className={styles.footSection}>
              <strong>Payment Terms:</strong><br />
              {brand.accountBank}{brand.accountName ? ` — ${brand.accountName}` : ''}<br />
              {brand.accountNumber && `Account: ${brand.accountNumber}`}
            </div>
          )}
          {(brand.phone || brand.email || brand.footer) && (
            <div className={styles.footSection}>
              <strong>Notes:</strong><br />
              {brand.phone   && <span>{brand.phone}<br /></span>}
              {brand.email   && <span>{brand.email}<br /></span>}
              {brand.footer  && <span>{brand.footer}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 2. Three-Column Info Bar (free) ───────────────────────────
function FreeTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  return (
    <div className={styles.tplBase}>
      <div className={styles.freeHeader}>
        <div><div className={styles.printTitle}>INVOICE</div><div className={styles.freeNum}>{invoice.number}</div></div>
        <div className={styles.freeLogoBox}><LogoOrName brand={brand} /></div>
      </div>
      <div className={styles.freeGrid}>
        <div className={styles.freeBox}>
          <strong>BILL FROM</strong><br />
          {brand.name}<br />
          {brand.address && <span>{brand.address}<br /></span>}
          {brand.phone}
        </div>
        <div className={styles.freeBox}><strong>BILL TO</strong><br />{customer.name}<br />{customer.phone}</div>
        <div className={styles.freeBox}><strong>DETAILS</strong><br />Date: {invoice.date}<br />Due: {dueDate}</div>
      </div>
      <ItemsTable invoice={invoice} brand={brand} />
      <div className={styles.tplFooterPush} />
      {brand.accountBank && (
        <div className={styles.freePayInfo}>
          <strong>Payment Information:</strong>{' '}
          {brand.accountBank}{brand.accountName ? ` — ${brand.accountName}` : ''}{brand.accountNumber ? `, Account: ${brand.accountNumber}` : ''}
        </div>
      )}
      <div className={styles.freeFooterCentered}>{brand.footer || 'Thank you!'}</div>
    </div>
  )
}

// ── 3. Full-Bleed Banner (custom) ─────────────────────────────
function CustomTemplate({ invoice, customer, brand }) {
  const bannerBg = brand.colour || '#7c3aed'
  const dueDate  = getDueDate(invoice, brand.dueDays)
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
            {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
            {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
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
        <ItemsTable invoice={invoice} brand={brand} />
        {brand.accountBank && (
          <div className={styles.customPayRow}>
            <strong>Payment Terms:</strong>{' '}
            {brand.accountBank}{brand.accountName ? ` — ${brand.accountName}` : ''}{brand.accountNumber ? `, Account: ${brand.accountNumber}` : ''}
          </div>
        )}
      </div>
      <div className={styles.customFooter}>
        <div className={styles.customFooterText} style={{ color: bannerBg }}>{brand.footer || 'Thank you for your patronage'}</div>
      </div>
    </div>
  )
}

// ── 4. Side-by-Side Classic (printable) ───────────────────────
function PrintableTemplate({ invoice, customer, brand }) {
  const dueDate  = getDueDate(invoice, brand.dueDays)
  const barColor = brand.colour || '#c8a96e'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

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
          <div className={styles.metaVal}>{brand.name}</div>
          {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
          {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>BILL TO</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaSub}>{customer.address}</div>}
        </div>
      </div>
      {/* Template 4 unique table: divider-separated rows with gold divider bar */}
      <div className={styles.p4TableArea}>
        <div className={styles.p4TableHead} style={{ borderColor: barColor }}>
          <span style={{ flex: 3 }}>Description</span>
          <span>Price</span>
          <span>QTY</span>
          <span>Total</span>
        </div>
        {invoice.items?.map((item, i) => (
          <div key={i} className={styles.p4TableRow}>
            <span style={{ flex: 3 }}>{item.name}</span>
            <span>{fmt(currency, item.price)}</span>
            <span>1</span>
            <span>{fmt(currency, item.price)}</span>
          </div>
        ))}
        <div className={styles.p4TotalsArea}>
          <div className={styles.p4TotRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
          {showTax && taxRate > 0 && <div className={styles.p4TotRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
          <div className={styles.p4TotDivider} style={{ background: barColor }} />
          <div className={styles.p4TotBold}><span>Total Due</span><span>{fmt(currency, total)}</span></div>
        </div>
      </div>
      <div className={styles.tplFooterPush} />
      {brand.accountBank && (
        <div className={styles.p4FooterWrap}>
          <div className={styles.footSection}>
            <strong>Payment Terms:</strong><br />
            {brand.accountBank}{brand.accountName ? ` — ${brand.accountName}` : ''}<br />
            {brand.accountNumber && `Account No: ${brand.accountNumber}`}
          </div>
          {brand.footer && (
            <div className={styles.footSection}>
              <strong>Notes:</strong><br />{brand.footer}
            </div>
          )}
        </div>
      )}
      {!brand.accountBank && (
        <div className={styles.printFooterCentered}>
          {brand.footer && <div className={styles.footSection}>{brand.footer}</div>}
        </div>
      )}
    </div>
  )
}

// ── 5. Soft Divider Layout (canva) ────────────────────────────
function CanvaTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t5Wrap}>
      <div className={styles.t5Top}>
        <div className={styles.t5Title}>Invoice</div>
        <div className={styles.t5TopRight}>
          <div>{invoice.date}</div>
          <div><strong>Invoice No. {invoice.number}</strong></div>
        </div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5BilledTo}>
        <div className={styles.t5BilledLabel}>Billed to:</div>
        <div><strong>{customer.name}</strong></div>
        {customer.phone   && <div>{customer.phone}</div>}
        {customer.address && <div>{customer.address}</div>}
      </div>
      <div className={styles.t5Divider} />
      {/* Template 5 unique table: divider-separated rows on beige bg */}
      <div className={styles.t5TableHead}>
        <span style={{ flex: 3 }}>Description</span><span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t5TableRow}>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t5Divider} />
      <div className={styles.t5TotalsSection}>
        <div className={styles.t5TotRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && <div className={styles.t5TotRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
        <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}><span>Total</span><span>{fmt(currency, total)}</span></div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5Footer}>
        {brand.accountBank ? (
          <div>
            <div className={styles.t5FootLabel}>Payment Information</div>
            <div>{brand.name || brand.ownerName}</div>
            {brand.accountBank   && <div>Bank: {brand.accountBank}</div>}
            {brand.accountNumber && <div>Account No: {brand.accountNumber}</div>}
            {brand.accountName   && <div>Name: {brand.accountName}</div>}
          </div>
        ) : <div />}
        <div style={{ textAlign: 'right' }}>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.address && <div>{brand.address}</div>}
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
        </div>
      </div>
      {brand.footer && <div className={styles.t5FootNote}>{brand.footer}</div>}
    </div>
  )
}

// ── 6. Heavy Header Bar (darkheader) ─────────────────────────
function DarkHeaderTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t6Wrap}>
      <div className={styles.t6Header}>
        <div className={styles.t6LogoArea}>
          <div className={styles.t6LogoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 13, color: '#1a1a1a' }}>checkroom</span>
            }
          </div>
          <div>
            <div className={styles.t6CompanyName}>{(brand.name || brand.ownerName || 'YOUR BRAND').toUpperCase()}</div>
            {brand.tagline && <div className={styles.t6CompanySub}>{brand.tagline.toUpperCase()}</div>}
          </div>
        </div>
        <div className={styles.t6HeaderRight}>
          {brand.address && <div>{brand.address}</div>}
        </div>
        <div className={styles.t6HeaderRight}>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
          {brand.website && <div>{brand.website}</div>}
        </div>
      </div>
      <div className={styles.t6InvoiceRow}>
        <div className={styles.t6InvoiceLeft}>
          <span className={styles.t6InvoiceWord}>INVOICE </span>
          <span className={styles.t6InvoiceNum}>#{invoice.number}</span>
        </div>
        <div className={styles.t6InvoiceRight}>
          <div><span className={styles.t6Label}>DATE:</span> {invoice.date}</div>
          <div><span className={styles.t6Label}>DUE:</span> {dueDate}</div>
        </div>
      </div>
      <div className={styles.t6InfoRow}>
        {brand.accountBank && (
          <div>
            <div className={styles.t6InfoLabel}>PAYMENT:</div>
            <strong>{brand.accountBank}</strong><br />
            {brand.accountName && <span>{brand.accountName}<br /></span>}
            {brand.accountNumber && <span>Acct: {brand.accountNumber}</span>}
          </div>
        )}
        <div>
          <div className={styles.t6InfoLabel}>BILL FROM:</div>
          {brand.name || brand.ownerName}<br />
          {brand.address}
        </div>
        <div>
          <div className={styles.t6InfoLabel}>BILL TO:</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>
      {/* Template 6 unique table: dark header row, plain rows */}
      <div className={styles.t6TableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>PRICE</span><span>QTY</span><span>TOTAL</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t6TableRow}>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t6TotalsArea}>
        <div className={styles.t6TotRow}><span>SUBTOTAL</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && <div className={styles.t6TotRow}><span>TAX ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
        <div className={styles.t6TotTotal}><span>TOTAL</span><span>{fmt(currency, total)}</span></div>
      </div>
      <div className={styles.t6ThankYou}>{brand.footer || 'THANK YOU FOR YOUR BUSINESS'}</div>
    </div>
  )
}

// ── 7. Field-Labelled From / To (redbold) ─────────────────────
// Unique table: numbered rows with red total price
function RedBoldTemplate({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#cc0000'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t7Wrap}>
      <div className={styles.t7Header}>
        <div className={styles.t7LogoCircle} style={{ borderColor: accentColor }}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: '50%' }} />
            : <span className="mi" style={{ fontSize: 13, color: accentColor }}>checkroom</span>
          }
        </div>
        <div className={styles.t7TitleGroup}>
          <span className={styles.t7InvoiceWord}>INVOICE</span>
          <span className={styles.t7InvoiceNum}>#{invoice.number}</span>
        </div>
        <div className={styles.t7DateBlock}>
          <div className={styles.t7DateLabel}>DATE:</div>
          <div className={styles.t7DateVal} style={{ color: accentColor }}>{invoice.date}</div>
          <div className={styles.t7DateLabel} style={{ marginTop: 2 }}>DUE:</div>
          <div className={styles.t7DateVal} style={{ color: accentColor }}>{dueDate}</div>
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7FromTo}>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7FromLabel}>FROM:</div>
          <div className={styles.t7FromDivider} />
          {[
            ['NAME:', brand.ownerName || brand.name],
            ['COMPANY:', (brand.name || '').toUpperCase()],
            ['ADDRESS:', (brand.address || '').toUpperCase()],
            ['PHONE:', (brand.phone || '').toUpperCase()],
            ['EMAIL:', (brand.email || '').toUpperCase()],
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.t7InfoRow}>
              <span className={styles.t7InfoKey}>{l}</span>
              <span className={styles.t7InfoVal}>{v}</span>
            </div>
          ))}
        </div>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7ToLabel}>TO:</div>
          <div className={styles.t7FromDivider} />
          {[
            ['NAME:', (customer.name || '').toUpperCase()],
            ['PHONE:', (customer.phone || '').toUpperCase()],
            ['ADDRESS:', (customer.address || '').toUpperCase()],
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.t7InfoRow}>
              <span className={styles.t7InfoKey}>{l}</span>
              <span className={styles.t7InfoVal}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7ForLabel}>FOR:</div>
      {/* Template 7 unique: numbered rows, red price column */}
      <div className={styles.t7TableHead}>
        <span className={styles.t7NumCol}>No.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Qty</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span style={{ flex: 1, textAlign: 'right' }}>1</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{fmt(currency, item.price)}</span>
          <span className={styles.t7RedPrice} style={{ color: accentColor }}>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t7TotalBar} style={{ background: accentColor }}>
        <span>TOTAL:</span>
        <span className={styles.t7TotalAmt}>{fmt(currency, total)}</span>
      </div>
      {brand.accountBank && (
        <div className={styles.t7PayRow}>
          <span className={styles.t7InfoKey}>BANK:</span>
          <span className={styles.t7InfoVal}>{brand.accountBank}</span>
          {brand.accountName && <><span className={styles.t7InfoKey} style={{ marginLeft: 8 }}>ACCT NAME:</span><span className={styles.t7InfoVal}>{brand.accountName}</span></>}
          {brand.accountNumber && <><span className={styles.t7InfoKey} style={{ marginLeft: 8 }}>ACCT #:</span><span className={styles.t7InfoVal}>{brand.accountNumber}</span></>}
        </div>
      )}
    </div>
  )
}

// ── 8. Side Panel with Invoice Box (greenaccent) ──────────────
// Unique table: SL. numbered rows, grey header, green bottom panel
function GreenAccentTemplate({ invoice, customer, brand }) {
  const dueDate    = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#00c896'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t8Wrap}>
      <div className={styles.t8Header}>
        <div className={styles.t8LogoArea}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.t8BrandName}>{brand.name || brand.ownerName}</div>
            {brand.tagline && <div className={styles.t8BrandSub}>{brand.tagline.toUpperCase()}</div>}
          </div>
        </div>
        <div className={styles.t8InvoiceBox} style={{ background: accentColor }}>
          <div className={styles.t8InvoiceTitle}>INVOICE</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Invoice#</span><span>{invoice.number}</span>
            <span>Date</span><span>{invoice.date}</span>
            <span>Due</span><span>{dueDate}</span>
          </div>
        </div>
      </div>
      {/* Template 8 unique: SL. numbered, grey bg header */}
      <div className={styles.t8TableHead}>
        <span>SL.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t8TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t8Divider} />
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox} style={{ background: accentColor }}>
          <div className={styles.t8GreenBoxTitle}>Invoice to:</div>
          <div className={styles.t8GreenBoxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t8GreenBoxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t8GreenBoxAddr}>{customer.address}</div>}
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Terms &amp; Conditions</div>
          <div className={styles.t8GreenBoxAddr}>{brand.footer || 'All garments collected within 30 days of completion.'}</div>
        </div>
        {brand.accountBank && (
          <div className={styles.t8PaymentInfo}>
            <div className={styles.t8PayLabel}>Payment Info:</div>
            {brand.accountNumber && <div>Account #: {brand.accountNumber}</div>}
            {brand.accountName   && <div>A/C Name: {brand.accountName}</div>}
            {brand.accountBank   && <div>Bank: {brand.accountBank}</div>}
            {brand.phone         && <div className={styles.t8ThankYou}>{brand.phone}</div>}
          </div>
        )}
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Sub Total:</span><span>{fmt(currency, subtotal)}</span></div>
          {showTax && taxRate > 0 && <div className={styles.t8TotRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}><span>Total:</span><span>{fmt(currency, total)}</span></div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}

// ── 9. Accent Table Header (tealgeometric) ────────────────────
// Unique table: teal header bar, dark number bar, QTY first col, signature footer
function TealGeometricTemplate({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#00b4c8'
  const darkBar     = '#1a1a2e'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t9Wrap}>
      <div className={styles.t9Header}>
        <div>
          <div className={styles.t9LogoRow}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 14, color: '#333' }}>checkroom</span>
            }
            <span className={styles.t9CompanyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</span>
          </div>
          {brand.tagline && <div className={styles.t9CompanySub}>{brand.tagline.toUpperCase()}</div>}
          {brand.address && <div className={styles.t9CompanyAddr}>{brand.address}</div>}
        </div>
        <div className={styles.t9InvoiceTitle} style={{ color: accentColor }}>INVOICE</div>
      </div>
      <div className={styles.t9NumBar} style={{ background: darkBar }}>
        <span>INVOICE # {invoice.number}</span><span>|</span>
        <span>DATE: {invoice.date}</span><span>|</span>
        <span>DUE: {dueDate}</span>
      </div>
      <div className={styles.t9BillShip}>
        <div>
          <span className={styles.t9BillLabel}>Bill to:</span>
          <div><strong>{customer.name}</strong></div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div>
          <span className={styles.t9BillLabel}>From:</span>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
        </div>
      </div>
      {/* Template 9 unique: teal-bg header, QTY first col */}
      <div className={styles.t9TableHead} style={{ background: accentColor }}>
        <span>QTY</span>
        <span style={{ flex: 3 }}>DESCRIPTION</span>
        <span>PRICE</span><span>TOTAL</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t9TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t9SubArea}>
        <div className={styles.t9SubRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && <div className={styles.t9SubRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
      </div>
      <div className={styles.t9TotalBar} style={{ background: darkBar }}>
        <span>TOTAL</span><span>{fmt(currency, total)}</span>
      </div>
      <div className={styles.t9Footer}>
        <div>
          {brand.accountBank && (
            <>
              <div className={styles.t9ThankYou}>PAYMENT INFORMATION</div>
              <div className={styles.t9PayNote}>
                {brand.accountBank}{brand.accountName ? ` — ${brand.accountName}` : ''}
                {brand.accountNumber ? ` | Acct: ${brand.accountNumber}` : ''}
              </div>
            </>
          )}
          {!brand.accountBank && <div className={styles.t9ThankYou}>THANK YOU FOR YOUR BUSINESS</div>}
          <div className={styles.t9PayNote}>{brand.footer}</div>
        </div>
        <div className={styles.t9SignArea}>
          <div className={styles.t9SignLine} />
          <div className={styles.t9SignLabel}>Signature</div>
        </div>
      </div>
      <div className={styles.t9CornerDeco} style={{ background: `linear-gradient(135deg, transparent 50%, ${accentColor} 50%)` }} />
    </div>
  )
}

// ── 10. Diagonal Header (pinkdiagonal) ────────────────────────
// Unique table: bordered header, SL. numbered, right side totals + sign
// Note: no tagline in brand area (would make it look awkward)
function PinkDiagonalTemplate({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#ff5c8a'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t10Wrap}>
      <div className={styles.t10HeaderZone}>
        <div className={styles.t10FullBanner} style={{ background: accentColor }}>
          <span className={styles.t10BannerTitle}>INVOICE</span>
        </div>
        {/* No tagline here — only brand name + "Tailor Shop" label */}
        <div className={styles.t10BrandInBanner}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 14, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.t10BrandName}>{brand.name || brand.ownerName}</div>
            <div className={styles.t10BrandSub}>TAILOR SHOP</div>
          </div>
        </div>
      </div>
      <div className={styles.t10MetaRow}>
        <div>
          <div className={styles.t10MetaLabel}>Invoice to:</div>
          <div className={styles.t10MetaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t10MetaAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t10MetaAddr}>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span className={styles.t10MetaKey}>Invoice#</span> <strong>{invoice.number}</strong></div>
          <div><span className={styles.t10MetaKey}>Date</span> <strong>{invoice.date}</strong></div>
          <div><span className={styles.t10MetaKey}>Due</span> <strong>{dueDate}</strong></div>
        </div>
      </div>
      {/* Template 10 unique: bordered header, SL. numbered */}
      <div className={styles.t10TableHead}>
        <span>SL.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t10TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t10Divider} />
      <div className={styles.t10Bottom}>
        <div style={{ flex: 1 }}>
          <div className={styles.t10ThankYou}>{brand.footer || 'Thank you for your business'}</div>
          {brand.accountBank && (
            <>
              <div className={styles.t10PayLabel}>Payment Info:</div>
              <div className={styles.t10PayInfo}>
                {brand.accountNumber && <span>Account #: {brand.accountNumber}<br /></span>}
                {brand.accountName   && <span>A/C Name: {brand.accountName}<br /></span>}
                {brand.accountBank   && <span>Bank: {brand.accountBank}</span>}
              </div>
            </>
          )}
          {(brand.phone || brand.email) && (
            <>
              <div className={styles.t10TCLabel}>Contact</div>
              <div className={styles.t10TCText}>
                {brand.phone && <span>{brand.phone}<br /></span>}
                {brand.email && <span>{brand.email}</span>}
              </div>
            </>
          )}
        </div>
        <div className={styles.t10RightCol}>
          <div className={styles.t10TotalsWrap}>
            <div className={styles.t10TotRow}><span>Sub Total:</span><span>{fmt(currency, subtotal)}</span></div>
            {showTax && taxRate > 0 && <div className={styles.t10TotRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
            <div className={styles.t10TotDivider} />
            <div className={styles.t10TotTotal}><span>Total:</span><span>{fmt(currency, total)}</span></div>
          </div>
          <div className={styles.t10SignBlock}>
            <div className={styles.t10SignLine} />
            <div className={styles.t10SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>
      <div className={styles.t10CornerAccent} style={{ background: accentColor }} />
    </div>
  )
}

// ── 11. Info Bar with Payment Tiles (blueclean) ───────────────
// Unique table: black header bar, bullet items, blue amount display
function BlueCleanTemplate({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#5da0d0'
  const barBg       = '#dbeeff'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t11Wrap}>
      <div className={styles.t11TopBar}>
        <div className={styles.t11LogoArea}>
          <div className={styles.t11LogoHex}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 2 }} />
              : <span className="mi" style={{ fontSize: 11, color: '#fff' }}>checkroom</span>
            }
          </div>
          <div>
            <div className={styles.t11CompanyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</div>
            {brand.tagline && <div className={styles.t11CompanySub}>{brand.tagline}</div>}
          </div>
        </div>
        {brand.address && <div className={styles.t11CompanyInfo}>{brand.address}</div>}
        <div className={styles.t11CompanyInfo} style={{ textAlign: 'right' }}>
          {brand.website && <div>{brand.website}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.phone   && <div>{brand.phone}</div>}
        </div>
      </div>
      <div className={styles.t11InvoiceTitle}>Invoice</div>
      <div className={styles.t11BlueBar} style={{ background: barBg, color: accentColor }}>
        <span>INVOICE: #{invoice.number}</span>
        <span>DATE ISSUED: {invoice.date}</span>
        <span>DUE DATE: {dueDate}</span>
      </div>
      <div className={styles.t11IssuedRow}>
        <div>
          <div className={styles.t11IssuedLabel}>ISSUED TO</div>
          <div>{customer.name}</div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.t11AmountLabel} style={{ color: accentColor }}>AMOUNT</div>
          <div className={styles.t11AmountVal} style={{ color: accentColor }}>{fmt(currency, total)}</div>
        </div>
      </div>
      {invoice.orderDesc && <div className={styles.t11ProjectName}>{invoice.orderDesc}</div>}
      {/* Template 11 unique: black header, bullet items, right-aligned totals */}
      <div className={styles.t11TableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>Qty</span><span>Price</span><span>Subtotal</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t11TableRow}>
          <span style={{ flex: 3 }}>• {item.name}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t11TotArea}>
        <div className={styles.t11TotRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && (
          <div className={styles.t11TotRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
        )}
        <div className={styles.t11TotBold}><span>TOTAL</span><span>{fmt(currency, total)}</span></div>
      </div>
      {(brand.accountBank || brand.phone) && (
        <>
          <div className={styles.t11PayTitle}>Payment Information</div>
          <div className={styles.t11PayBoxRow}>
            {brand.accountBank && (
              <div className={styles.t11PayBox} style={{ background: barBg }}>
                <div className={styles.t11PayBoxTitle}>Bank Transfer</div>
                <div>
                  {brand.accountBank}<br />
                  {brand.accountName && <span>{brand.accountName}<br /></span>}
                  {brand.accountNumber && <span>Acct: {brand.accountNumber}</span>}
                </div>
              </div>
            )}
            {brand.phone && (
              <div className={styles.t11PayBox} style={{ background: barBg }}>
                <div className={styles.t11PayBoxTitle}>Contact</div>
                <div>
                  {brand.phone}<br />
                  {brand.email && <span>{brand.email}</span>}
                </div>
              </div>
            )}
            {brand.address && (
              <div className={styles.t11PayBox} style={{ background: barBg }}>
                <div className={styles.t11PayBoxTitle}>Visit Us</div>
                <div>{brand.address}</div>
              </div>
            )}
          </div>
        </>
      )}
      <div className={styles.t11ThankYou} style={{ color: accentColor }}>{brand.footer || 'THANK YOU!'}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Template map
// ─────────────────────────────────────────────────────────────

const TEMPLATE_MAP = {
  editable:     EditableTemplate,
  free:         FreeTemplate,
  custom:       CustomTemplate,
  printable:    PrintableTemplate,
  canva:        CanvaTemplate,
  darkheader:   DarkHeaderTemplate,
  redbold:      RedBoldTemplate,
  greenaccent:  GreenAccentTemplate,
  tealgeometric: TealGeometricTemplate,
  pinkdiagonal: PinkDiagonalTemplate,
  blueclean:    BlueCleanTemplate,
}

const STATUS_LABELS = {
  unpaid:    'Unpaid',
  part_paid: 'Part Payment',
  paid:      'Full Payment',
  overdue:   'Overdue',
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function InvoiceView({ invoice: initialInvoice, customer, onClose, onStatusChange, onDelete, showToast }) {
  const { brand } = useBrand()
  const paperRef  = useRef(null)
  const [invoice,    setInvoice]    = useState(initialInvoice)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showShare,  setShowShare]  = useState(false)

  const templateKey    = invoice.template || brand.template || 'editable'
  const Template       = TEMPLATE_MAP[templateKey] || EditableTemplate
  const effectiveBrand = { ...brand, ...(invoice.brandSnapshot || {}) }
  const filename       = `Invoice-${invoice.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

  const handleDownload = async () => {
    if (!paperRef.current) return
    setPdfLoading(true)
    showToast?.('Generating PDF…')
    try {
      await downloadPDF(paperRef.current, filename)
      showToast?.('PDF downloaded ✓')
    } catch {
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
            onClick: handleDownload,
            disabled: pdfLoading,
          },
          {
            icon: 'share',
            onClick: () => setShowShare(true),
          },
          {
            icon: 'delete',
            onClick: () => onDelete(invoice.id),
            style: { color: '#ef4444' },
          },
        ]}
      />

      <div className={styles.scrollArea}>
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
            {STATUS_LABELS[invoice.status] || invoice.status}
          </div>
        </div>
        <div className={styles.paperWrap}>
          <div className={styles.paperInner} ref={paperRef}>
            <Template invoice={invoice} customer={customer} brand={effectiveBrand} />
          </div>
        </div>
        {invoice.notes && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>Notes</div>
            <div className={styles.notesText}>{invoice.notes}</div>
          </div>
        )}
        <div style={{ height: 32 }} />
      </div>

      <ShareSheet
        open={showShare}
        onClose={() => setShowShare(false)}
        onDownload={handleDownload}
        docNumber={invoice.number}
        customer={customer}
        brand={effectiveBrand}
        docType="Invoice"
        buildMessage={() => buildInvoiceWhatsAppMessage(invoice, customer, effectiveBrand)}
      />
    </div>
  )
}
