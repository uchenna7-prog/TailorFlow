
import html2canvas from 'html2canvas'
import { opacity } from 'html2canvas/dist/types/css/property-descriptors/opacity'
import { jsPDF } from 'jspdf'

export function fmt(currency, amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calcTax(subtotal, taxRate, showTax) {
  if (!showTax || !taxRate) return 0
  return subtotal * (taxRate / 100)
}

export function getDueDate(invoice, dueDays) {
  if (invoice.due) return invoice.due
  try {
    const d = new Date(invoice.date)
    d.setDate(d.getDate() + (dueDays || 7))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}


export function sanitizePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\D/g, '').replace(/^0/, '')
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function luminance({ r, g, b }) {
  const ch = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

export function mixHex(hex, white, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const wr = parseInt(white.slice(1, 3), 16)
  const wg = parseInt(white.slice(3, 5), 16)
  const wb = parseInt(white.slice(5, 7), 16)
  const mix = (a, wv) => Math.round(a + (wv - a) * ratio)
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(mix(r, wr))}${toHex(mix(g, wg))}${toHex(mix(b, wb))}`
}

export function darkenHex(hex, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const d = v => Math.round(v * (1 - ratio))
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`
}

export function getBrandCSSVars(colour) {
  const hex = colour || '#D4AF37'
  const rgb = hexToRgb(hex)
  const lum = luminance(rgb)
  const onPrimary   = lum > 0.35 ? '#1a1a1a' : '#ffffff'
  const primary     = hex
  const primaryDark = darkenHex(hex, 0.25)
  const muted       = mixHex(hex, '#ffffff', 0.75)
  const surface     = mixHex(hex, '#ffffff', 0.92)
  const gradient    = hex

  return {
    '--brand-primary':      primary,
    '--brand-primary-dark': primaryDark,
    '--brand-gradient':     gradient,
    '--brand-on-primary':   onPrimary,
    '--brand-muted':        muted,
    '--brand-surface':      surface,
  }
}

export function buildInvoiceWhatsAppMessage(invoice, customer, brand) {
  const currency = brand?.currency || '₦'
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, brand?.taxRate, brand?.showTax)
  const total    = subtotal + tax

  const firstName  = customer.name?.split(' ')[0] || customer.name
  const statusMap  = { paid: 'Fully Paid ✅', part_paid: 'Part Payment', unpaid: 'Unpaid', overdue: 'Overdue ⚠️' }
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

export async function downloadPDF(paperEl, filename) {
  const blob = await generatePDFBlob(paperEl)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export async function generatePDFBlob(paperEl) {
  const PDF_W = 380

  // 1. Clone node
  const clone = paperEl.cloneNode(true)

  // 2. Force safe styles
  Object.assign(clone.style, {
    position: 'fixed',
    top: '-99999px',
    left: '-99999px',
    zIndex: '9999',
    width: `${PDF_W}px`,
    maxWidth: 'none',
    background: '#ffffff',
    overflow: 'visible',
    opacity:"0"
  })

  document.body.appendChild(clone)

  await document.fonts.ready
  await new Promise(r => setTimeout(r, 100))

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  document.body.removeChild(clone)

  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)

  return pdf.output('blob')
}