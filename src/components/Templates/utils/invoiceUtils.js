
import html2canvas from 'html2canvas'
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

