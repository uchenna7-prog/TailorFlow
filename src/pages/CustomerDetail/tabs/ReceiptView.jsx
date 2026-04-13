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

// ── PDF generator ─────────────────────────────────────────────

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
  const pdfW    = 450
  const pdfH    = (canvas.height * pdfW) / canvas.width
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pdfW, pdfH] })
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
  pdf.save(filename)
}

// ── Share Sheet ───────────────────────────────────────────────

const SHARE_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 32 32" width="30" height="30">
        <circle cx="16" cy="16" r="16" fill="#25D366"/>
        <path d="M23.5 8.5A10.44 10.44 0 0016.01 5.5C10.76 5.5 6.5 9.76 6.5 15.01c0 1.68.44 3.32 1.28 4.77L6.4 25.6l5.97-1.57a10.43 10.43 0 004.63 1.08h.01c5.25 0 9.51-4.26 9.51-9.51A9.44 9.44 0 0023.5 8.5zm-7.49 14.64h-.01a8.66 8.66 0 01-4.42-1.21l-.32-.19-3.3.87.88-3.22-.2-.33a8.67 8.67 0 01-1.33-4.65c0-4.79 3.9-8.69 8.7-8.69a8.64 8.64 0 016.15 2.55 8.64 8.64 0 012.54 6.15c0 4.8-3.9 8.72-8.69 8.72zm4.77-6.51c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.91-.21-.5-.42-.43-.58-.44l-.49-.01c-.17 0-.45.06-.68.32-.23.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.16-.49-.29z" fill="#fff"/>
      </svg>
    ),
    getUrl: (text) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: (
      <svg viewBox="0 0 32 32" width="30" height="30">
        <circle cx="16" cy="16" r="16" fill="#229ED9"/>
        <path d="M22.8 9.6L6.4 15.9c-1.1.4-1.1 1.1-.2 1.4l4 1.2 1.5 4.7c.2.5.4.7.8.7.3 0 .5-.1.7-.3l2.4-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.4-1.7-1.3-1.3zm-9.5 9l-.3 3.2-1.3-4.1 9.8-6.2-8.2 7.1z" fill="#fff"/>
      </svg>
    ),
    getUrl: (text) => `https://t.me/share/url?url=${encodeURIComponent(text)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: (
      <svg viewBox="0 0 32 32" width="30" height="30">
        <circle cx="16" cy="16" r="16" fill="#34C759"/>
        <path d="M22 9H10a2 2 0 00-2 2v8a2 2 0 002 2h2l2 3 2-3h6a2 2 0 002-2v-8a2 2 0 00-2-2z" fill="#fff"/>
        <circle cx="12" cy="15" r="1.3" fill="#34C759"/>
        <circle cx="16" cy="15" r="1.3" fill="#34C759"/>
        <circle cx="20" cy="15" r="1.3" fill="#34C759"/>
      </svg>
    ),
    getUrl: (text) => `sms:?body=${encodeURIComponent(text)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: (
      <svg viewBox="0 0 32 32" width="30" height="30">
        <circle cx="16" cy="16" r="16" fill="#EA4335"/>
        <path d="M24 11H8a1 1 0 00-1 1v9a1 1 0 001 1h16a1 1 0 001-1v-9a1 1 0 00-1-1zm-1.5 2L16 17.5 9.5 13h13zm.5 8H9v-7.3l7 4.8 7-4.8V21z" fill="#fff"/>
      </svg>
    ),
    getUrl: (subject, body) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  },
  {
    id: 'copy',
    label: 'Copy Text',
    icon: (
      <svg viewBox="0 0 32 32" width="30" height="30">
        <circle cx="16" cy="16" r="16" fill="#6366f1"/>
        <path d="M20 8h-8a2 2 0 00-2 2v11h2V10h8V8zm3 4h-7a2 2 0 00-2 2v10a2 2 0 002 2h7a2 2 0 002-2V14a2 2 0 00-2-2zm0 12h-7V14h7v10z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: 'native',
    label: 'More',
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

function ShareSheet({ open, onClose, onDownload, docNumber, customerName, docType = 'Receipt' }) {
  const [copied,  setCopied]  = useState(false)
  const [sharing, setSharing] = useState(false)

  if (!open) return null

  const shareText = `${docType} ${docNumber} for ${customerName}`

  const handleOption = async (opt) => {
    if (opt.id === 'copy') {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch { /* silent */ }
      return
    }

    if (opt.id === 'native') {
      if (navigator.share) {
        try { await navigator.share({ title: shareText, text: shareText }) } catch { /* cancelled */ }
      }
      return
    }

    setSharing(true)
    await onDownload()
    setSharing(false)

    const url = opt.id === 'email'
      ? opt.getUrl(shareText, `Please find attached: ${shareText}.\n\nThe PDF has been downloaded to your device.`)
      : opt.getUrl(`${shareText} — PDF saved to your device.`)

    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className={styles.sheetBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>Share {docType}</div>
        <div className={styles.sheetSub}>{docNumber} · {customerName}</div>

        <div className={styles.shareGrid}>
          {SHARE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={styles.shareItem}
              onClick={() => handleOption(opt)}
              disabled={sharing}
            >
              <div className={styles.shareIconWrap}>
                {sharing && ['whatsapp','telegram','sms','email'].includes(opt.id)
                  ? <span className="mi" style={{ fontSize: 28, color: '#aaa' }}>hourglass_top</span>
                  : opt.icon
                }
              </div>
              <span className={styles.shareLabel}>
                {opt.id === 'copy' && copied ? 'Copied!' : opt.label}
              </span>
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

// ── Receipt-specific items table ──────────────────────────────

function ReceiptItemsTable({ receipt, brand }) {
  const { currency, showTax, taxRate } = brand

  const orderTotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(receipt.orderPrice) || 0)

  const tax            = calcTax(orderTotal, taxRate, showTax)
  const cumulativePaid = resolveCumulativePaid(receipt)
  const previousPaid   = parseFloat(receipt.previousPaid) || 0
  const hasPrevious    = (receipt.previousInstallments?.length > 0) || previousPaid > 0

  const newBalanceValue  = Math.max(0, orderTotal - previousPaid)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tHead}>
        <span className={styles.tColDesc}>Description</span>
        <span className={styles.tColNum}>Amount</span>
      </div>
      <div className={styles.tRowMain}>
        <div className={styles.tColDesc}>{receipt.orderDesc || 'Garment Order'}</div>
        <div className={styles.tColNum}>{fmt(currency, orderTotal)}</div>
      </div>

      {receipt.items?.length > 0 && (
        <div className={styles.itemizedSection}>
          <div className={styles.itemizedLabel}>Garments:</div>
          {receipt.items.map((item, idx) => (
            <div key={idx} className={styles.tRowSub}>
              <span className={styles.tColDesc}>• {item.name}</span>
              <span className={styles.tColNum}>{fmt(currency, item.price)}</span>
            </div>
          ))}
        </div>
      )}

      {hasPrevious && (
        <div className={styles.itemizedSection} style={{ marginTop: 8 }}>
          <div className={styles.itemizedLabel}>Previous Payments:</div>
          {(receipt.previousInstallments || []).map((p, idx) => (
            <div key={idx} className={styles.tRowSub}>
              <span className={styles.tColDesc}>
                {p.date}{p.method ? ` · ${p.method.charAt(0).toUpperCase() + p.method.slice(1)}` : ''}
              </span>
              <span className={styles.tColNum} style={{ color: '#6b7280', fontWeight: 600 }}>
                {fmt(currency, p.amount)}
              </span>
            </div>
          ))}
          {!receipt.previousInstallments?.length && previousPaid > 0 && (
            <div className={styles.tRowSub}>
              <span className={styles.tColDesc}>Prior payments</span>
              <span className={styles.tColNum} style={{ color: '#6b7280', fontWeight: 600 }}>
                {fmt(currency, previousPaid)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={styles.itemizedSection} style={{ marginTop: 8 }}>
        <div className={styles.itemizedLabel}>Payments Received:</div>
        {(receipt.payments || []).map((p, idx) => (
          <div key={idx} className={styles.tRowSub}>
            <span className={styles.tColDesc}>
              {p.date}
              {p.method ? ` · ${p.method.charAt(0).toUpperCase() + p.method.slice(1)}` : ''}
              {receipt.payments.length > 1 ? ` (payment ${idx + 1})` : ''}
            </span>
            <span className={styles.tColNum} style={{ color: '#16a34a', fontWeight: 700 }}>
              {fmt(currency, p.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        {showTax && taxRate > 0 && (
          <div className={styles.sumRow}>
            <span>Tax ({taxRate}%)</span>
            <span>{fmt(currency, tax)}</span>
          </div>
        )}
        {hasPrevious ? (
          <>
            <div className={styles.sumRow}>
              <span>New Balance Value</span>
              <span>{fmt(currency, newBalanceValue)}</span>
            </div>
            <div className={styles.sumRow}>
              <span>Amount Paid</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.sumRow}>
              <span>Order Value</span>
              <span>{fmt(currency, orderTotal)}</span>
            </div>
            <div className={styles.sumRow}>
              <span>Amount Paid</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </>
        )}
        {!isFullPayment && (
          <div className={styles.sumRow}>
            <span>Balance Remaining</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span>
          </div>
        )}
        <div className={`${styles.sumRow} ${styles.sumTotal}`}>
          <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
          <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>
            {fmt(currency, thisPaymentTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

function LogoOrName({ brand, darkBg = false }) {
  if (brand.logo) return <img src={brand.logo} alt={brand.name} className={styles.logoImg} />
  return (
    <div className={styles.logoText} style={{ color: darkBg ? '#fff' : '#1a1a1a' }}>
      {brand.name || 'Your Brand'}
    </div>
  )
}

// ── TEMPLATES ─────────────────────────────────────────────────

function EditableTemplate({ receipt, customer, brand }) {
  return (
    <div className={styles.tplBase}>
      <div className={styles.editHeader}>
        <LogoOrName brand={brand} />
        {brand.tagline && <div className={styles.editTagline}>{brand.tagline}</div>}
        {brand.address && <div className={styles.editAddr}>{brand.address}</div>}
        <div className={styles.editTitle}>RECEIPT</div>
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
      <ReceiptItemsTable receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
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

function PrintableTemplate({ receipt, customer, brand }) {
  const barColor = brand.colour || '#eab308'
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
      <ReceiptItemsTable receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
      <div className={styles.printFooterCentered}>
        {brand.footer && <div className={styles.footSection}>{brand.footer}</div>}
      </div>
    </div>
  )
}

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
            {brand.phone && <div className={styles.metaSub}>{brand.phone}</div>}
          </div>
          <div>
            <div className={styles.metaLabel}>RECEIVED FROM</div>
            <div className={styles.metaVal}>{customer.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.metaLabel}>DATE</div>
            <div className={styles.metaSub}>{receipt.date}</div>
          </div>
        </div>
        <ReceiptItemsTable receipt={receipt} brand={brand} />
      </div>
      <div className={styles.customFooter}>
        <div className={styles.customFooterText} style={{ color: bannerBg }}>
          {brand.footer || 'Thank you for your payment'}
        </div>
      </div>
    </div>
  )
}

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
        <div className={styles.freeBox}><strong>FROM</strong><br />{brand.name}<br />{brand.phone}</div>
        <div className={styles.freeBox}><strong>RECEIVED FROM</strong><br />{customer.name}<br />{customer.phone}</div>
        <div className={styles.freeBox}><strong>DATE</strong><br />{receipt.date}</div>
      </div>
      <ReceiptItemsTable receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
      <div className={styles.freeFooterCentered}>{brand.footer || 'Thank you!'}</div>
    </div>
  )
}

const TEMPLATE_MAP = {
  editable:  EditableTemplate,
  printable: PrintableTemplate,
  custom:    CustomTemplate,
  free:      FreeTemplate,
}

// ── Main component ────────────────────────────────────────────

export default function ReceiptView({ receipt: initialReceipt, customer, onClose, onDelete, showToast }) {
  const { brand } = useBrand()
  const paperRef  = useRef(null)
  const [receipt,    setReceipt]    = useState(initialReceipt)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showShare,  setShowShare]  = useState(false)

  const templateKey    = receipt.template || brand.template || 'editable'
  const Template       = TEMPLATE_MAP[templateKey] || EditableTemplate
  const effectiveBrand = { ...brand, ...(receipt.brandSnapshot || {}) }
  const filename       = `${receipt.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

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

        <div className={styles.paperWrap} ref={paperRef}>
          <Template receipt={receipt} customer={customer} brand={effectiveBrand} />
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
        onDownload={handleDownload}
        docNumber={receipt.number}
        customerName={customer.name}
        docType="Receipt"
      />
    </div>
  )
}
