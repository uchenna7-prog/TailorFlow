
import styles from './ShareSheet.module.css'
import { useState } from "react"
import { sanitizePhone} from "../Templates/utils/invoiceUtils"
import { buildInvoiceWhatsAppMessage, generatePDFBlob } from '../InvoiceViewer/utils'

export function ShareSheet({ open, onClose, paperRef, filename, docNumber, customer, brand, docType, buildMessage }) {
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

  const handleSMS   = () => handleWithDownload(`sms:${phoneRaw}?body=${encodeURIComponent(message)}`)
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
      id: 'whatsapp', label: isGenerating ? 'Preparing…' : 'WhatsApp', onClick: handleWhatsApp,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M23.5 8.5A10.44 10.44 0 0016.01 5.5C10.76 5.5 6.5 9.76 6.5 15.01c0 1.68.44 3.32 1.28 4.77L6.4 25.6l5.97-1.57a10.43 10.43 0 004.63 1.08h.01c5.25 0 9.51-4.26 9.51-9.51A9.44 9.44 0 0023.5 8.5zm-7.49 14.64h-.01a8.66 8.66 0 01-4.42-1.21l-.32-.19-3.3.87.88-3.22-.2-.33a8.67 8.67 0 01-1.33-4.65c0-4.79 3.9-8.69 8.7-8.69a8.64 8.64 0 016.15 2.55 8.64 8.64 0 012.54 6.15c0 4.8-3.9 8.72-8.69 8.72zm4.77-6.51c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.91-.21-.5-.42-.43-.58-.44l-.49-.01c-.17 0-.45.06-.68.32-.23.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.16-.49-.29z" fill="#fff"/></svg>,
    },
    {
      id: 'telegram', label: 'Telegram', onClick: handleTelegram,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#229ED9"/><path d="M22.8 9.6L6.4 15.9c-1.1.4-1.1 1.1-.2 1.4l4 1.2 1.5 4.7c.2.5.4.7.8.7.3 0 .5-.1.7-.3l2.4-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.4-1.7-1.3-1.3zm-9.5 9l-.3 3.2-1.3-4.1 9.8-6.2-8.2 7.1z" fill="#fff"/></svg>,
    },
    {
      id: 'sms', label: 'SMS', onClick: handleSMS,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#34C759"/><path d="M22 9H10a2 2 0 00-2 2v8a2 2 0 002 2h2l2 3 2-3h6a2 2 0 002-2v-8a2 2 0 00-2-2z" fill="#fff"/><circle cx="12" cy="15" r="1.3" fill="#34C759"/><circle cx="16" cy="15" r="1.3" fill="#34C759"/><circle cx="20" cy="15" r="1.3" fill="#34C759"/></svg>,
    },
    {
      id: 'email', label: 'Email', onClick: handleEmail,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#EA4335"/><path d="M24 11H8a1 1 0 00-1 1v9a1 1 0 001 1h16a1 1 0 001-1v-9a1 1 0 00-1-1zm-1.5 2L16 17.5 9.5 13h13zm.5 8H9v-7.3l7 4.8 7-4.8V21z" fill="#fff"/></svg>,
    },
    {
      id: 'copy', label: status === 'done' ? 'Copied!' : 'Copy Text', onClick: handleCopy,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#6366f1"/><path d="M20 8h-8a2 2 0 00-2 2v11h2V10h8V8zm3 4h-7a2 2 0 00-2 2v10a2 2 0 002 2h7a2 2 0 002-2V14a2 2 0 00-2-2zm0 12h-7V14h7v10z" fill="#fff"/></svg>,
    },
    {
      id: 'native', label: 'More', onClick: handleNativeShare,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#8e8e93"/><circle cx="10" cy="16" r="2.2" fill="#fff"/><circle cx="16" cy="16" r="2.2" fill="#fff"/><circle cx="22" cy="16" r="2.2" fill="#fff"/></svg>,
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
            <button key={app.id} className={styles.shareItem} onClick={app.onClick} disabled={isGenerating}>
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
        <button className={styles.sheetDownloadBtn} onClick={handleDownloadOnly} disabled={isGenerating}>
          <span className="mi" style={{ fontSize: '1.1rem' }}>download</span>
          {isGenerating ? 'Generating…' : 'Download PDF'}
        </button>
        <button className={styles.sheetCancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
