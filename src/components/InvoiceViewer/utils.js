import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ── Phone ─────────────────────────────────────────────────────

export function sanitizePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\D/g, '').replace(/^0/, '')
}

// ── Currency formatter ────────────────────────────────────────

export function fmt(currency, amount) {
  return `${currency || '₦'}${parseFloat(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ── Payment helpers ───────────────────────────────────────────

export function resolveCumulativePaid(invoice) {
  if (invoice.cumulativePaid != null) return parseFloat(invoice.cumulativePaid)
  return (invoice.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
}

export function buildPaymentRows(invoice) {
  const previous = invoice.previousInstallments || []
  const current  = invoice.payments || []
  const rows     = []

  if (previous.length > 0) {
    previous.forEach((p, i) => rows.push({ ...p, _isCurrent: false, _sn: i + 1 }))
  } else if (parseFloat(invoice.previousPaid) > 0) {
    rows.push({
      id: '__prev__', amount: invoice.previousPaid,
      date: 'Prior payments', method: null,
      _isCurrent: false, _sn: 1,
    })
  }

  const offset = rows.length
  current.forEach((p, i) => rows.push({ ...p, _isCurrent: true, _sn: offset + i + 1 }))

  return rows
}

// ── Brand CSS variables ───────────────────────────────────────

export function hexToRgb(hex) {
  const h    = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n    = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function luminance({ r, g, b }) {
  const channel = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2]
}

function mixHex(hex, white, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const wr = parseInt(white.slice(1, 3), 16)
  const wg = parseInt(white.slice(3, 5), 16)
  const wb = parseInt(white.slice(5, 7), 16)
  const mix   = (a, w) => Math.round(a + (w - a) * ratio)
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(mix(r, wr))}${toHex(mix(g, wg))}${toHex(mix(b, wb))}`
}

function darkenHex(hex, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const d     = v => Math.round(v * (1 - ratio))
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`
}

export function getBrandCSSVars(colour) {
  const hex       = colour || '#D4AF37'
  const rgb       = hexToRgb(hex)
  const lum       = luminance(rgb)
  const onPrimary = lum > 0.35 ? '#1a1a1a' : '#ffffff'

  return {
    '--brand-primary':      hex,
    '--brand-primary-dark': darkenHex(hex, 0.25),
    '--brand-gradient':     hex,
    '--brand-on-primary':   onPrimary,
    '--brand-muted':        mixHex(hex, '#ffffff', 0.75),
    '--brand-surface':      mixHex(hex, '#ffffff', 0.92),
  }
}

// ── WhatsApp message ──────────────────────────────────────────

export function buildInvoiceWhatsAppMessage(invoice, customer, brand) {
  const currency       = brand?.currency || '₦'
  const firstName      = customer.name?.split(' ')[0] || customer.name
  const cumulativePaid = resolveCumulativePaid(invoice)
  const orderTotal     = invoice.orderPrice
    ? parseFloat(invoice.orderPrice)
    : invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const balanceLeft = Math.max(0, orderTotal - cumulativePaid)
  const isFullPay   = balanceLeft <= 0

  const lines = [
    `Hi ${firstName},`,
    '',
    `Here is your payment invoice from *${brand?.name || 'us'}*. 🧾`,
    '',
    '*invoice Details*',
    `invoice No: *${invoice.number}*`,
    `Date: ${invoice.date}`,
    '',
  ]

  if (invoice.items?.length > 0) {
    lines.push('*Order Breakdown*')
    invoice.items.forEach(item => lines.push(`• ${item.name} — ${fmt(currency, item.price)}`))
    lines.push(`Order Total: ${fmt(currency, orderTotal)}`)
    lines.push('')
  }

  if (invoice.payments?.length > 0) {
    lines.push(`*Payment${invoice.payments.length > 1 ? 's' : ''} Received*`)
    invoice.payments.forEach((p, idx) => {
      const label  = invoice.payments.length > 1 ? `Payment ${idx + 1}` : 'Amount Paid'
      const method = p.method ? ` (${p.method.charAt(0).toUpperCase() + p.method.slice(1)})` : ''
      lines.push(`${label}${method}: *${fmt(currency, p.amount)}*`)
    })
    lines.push('')
  }

  if (isFullPay) {
    lines.push('✅ *Your order is fully paid. Thank you!*')
  } else {
    lines.push(`Balance Remaining: *${fmt(currency, balanceLeft)}*`)
    lines.push('Please note there is an outstanding balance on your order.')
  }

  lines.push('')
  if (brand?.phone) lines.push(`For any questions, reach us at ${brand.phone}.`)
  lines.push('Thank you! 🙏')

  return lines.join('\n')
}

// ── PDF core ──────────────────────────────────────────────────

async function renderElementToBlob(element, cssVars) {
  const PDF_WIDTH = 380
  const INITIAL_HEIGHT = 5000

  // ── 1. Collect all stylesheets ───────────────────────────────
  const styleTexts = await Promise.all(
    Array.from(document.styleSheets).map(async sheet => {
      try {
        if (sheet.cssRules) {
          return Array.from(sheet.cssRules).map(r => r.cssText).join('\n')
        }
      } catch (_) { /* cross-origin */ }
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href)
          return await res.text()
        } catch (_) { return '' }
      }
      return ''
    })
  )

  // ── 2. Create iframe ─────────────────────────────────────────
  const iframe = document.createElement('iframe')
  Object.assign(iframe.style, {
    position:   'fixed',
    top:        '-99999px',
    left:       '-99999px',
    width:      `${PDF_WIDTH}px`,
    height:     `${INITIAL_HEIGHT}px`,
    border:     'none',
    visibility: 'hidden',
  })
  document.body.appendChild(iframe)

  const iDoc = iframe.contentDocument
  const iWin = iframe.contentWindow

  // ── 3. Write content ─────────────────────────────────────────
  // The critical override is the last <style> block:
  // - The .template div uses overflow:hidden which clips the corner SVG
  // - We force overflow:visible on ALL elements so nothing is clipped
  // - We also force the template to use its natural height (not min-height)
  //   so the bottom SVG anchors to the actual bottom of the content
  iDoc.open()
  iDoc.write(`
    <!DOCTYPE html>
    <html style="width:${PDF_WIDTH}px; min-height:${INITIAL_HEIGHT}px;">
      <head>
        <meta charset="utf-8"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: ${PDF_WIDTH}px;
            min-height: ${INITIAL_HEIGHT}px;
            background: #fff;
            overflow: visible;
          }
          ${styleTexts.join('\n')}
          /* ── PDF capture overrides ──────────────────────────
             Must come AFTER the copied stylesheets so they win.
             1. Remove overflow:hidden everywhere — it clips
                position:absolute children like the corner SVG.
             2. Remove min-height constraints so the template
                stretches to its true content height, letting
                bottom:0 on the corner SVG land in the right place.
          ─────────────────────────────────────────────────── */
          * {
            overflow: visible !important;
          }
          body > *,
          body > * * {
            min-height: unset !important;
          }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `)
  iDoc.close()

  // Apply brand CSS vars
  const iframeEl = iDoc.body.firstElementChild
  if (cssVars && iframeEl) {
    Object.entries(cssVars).forEach(([k, v]) => iframeEl.style.setProperty(k, v))
  }

  // ── 4. Wait for layout + fonts ───────────────────────────────
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  await new Promise(r => setTimeout(r, 200))

  // ── 5. Measure true height ───────────────────────────────────
  let trueHeight = iDoc.body.scrollHeight

  iDoc.body.querySelectorAll('*').forEach(el => {
    const rect   = el.getBoundingClientRect()
    const bottom = rect.bottom + iWin.scrollY
    if (bottom > trueHeight) trueHeight = bottom
  })

  const height = Math.ceil(trueHeight) + 8

  iframe.style.height                  = `${height}px`
  iDoc.documentElement.style.minHeight = `${height}px`
  iDoc.body.style.minHeight            = `${height}px`

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

  // ── 6. Capture ───────────────────────────────────────────────
  const canvas = await html2canvas(iDoc.body, {
    scale:           1.5,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: '#ffffff',
    logging:         false,
    width:           PDF_WIDTH,
    height,
    windowWidth:     PDF_WIDTH,
    windowHeight:    height,
    scrollX:         0,
    scrollY:         0,
  })

  // ── 7. Clean up ──────────────────────────────────────────────
  document.body.removeChild(iframe)

  // ── 8. Build PDF ─────────────────────────────────────────────
  const imgData = canvas.toDataURL('image/jpeg',0.82)
  const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PDF_WIDTH, height] })
  pdf.addImage(imgData, 'JPEG', 0, 0, PDF_WIDTH, height)

  return pdf.output('blob')
}

export async function generatePDFBlob(element, cssVars) {
  return renderElementToBlob(element, cssVars)
}

export async function downloadPDF(element, filename, cssVars) {
  const blob = await renderElementToBlob(element, cssVars)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function sharePDF(element, filename, message, cssVars) {
  const blob = await renderElementToBlob(element, cssVars)
  const file = new File([blob], filename, { type: 'application/pdf' })

  const canShareFile = typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] })

  if (canShareFile) {
    await navigator.share({ files: [file], text: message })
  } else if (typeof navigator.share === 'function') {
    await navigator.share({ title: filename, text: message })
  } else {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
  }
}