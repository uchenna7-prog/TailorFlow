import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useBrand } from '../../../contexts/BrandContext'
import Header from '../../../components/Header/Header'
import styles from './InvoiceView.module.css'

// ── Helpers ───────────────────────────────────────────────────

function fmt(currency, amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calcTax(subtotal, taxRate, showTax) {
  if (!showTax || !taxRate) return 0
  return subtotal * (taxRate / 100)
}

function resolveCumulativePaid(receipt) {
  if (receipt.cumulativePaid != null) return parseFloat(receipt.cumulativePaid)
  return (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
}

function sanitizePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\D/g, '').replace(/^0/, '')
}

// ─────────────────────────────────────────────────────────────
// Derive CSS brand variables from a hex colour so the paper
// element is fully isolated from the global --brand-* tokens
// set by useBrandTokens. Without this, changing your brand
// colour in Profile would bleed into already-generated docs
// because the CSS module's var(--brand-*) always reads the
// live global values, even when effectiveBrand.colour is
// correctly set from the snapshot.
//
// We inject these as inline CSS variables on the paperInner
// wrapper — they cascade into every template child element
// that uses var(--brand-primary) etc., overriding the globals.
// ─────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function luminance({ r, g, b }) {
  const ch = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

function mixHex(hex, white, ratio) {
  // ratio: 0 = full hex, 1 = full white
  const { r, g, b } = hexToRgb(hex)
  const wr = parseInt(white.slice(1, 3), 16)
  const wg = parseInt(white.slice(3, 5), 16)
  const wb = parseInt(white.slice(5, 7), 16)
  const mix = (a, wv) => Math.round(a + (wv - a) * ratio)
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(mix(r, wr))}${toHex(mix(g, wg))}${toHex(mix(b, wb))}`
}

function darkenHex(hex, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const d = v => Math.round(v * (1 - ratio))
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`
}

function getBrandCSSVars(colour) {
  const hex = colour || '#D4AF37'
  const rgb = hexToRgb(hex)
  const lum = luminance(rgb)
  // On-primary text: white for dark colours, near-black for light ones
  const onPrimary = lum > 0.35 ? '#1a1a1a' : '#ffffff'
  const primary     = hex
  const primaryDark = darkenHex(hex, 0.25)
  const muted       = mixHex(hex, '#ffffff', 0.75)   // 25% colour, 75% white
  const surface     = mixHex(hex, '#ffffff', 0.92)   // very light tint
  const gradient    = hex   // for templates that use var(--brand-gradient) as a solid

  return {
    '--brand-primary':      primary,
    '--brand-primary-dark': primaryDark,
    '--brand-gradient':     gradient,
    '--brand-on-primary':   onPrimary,
    '--brand-muted':        muted,
    '--brand-surface':      surface,
  }
}

// ── Build WhatsApp message for a receipt ─────────────────────

function buildReceiptWhatsAppMessage(receipt, customer, brand) {
  const currency       = brand?.currency || '₦'
  const firstName      = customer.name?.split(' ')[0] || customer.name
  const thisPayment    = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const cumulativePaid = resolveCumulativePaid(receipt)
  const orderTotal     = receipt.orderPrice ? parseFloat(receipt.orderPrice)
    : receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const balanceLeft    = Math.max(0, orderTotal - cumulativePaid)
  const isFullPay      = balanceLeft <= 0

  let lines = []
  lines.push(`Hi ${firstName},`)
  lines.push('')
  lines.push(`Here is your payment receipt from *${brand?.name || 'us'}*. 🧾`)
  lines.push('')
  lines.push(`*Receipt Details*`)
  lines.push(`Receipt No: *${receipt.number}*`)
  lines.push(`Date: ${receipt.date}`)
  lines.push('')

  if (receipt.items?.length > 0) {
    lines.push(`*Order Breakdown*`)
    receipt.items.forEach(item => {
      lines.push(`• ${item.name} — ${fmt(currency, item.price)}`)
    })
    lines.push(`Order Total: ${fmt(currency, orderTotal)}`)
    lines.push('')
  }

  if ((receipt.payments || []).length > 0) {
    lines.push(`*Payment${receipt.payments.length > 1 ? 's' : ''} Received*`)
    receipt.payments.forEach((p, idx) => {
      const label = receipt.payments.length > 1 ? `Payment ${idx + 1}` : 'Amount Paid'
      const method = p.method ? ` (${p.method.charAt(0).toUpperCase() + p.method.slice(1)})` : ''
      lines.push(`${label}${method}: *${fmt(currency, p.amount)}*`)
    })
    lines.push('')
  }

  if (isFullPay) {
    lines.push(`✅ *Your order is fully paid. Thank you!*`)
  } else {
    lines.push(`Balance Remaining: *${fmt(currency, balanceLeft)}*`)
    lines.push(`Please note there is an outstanding balance on your order.`)
  }

  lines.push('')
  lines.push(`📎 The PDF copy of this receipt has been downloaded to your device. Please find and attach it to this message before sending.`)
  lines.push('')
  if (brand?.phone) lines.push(`For any questions, reach us at ${brand.phone}.`)
  lines.push(`Thank you! 🙏`)

  return lines.join('\n')
}

// ── PDF generator ─────────────────────────────────────────────

async function downloadPDF(paperEl, filename) {
  const blob = await generatePDFBlob(paperEl)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

async function generatePDFBlob(paperEl) {
  const PDF_W = 380
  const prevWidth  = paperEl.style.width
  const prevMaxW   = paperEl.style.maxWidth

  paperEl.style.width    = `${PDF_W}px`
  paperEl.style.maxWidth = 'none'

  await new Promise(r => setTimeout(r, 60))
  const elH = paperEl.scrollHeight

  const canvas = await html2canvas(paperEl, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: PDF_W,
    height: elH,
    windowWidth: PDF_W,
    windowHeight: elH,
  })

  paperEl.style.width    = prevWidth
  paperEl.style.maxWidth = prevMaxW

  const imgData = canvas.toDataURL('image/png')
  const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PDF_W, elH] })
  pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, elH)
  return pdf.output('blob')
}

// ── Share Sheet ───────────────────────────────────────────────

function ShareSheet({ open, onClose, paperRef, filename, docNumber, customer, brand, docType, buildMessage }) {
  const [status, setStatus] = useState('idle')

  if (!open) return null

  const phoneRaw   = customer?.phone || ''
  const phoneClean = sanitizePhone(phoneRaw)
  const hasPhone   = phoneClean.length >= 7
  const message    = buildMessage()

  const canShareFiles = typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([''], 'test.pdf', { type: 'application/pdf' })] })

  const withBlob = async (cb) => {
    if (!paperRef?.current) return
    setStatus('generating')
    try {
      const blob = await generatePDFBlob(paperRef.current)
      const file = new File([blob], filename, { type: 'application/pdf' })
      await cb(blob, file)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const handleWhatsApp = () => withBlob(async (blob, file) => {
    if (canShareFiles) {
      await navigator.share({ files: [file], text: message })
    } else {
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      const waUrl = hasPhone
        ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(waUrl, '_blank', 'noopener')
    }
  })

  const handleWithDownload = (appUrl) => withBlob(async (blob) => {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    window.open(appUrl, '_blank', 'noopener')
  })

  const handleTelegram = () => {
    const shareText = `${docType} ${docNumber} for ${customer?.name}`
    handleWithDownload(`https://t.me/share/url?url=${encodeURIComponent(shareText)}&text=${encodeURIComponent(message)}`)
  }

  const handleSMS = () =>
    handleWithDownload(`sms:${phoneRaw}?body=${encodeURIComponent(message)}`)

  const handleEmail = () => {
    const subject = `${docType} ${docNumber} — ${customer?.name}`
    const body    = `${message}\n\n(PDF attached separately)`
    handleWithDownload(`mailto:${customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    } catch { /* silent */ }
  }

  const handleNativeShare = () => withBlob(async (blob, file) => {
    const shareData = canShareFiles
      ? { files: [file], text: message }
      : { title: `${docType} ${docNumber}`, text: message }
    await navigator.share(shareData)
  })

  const handleDownloadOnly = () => withBlob(async (blob) => {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  })

  const isGenerating = status === 'generating'

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
      id: 'copy', label: status === 'done' ? 'Copied!' : 'Copy Text', onClick: handleCopy,
      icon: (
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="16" fill="#6366f1"/>
          <path d="M20 8h-8a2 2 0 00-2 2v11h2V10h8V8zm3 4h-7a2 2 0 00-2 2v10a2 2 0 002 2h7a2 2 0 002-2V14a2 2 0 00-2-2zm0 12h-7V14h7v10z" fill="#fff"/>
        </svg>
      ),
    },
    {
      id: 'native', label: 'More', onClick: handleNativeShare,
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

        {isGenerating && (
          <div className={styles.pdfHint}>
            <span className="mi" style={{ fontSize: '1rem', flexShrink: 0 }}>hourglass_top</span>
            <span>Generating PDF — this takes a moment…</span>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.pdfHint} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
            <span className="mi" style={{ fontSize: '1rem', flexShrink: 0 }}>error</span>
            <span>PDF generation failed. Please try again.</span>
          </div>
        )}

        {canShareFiles && status === 'idle' && (
          <div className={styles.pdfHint} style={{ background: 'color-mix(in srgb, #25D366 10%, transparent)', borderColor: 'color-mix(in srgb, #25D366 35%, transparent)', color: '#166534' }}>
            <span className="mi" style={{ fontSize: '1rem', flexShrink: 0 }}>share</span>
            <span>Tap WhatsApp to send the PDF directly — pick your contact inside WhatsApp.</span>
          </div>
        )}

        <div className={styles.shareGrid}>
          {APPS.map(app => (
            <button
              key={app.id}
              className={styles.shareItem}
              onClick={app.onClick}
              disabled={isGenerating}
            >
              <div className={styles.shareIconWrap}>
                {isGenerating && ['whatsapp','telegram','sms','email','native'].includes(app.id)
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
          onClick={handleDownloadOnly}
          disabled={isGenerating}
        >
          <span className="mi" style={{ fontSize: '1.1rem' }}>download</span>
          {isGenerating ? 'Generating…' : 'Download PDF'}
        </button>

        <button className={styles.sheetCancelBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Logo helper
// ─────────────────────────────────────────────────────────────

function LogoOrName({ brand, darkBg = false }) {
  if (brand.logo) return <img src={brand.logo} alt={brand.name} className={styles.logoImg} />
  return (
    <div className={styles.logoText} style={{ color: darkBg ? '#fff' : '#1a1a1a' }}>
      {brand.name || 'Your Brand'}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared helper: build the full ordered list of payment rows
// (previous installments greyed + current ones bold/green)
// Used by ALL templates for consistent payment history display.
// ─────────────────────────────────────────────────────────────
function buildPaymentRows(receipt) {
  const previousInstallments = receipt.previousInstallments || []
  const currentPayments      = receipt.payments || []
  const hasPrevious          = previousInstallments.length > 0 ||
    (parseFloat(receipt.previousPaid) > 0 && previousInstallments.length === 0)

  let rows = []

  // Previous installments (greyed out)
  if (previousInstallments.length > 0) {
    previousInstallments.forEach((p, idx) => {
      rows.push({ ...p, _isCurrent: false, _sn: idx + 1 })
    })
  } else if (parseFloat(receipt.previousPaid) > 0) {
    // Legacy: no per-installment breakdown, just a lump sum
    rows.push({
      id: '__prev__',
      amount: receipt.previousPaid,
      date: 'Prior payments',
      method: null,
      _isCurrent: false,
      _sn: 1,
    })
  }

  const offset = rows.length

  // Current installments (bold green)
  currentPayments.forEach((p, idx) => {
    rows.push({ ...p, _isCurrent: true, _sn: offset + idx + 1 })
  })

  return rows
}

// ─────────────────────────────────────────────────────────────
// Shared receipt payment summary block (used by templates 1-3)
// ─────────────────────────────────────────────────────────────

function ReceiptPaymentSummary({ receipt, brand }) {
  const { currency, showTax, taxRate } = brand

  const orderTotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(receipt.orderPrice) || 0)

  const tax            = calcTax(orderTotal, taxRate, showTax)
  const cumulativePaid = resolveCumulativePaid(receipt)
  const previousPaid   = parseFloat(receipt.previousPaid) || 0

  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0

  const paymentRows = buildPaymentRows(receipt)

  return (
    <div className={styles.tableWrapper}>
      <div style={{ fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, color: '#444' }}>Order Details</div>
      <div className={styles.tHead}>
        <span style={{ width: 18, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>S/N</span>
        <span className={styles.tColDesc}>Description</span>
        <span className={styles.tColNum}>Amount</span>
      </div>
      {receipt.items?.length > 0 ? (
        receipt.items.map((item, idx) => (
          <div key={idx} className={styles.tRowSub} style={{ padding: '5px 0', fontSize: 10, color: '#1a1a1a', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ width: 18, flexShrink: 0, color: '#888' }}>{idx + 1}</span>
            <span className={styles.tColDesc}>{item.name}</span>
            <span className={styles.tColNum}>{fmt(currency, item.price)}</span>
          </div>
        ))
      ) : (
        <div className={styles.tRowMain}>
          <div style={{ width: 18, flexShrink: 0, color: '#888', fontSize: 10 }}>1</div>
          <div className={styles.tColDesc}>{receipt.orderDesc || 'Garment Order'}</div>
          <div className={styles.tColNum}>{fmt(currency, orderTotal)}</div>
        </div>
      )}
      <div className={styles.summary} style={{ width: '100%', marginLeft: 0 }}>
        <div className={styles.sumRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {/* Payment History */}
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, color: '#444', borderTop: '1px solid #eee', paddingTop: 10 }}>
            Payment History
          </div>
          <div className={styles.tHead}>
            <span style={{ width: 18, flexShrink: 0 }}>S/N</span>
            <span className={styles.tColDesc}>Payment Date</span>
            <span className={styles.tColNum}>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.tRowSub}>
              <span style={{ width: 18, flexShrink: 0, color: p._isCurrent ? '#1a1a1a' : '#888', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span className={styles.tColDesc} style={{ color: p._isCurrent ? '#1a1a1a' : '#6b7280', fontWeight: p._isCurrent ? 700 : 400 }}>
                {p.date}{p.method ? (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                ) : null}
              </span>
              <span className={styles.tColNum} style={{ color: p._isCurrent ? '#16a34a' : '#6b7280', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.summary} style={{ width: '100%', marginLeft: 0, marginTop: 10 }}>
            {showTax && taxRate > 0 && (
              <div className={styles.sumRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
            )}
            <div className={styles.sumRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && (
              <div className={styles.sumRow}><span>Balance Remaining</span><span style={{ color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>
            )}
            <div className={`${styles.sumRow} ${styles.sumTotal}`}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.summary} style={{ width: '100%', marginLeft: 0, marginTop: 10 }}>
          {showTax && taxRate > 0 && (
            <div className={styles.sumRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
          )}
          {!isFullPayment && (
            <div className={styles.sumRow}><span>Balance Remaining</span><span style={{ color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>
          )}
          <div className={`${styles.sumRow} ${styles.sumTotal}`}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared payment history block for templates 4-11
// Renders all rows (previous greyed, current bold/green) then totals
// ─────────────────────────────────────────────────────────────
function PaymentHistoryBlock({ receipt, currency, orderTotal, thisPaymentTotal, balanceRemaining, isFullPayment,
  headStyle, rowStyle, totalsAreaStyle, totRowStyle, totDividerStyle, totBoldStyle,
  headSNStyle, headDateStyle, headAmtStyle,
  rowSNStyle, rowDateStyle, rowAmtStyle,
  sectionLabelStyle,
}) {
  const paymentRows = buildPaymentRows(receipt)
  if (paymentRows.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      {sectionLabelStyle && (
        <div style={sectionLabelStyle}>Payment History</div>
      )}
      <div style={headStyle}>
        <span style={headSNStyle}>S/N</span>
        <span style={headDateStyle}>Payment Date</span>
        <span style={headAmtStyle}>Amount</span>
      </div>
      {paymentRows.map((p, idx) => (
        <div key={p.id ?? idx} style={rowStyle}>
          <span style={{ ...rowSNStyle, color: p._isCurrent ? (rowSNStyle?.color || '#1a1a1a') : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
          <span style={{ ...rowDateStyle, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
            {p.date}
            {p.method && (
              <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
            )}
          </span>
          <span style={{ ...rowAmtStyle, color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
        </div>
      ))}
      <div style={totalsAreaStyle}>
        <div style={totRowStyle}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
        {!isFullPayment && <div style={{ ...totRowStyle, color: '#ef4444' }}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
        <div style={totDividerStyle} />
        <div style={totBoldStyle}>
          <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
          <span style={{ color: isFullPayment ? '#16a34a' : undefined }}>{fmt(currency, thisPaymentTotal)}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RECEIPT TEMPLATES
// ─────────────────────────────────────────────────────────────

// ── 1. Centred Line Receipt (editable) ────────────────────────
function EditableTemplate({ receipt, customer, brand }) {
  const lineColor = brand.colour || '#c8a96e'
  return (
    <div className={styles.tplBase}>
      <div className={styles.editHeader}>
        <div className={styles.pBrandName}>{brand.name || 'Your Brand'}</div>
        {brand.tagline && <div className={styles.editTagline}>{brand.tagline}</div>}
        {brand.address && <div className={styles.editAddr}>{brand.address}</div>}
        <div className={styles.editTitleRow}>
          <div className={styles.editTitleLine} style={{ background: lineColor }} />
          <div className={styles.editTitle}>RECEIPT</div>
          <div className={styles.editTitleLine} style={{ background: lineColor }} />
        </div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>RECEIVED FROM</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>RECEIPT #</div>
          <div className={styles.metaVal}>{receipt.number}</div>
          <div className={styles.metaSub}>{receipt.date}</div>
        </div>
      </div>
      <ReceiptPaymentSummary receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
      {(brand.phone || brand.email || brand.footer) && (
        <div className={styles.editFooter}>
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
function FreeTemplate({ receipt, customer, brand }) {
  return (
    <div className={styles.tplBase}>
      <div className={styles.freeHeader}>
        <div>
          <div className={styles.printTitle}>RECEIPT</div>
          <div className={styles.freeNum}>{receipt.number}</div>
        </div>
        <div className={styles.freeLogoBox}><LogoOrName brand={brand} /></div>
      </div>
      <div className={styles.freeGrid}>
        <div className={styles.freeBox}>
          <strong>FROM</strong><br />
          {brand.name}<br />
          {brand.address && <span>{brand.address}<br /></span>}
          {brand.phone}
        </div>
        <div className={styles.freeBox}><strong>RECEIVED FROM</strong><br />{customer.name}<br />{customer.phone}</div>
        <div className={styles.freeBox}><strong>DATE</strong><br />{receipt.date}</div>
      </div>
      <ReceiptPaymentSummary receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
      <div className={styles.freeFooterCentered}>{brand.footer || 'Thank you!'}</div>
    </div>
  )
}

// ── 3. Full-Bleed Banner (custom) ─────────────────────────────
function CustomTemplate({ receipt, customer, brand }) {
  const bannerBg = brand.colour || '#7c3aed'
  return (
    <div className={styles.tplBase} style={{ padding: 0 }}>
      <div className={styles.customBanner} style={{ background: bannerBg }}>
        <div className={styles.customBannerLogo}><LogoOrName brand={brand} darkBg /></div>
        <div className={styles.customBannerRight}>
          <div className={styles.customBannerTitle}>RECEIPT</div>
          <div className={styles.customBannerNum}>{receipt.number}</div>
        </div>
      </div>
      <div className={styles.customBody}>
        <div className={styles.metaRow} style={{ marginBottom: 16 }}>
          <div>
            <div className={styles.metaLabel}>FROM</div>
            <div className={styles.metaVal}>{brand.name}</div>
            {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
            {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
          </div>
          <div>
            <div className={styles.metaLabel}>RECEIVED FROM</div>
            <div className={styles.metaVal}>{customer.name}</div>
            {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.metaLabel}>DATE</div>
            <div className={styles.metaSub}>{receipt.date}</div>
          </div>
        </div>
        <ReceiptPaymentSummary receipt={receipt} brand={brand} />
      </div>
      <div className={styles.customFooter}>
        <div className={styles.customFooterText} style={{ color: bannerBg }}>
          {brand.footer || 'Thank you for your payment'}
        </div>
      </div>
    </div>
  )
}

// ── 4. Side-by-Side Classic (printable) ───────────────────────
function PrintableTemplate({ receipt, customer, brand }) {
  const barColor = brand.colour || '#c8a96e'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.tplBase}>
      <div className={styles.printBar} style={{ background: barColor }} />
      <div className={styles.printHeaderSplit}>
        <div className={styles.printTitle}>RECEIPT</div>
        <div style={{ textAlign: 'right', fontSize: 9 }}>
          <div>DATE: <strong>{receipt.date}</strong></div>
          <div>RECEIPT #: <strong>{receipt.number}</strong></div>
        </div>
      </div>
      <div className={styles.metaRow} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 16 }}>
        <div>
          <div className={styles.metaLabel}>FROM</div>
          <div className={styles.metaVal}>{brand.name || brand.ownerName}</div>
          {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
          {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>RECEIVED FROM</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
        </div>
      </div>
      <div className={styles.p4TableArea}>
        <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', color: '#555' }}>Order Details</div>
        <div className={styles.p4TableHead} style={{ borderColor: barColor }}>
          <span style={{ flex: 0.5 }}>S/N</span>
          <span style={{ flex: 3 }}>Description</span>
          <span>Amount</span>
        </div>
        {receipt.items?.map((item, i) => (
          <div key={i} className={styles.p4TableRow}>
            <span style={{ flex: 0.5 }}>{i + 1}</span>
            <span style={{ flex: 3 }}>{item.name}</span>
            <span>{fmt(currency, item.price)}</span>
          </div>
        ))}
        {!receipt.items?.length && (
          <div className={styles.p4TableRow}>
            <span style={{ flex: 0.5 }}>1</span>
            <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
            <span>{fmt(currency, orderTotal)}</span>
          </div>
        )}
        <div className={styles.p4TotalsArea}>
          <div className={styles.p4TotRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
        </div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '6px 0 4px', color: '#555' }}>Payment History</div>
          <div className={styles.p4TableHead} style={{ borderColor: barColor }}>
            <span style={{ flex: 0.5 }}>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.p4TableRow}>
              <span style={{ flex: 0.5, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ fontWeight: p._isCurrent ? 700 : 400, color: p._isCurrent ? '#16a34a' : '#9ca3af' }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.p4TotalsArea}>
            <div className={styles.p4TotRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.p4TotRow} style={{ color: '#ef4444' }}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.p4TotDivider} style={{ background: barColor }} />
            <div className={styles.p4TotBold}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.p4TableArea}>
          <div className={styles.p4TotalsArea}>
            {!isFullPayment && <div className={styles.p4TotRow} style={{ color: '#ef4444' }}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.p4TotDivider} style={{ background: barColor }} />
            <div className={styles.p4TotBold}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      <div className={styles.tplFooterPush} />
      {brand.footer && (
        <div className={styles.printFooterCentered}>
          <div className={styles.footSection}>{brand.footer}</div>
        </div>
      )}
    </div>
  )
}

// ── 5. Soft Divider Layout (canva) ────────────────────────────
function CanvaTemplate({ receipt, customer, brand }) {
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t5Wrap}>
      <div className={styles.t5Top}>
        <div className={styles.t5Title}>Receipt</div>
        <div className={styles.t5TopRight}>
          <div>{receipt.date}</div>
          <div><strong>Receipt No. {receipt.number}</strong></div>
        </div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5BilledTo}>
        <div className={styles.t5BilledLabel}>Received from:</div>
        <div><strong>{customer.name}</strong></div>
        {customer.phone   && <div>{customer.phone}</div>}
        {customer.address && <div>{customer.address}</div>}
      </div>
      <div className={styles.t5Divider} />
      <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px', color: 'rgba(255,255,255,0.7)' }}>Order Details</div>
      <div className={styles.t5TableHead}>
        <span style={{ flex: 0.5 }}>S/N</span>
        <span style={{ flex: 3 }}>Description</span><span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t5TableRow}>
          <span style={{ flex: 0.5 }}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t5TableRow}>
          <span style={{ flex: 0.5 }}>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t5Divider} />
      <div className={styles.t5TotalsSection}>
        <div className={styles.t5TotRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <>
          <div className={styles.t5Divider} />
          <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0', color: 'rgba(255,255,255,0.7)' }}>Payment History</div>
          <div className={styles.t5TableHead}>
            <span style={{ flex: 0.5 }}>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span><span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t5TableRow}>
              <span style={{ flex: 0.5, opacity: p._isCurrent ? 1 : 0.55, fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, opacity: p._isCurrent ? 1 : 0.55, fontWeight: p._isCurrent ? 700 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ fontWeight: 700, opacity: p._isCurrent ? 1 : 0.7 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ fontWeight: p._isCurrent ? 700 : 400, opacity: p._isCurrent ? 1 : 0.55 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t5Divider} />
          <div className={styles.t5TotalsSection}>
            <div className={styles.t5TotRow}><span>Total Paid</span><span style={{ fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t5TotRow}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t5TotalsSection}>
          {!isFullPayment && <div className={styles.t5TotRow}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
            <span>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
      <div className={styles.t5Divider} />
      <div className={styles.t5Footer}>
        <div />
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
function DarkHeaderTemplate({ receipt, customer, brand }) {
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t6Wrap}>
      <div className={styles.t6Header}>
        <div className={styles.t6LogoArea}>
          <div className={styles.t6LogoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 13, color: 'var(--brand-on-primary)' }}>checkroom</span>
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
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.website && <div>{brand.website}</div>}
        </div>
      </div>
      <div className={styles.t6InvoiceRow}>
        <div className={styles.t6InvoiceLeft}>
          <span className={styles.t6InvoiceWord}>RECEIPT </span>
          <span className={styles.t6InvoiceNum}>#{receipt.number}</span>
        </div>
        <div className={styles.t6InvoiceRight}>
          <div><span className={styles.t6Label}>DATE:</span> {receipt.date}</div>
        </div>
      </div>
      <div className={styles.t6InfoRow}>
        <div>
          <div className={styles.t6InfoLabel}>FROM:</div>
          {brand.name || brand.ownerName}<br />
          {brand.address}
        </div>
        <div>
          <div className={styles.t6InfoLabel}>RECEIVED FROM:</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t6TableHead}>
        <span style={{ flex: 0.5 }}>S/N</span>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>AMOUNT</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t6TableRow}>
          <span style={{ flex: 0.5 }}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t6TableRow}>
          <span style={{ flex: 0.5 }}>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t6TotalsArea}>
        <div className={styles.t6TotRow}><span>ORDER VALUE</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 4px', color: '#555' }}>Payment History</div>
          <div className={styles.t6TableHead}>
            <span style={{ flex: 0.5 }}>S/N</span>
            <span style={{ flex: 3 }}>PAYMENT DATE</span><span>AMOUNT</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t6TableRow}>
              <span style={{ flex: 0.5, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t6TotalsArea}>
            <div className={styles.t6TotRow}><span>TOTAL PAID</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t6TotRow} style={{ color: '#ef4444' }}><span>BALANCE</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.t6TotTotal}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : 'var(--brand-on-primary)' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t6TotalsArea}>
          {!isFullPayment && <div className={styles.t6TotRow} style={{ color: '#ef4444' }}><span>BALANCE</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={styles.t6TotTotal}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : 'var(--brand-on-primary)' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
      <div className={styles.t6ThankYou}>{brand.footer || 'THANK YOU FOR YOUR PAYMENT'}</div>
    </div>
  )
}

// ── 7. Field-Labelled From / To (redbold) ─────────────────────
function RedBoldTemplate({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#cc0000'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

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
          <span className={styles.t7InvoiceWord}>RECEIPT</span>
          <span className={styles.t7InvoiceNum}>#{receipt.number}</span>
        </div>
        <div className={styles.t7DateBlock}>
          <div className={styles.t7DateLabel}>DATE:</div>
          <div className={styles.t7DateVal} style={{ color: accentColor }}>{receipt.date}</div>
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
      <div style={{ fontWeight: 900, fontSize: 8, letterSpacing: '0.04em', margin: '3px 16px 2px', color: '#1a1a1a' }}>Order Details</div>
      <div className={styles.t7TableHead}>
        <span className={styles.t7NumCol}>S/N</span>
        <span style={{ flex: 3 }}>Description</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span className={styles.t7RedPrice} style={{ color: accentColor }}>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span className={styles.t7RedPrice} style={{ color: accentColor }}>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className={styles.t7Divider} />
          <div style={{ fontWeight: 900, fontSize: 9, letterSpacing: '0.04em', padding: '4px 16px 2px', color: '#1a1a1a' }}>Payment History</div>
          <div className={styles.t7TableHead}>
            <span className={styles.t7NumCol}>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t7TableRow}>
              <span className={styles.t7NumCol} style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ flex: 1, textAlign: 'right', color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t7TableRow} style={{ fontWeight: 700 }}>
            <span className={styles.t7NumCol} />
            <span style={{ flex: 3, color: '#444' }}>Total Paid</span>
            <span style={{ flex: 1, textAlign: 'right', color: '#16a34a' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
          {!isFullPayment && (
            <div className={styles.t7TableRow}>
              <span className={styles.t7NumCol}>—</span>
              <span style={{ flex: 3, color: '#ef4444', fontWeight: 700 }}>Balance Remaining</span>
              <span style={{ flex: 1, textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span>
            </div>
          )}
        </div>
      )}
      {paymentRows.length === 0 && !isFullPayment && (
        <div className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>—</span>
          <span style={{ flex: 3, color: '#ef4444', fontWeight: 700 }}>Balance Remaining</span>
          <span style={{ flex: 1, textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span>
        </div>
      )}
      <div className={styles.t7TotalBar} style={{ background: accentColor }}>
        <span>{isFullPayment ? 'PAID IN FULL:' : 'RECEIVED:'}</span>
        <span className={styles.t7TotalAmt}>{fmt(currency, thisPaymentTotal)}</span>
      </div>
    </div>
  )
}

// ── 8. Side Panel with Invoice Box (greenaccent) ──────────────
function GreenAccentTemplate({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#00c896'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

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
          <div className={styles.t8InvoiceTitle}>RECEIPT</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Receipt#</span><span>{receipt.number}</span>
            <span>Date</span><span>{receipt.date}</span>
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t8TableHead}>
        <span>S/N</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t8TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t8TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t8Divider} />
      {paymentRows.length > 0 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Payment History</div>
          <div className={styles.t8TableHead} style={{ background: '#e8f5f0' }}>
            <span>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t8TableRow}>
              <span style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t8Divider} />
        </>
      )}
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox} style={{ background: accentColor }}>
          <div className={styles.t8GreenBoxTitle}>Received from:</div>
          <div className={styles.t8GreenBoxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t8GreenBoxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t8GreenBoxAddr}>{customer.address}</div>}
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Note</div>
          <div className={styles.t8GreenBoxAddr}>{brand.footer || 'Thank you for your payment.'}</div>
        </div>
        <div style={{ flex: 1, fontSize: 7, lineHeight: 1.6 }} />
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Order Value:</span><span>{fmt(currency, orderTotal)}</span></div>
          <div className={styles.t8TotRow}><span>Total Paid:</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
          {!isFullPayment && <div className={styles.t8TotRow} style={{ color: '#ef4444' }}><span>Balance:</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}>
            <span>{isFullPayment ? 'Paid:' : 'Received:'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}

// ── 9. Accent Table Header (tealgeometric) ────────────────────
function TealGeometricTemplate({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#00b4c8'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

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
        <div className={styles.t9InvoiceTitle} style={{ color: accentColor }}>RECEIPT</div>
      </div>
      <div className={styles.t9NumBar}>
        <span>RECEIPT # {receipt.number}</span><span>|</span>
        <span>DATE: {receipt.date}</span>
      </div>
      <div className={styles.t9BillShip}>
        <div>
          <span className={styles.t9BillLabel}>Received from:</span>
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
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t9TableHead}>
        <span>S/N</span>
        <span style={{ flex: 3 }}>DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t9TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t9TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t9SubArea}>
        <div className={styles.t9SubRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Payment History</div>
          <div className={styles.t9TableHead}>
            <span>S/N</span>
            <span style={{ flex: 3 }}>PAYMENT DATE</span>
            <span>AMOUNT</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t9TableRow}>
              <span style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t9SubArea}>
            <div className={styles.t9SubRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t9SubRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t9SubArea}>
          {!isFullPayment && <div className={styles.t9SubRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
        </div>
      )}
      <div className={styles.t9TotalBar}>
        <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
        <span>{fmt(currency, thisPaymentTotal)}</span>
      </div>
      <div className={styles.t9Footer}>
        <div>
          {!brand.accountBank && <div className={styles.t9ThankYou}>THANK YOU FOR YOUR PAYMENT</div>}
          {brand.footer && <div className={styles.t9PayNote}>{brand.footer}</div>}
        </div>
        <div className={styles.t9SignArea}>
          <div className={styles.t9SignLine} />
          <div className={styles.t9SignLabel}>Signature</div>
        </div>
      </div>
      <div className={styles.t9CornerDeco} />
    </div>
  )
}

// ── 10. Diagonal Header (pinkdiagonal) ────────────────────────
function PinkDiagonalTemplate({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#ff5c8a'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t10Wrap}>
      <div className={styles.t10HeaderZone}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 400 72"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 400,0 400,28 0,72" fill={accentColor} />
        </svg>
        <div style={{ position: 'absolute', top: 10, left: 18, zIndex: 1 }}>
          <span className={styles.t10BannerTitle}>RECEIPT</span>
        </div>
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
          <div className={styles.t10MetaLabel}>Received from:</div>
          <div className={styles.t10MetaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t10MetaAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t10MetaAddr}>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span className={styles.t10MetaKey}>Receipt#</span> <strong>{receipt.number}</strong></div>
          <div><span className={styles.t10MetaKey}>Date</span> <strong>{receipt.date}</strong></div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t10TableHead}>
        <span>S/N</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t10TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t10TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t10Divider} />
      {paymentRows.length > 0 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Payment History</div>
          <div className={styles.t10TableHead}>
            <span>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t10TableRow}>
              <span style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t10Divider} />
        </>
      )}
      <div className={styles.t10Bottom}>
        <div style={{ flex: 1 }}>
          <div className={styles.t10ThankYou}>{brand.footer || 'Thank you for your payment'}</div>
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
            <div className={styles.t10TotRow}><span>Order Value:</span><span>{fmt(currency, orderTotal)}</span></div>
            <div className={styles.t10TotRow}><span>Total Paid:</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t10TotRow} style={{ color: '#ef4444' }}><span>Balance:</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.t10TotDivider} />
            <div className={styles.t10TotTotal}>
              <span>{isFullPayment ? 'Paid:' : 'Received:'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
          <div className={styles.t10SignBlock}>
            <div className={styles.t10SignLine} />
            <div className={styles.t10SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>
      <svg
        style={{ position: 'absolute', bottom: 0, right: 0, width: 68, height: 58 }}
        viewBox="0 0 68 58"
      >
        <polygon points="68,0 68,58 0,58" fill={accentColor} />
      </svg>
    </div>
  )
}

// ── 11. Info Bar with Payment Tiles (blueclean) ───────────────
function BlueCleanTemplate({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#5da0d0'
  const barBg       = '#dbeeff'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

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
      <div className={styles.t11InvoiceTitle}>Receipt</div>
      <div className={styles.t11BlueBar} style={{ background: barBg, color: accentColor }}>
        <span>RECEIPT: #{receipt.number}</span>
        <span>DATE: {receipt.date}</span>
        <span>AMOUNT: {fmt(currency, thisPaymentTotal)}</span>
      </div>
      <div className={styles.t11IssuedRow}>
        <div>
          <div className={styles.t11IssuedLabel}>RECEIVED FROM</div>
          <div>{customer.name}</div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.t11AmountLabel} style={{ color: accentColor }}>AMOUNT PAID</div>
          <div className={styles.t11AmountVal} style={{ color: accentColor }}>{fmt(currency, thisPaymentTotal)}</div>
        </div>
      </div>
      {receipt.orderDesc && <div className={styles.t11ProjectName}>{receipt.orderDesc}</div>}
      <div className={styles.t11PayTitle}>Order Details</div>
      <div className={styles.t11TableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>S/N</span><span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t11TableRow}>
          <span style={{ flex: 3 }}>• {item.name}</span>
          <span>{i + 1}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t11TableRow}>
          <span style={{ flex: 3 }}>• {receipt.orderDesc || 'Garment Order'}</span>
          <span>1</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t11TotArea}>
        <div className={styles.t11TotRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.t11PayTitle}>Payment History</div>
          <div className={styles.t11TableHead} style={{ background: barBg, color: accentColor }}>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>S/N</span><span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t11TableRow}>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t11TotArea}>
            <div className={styles.t11TotRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t11TotRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.t11TotBold}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : accentColor }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t11TotArea}>
          {!isFullPayment && <div className={styles.t11TotRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={styles.t11TotBold}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : accentColor }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
      <div className={styles.t11ThankYou} style={{ color: accentColor }}>{brand.footer || 'THANK YOU!'}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Template map
// ─────────────────────────────────────────────────────────────

const TEMPLATE_MAP = {
  editable:      EditableTemplate,
  free:          FreeTemplate,
  custom:        CustomTemplate,
  printable:     PrintableTemplate,
  canva:         CanvaTemplate,
  darkheader:    DarkHeaderTemplate,
  redbold:       RedBoldTemplate,
  greenaccent:   GreenAccentTemplate,
  tealgeometric: TealGeometricTemplate,
  pinkdiagonal:  PinkDiagonalTemplate,
  blueclean:     BlueCleanTemplate,
}

// ── Main component ────────────────────────────────────────────

export default function ReceiptView({ receipt: initialReceipt, customer, onClose, onDelete, showToast }) {
  const { brand: liveBrand } = useBrand()
  const paperRef  = useRef(null)
  const [receipt,    setReceipt]    = useState(initialReceipt)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showShare,  setShowShare]  = useState(false)

  const templateKey = receipt.template || liveBrand.template || 'editable'
  const Template    = TEMPLATE_MAP[templateKey] || EditableTemplate

  // FIX: if the receipt has a brandSnapshot, use it exclusively for all brand
  // fields so the frozen-at-generation colours/details are always shown.
  // Only fall back to the live brand for fields the snapshot doesn't have.
  const effectiveBrand = receipt.brandSnapshot
    ? { ...liveBrand, ...receipt.brandSnapshot }
    : liveBrand

  // Derive isolated CSS variables from the frozen snapshot colour.
  // This overrides the global --brand-* tokens (set by useBrandTokens)
  // so templates always render with the colour active at generation time.
  const brandCSSVars = getBrandCSSVars(effectiveBrand.colour)

  const filename = `Receipt-${receipt.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

  const handleDownload = async () => {
    if (!paperRef.current) return
    setPdfLoading(true)
    showToast?.('Generating PDF…')
    try {
      await downloadPDF(paperRef.current, filename)
      showToast?.('PDF downloaded ✓')
    } catch (err) {
      console.error(err)
      showToast?.('PDF failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  const cumulativePaid = resolveCumulativePaid(receipt)
  const orderTotal     = receipt.orderPrice ? parseFloat(receipt.orderPrice) : cumulativePaid
  const isFullPay      = cumulativePaid >= orderTotal && orderTotal > 0

  return (
    <div className={styles.overlay}>
      <Header
        type="back"
        title={receipt.number}
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
            onClick: () => onDelete(receipt.id),
            style: { color: '#ef4444' },
          },
        ]}
      />

      <div className={styles.scrollArea}>
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${isFullPay ? styles.status_paid : styles.status_part_paid}`}>
            {isFullPay ? 'Paid in Full' : 'Part Payment'}
          </div>
        </div>
        <div className={styles.paperWrap}>
          <div className={styles.paperInner} ref={paperRef} style={brandCSSVars}>
            <Template receipt={receipt} customer={customer} brand={effectiveBrand} />
          </div>
        </div>
        {receipt.notes && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>Notes</div>
            <div className={styles.notesText}>{receipt.notes}</div>
          </div>
        )}
        <div style={{ height: 32 }} />
      </div>

      <ShareSheet
        open={showShare}
        onClose={() => setShowShare(false)}
        paperRef={paperRef}
        filename={filename}
        docNumber={receipt.number}
        customer={customer}
        brand={effectiveBrand}
        docType="Receipt"
        buildMessage={() => buildReceiptWhatsAppMessage(receipt, customer, effectiveBrand)}
      />
    </div>
  )
}
