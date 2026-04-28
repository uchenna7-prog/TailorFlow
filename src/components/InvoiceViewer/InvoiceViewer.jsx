import { useRef, useState } from 'react'
import { useBrand } from '../../contexts/BrandContext'
import Header from '../Header/Header'
import styles from './InvoiceViewer.module.css'
import { TEMPLATE_MAPPINGS } from '../Templates/datas/invoiceTemplateMappings'
import { getBrandCSSVars,buildInvoiceWhatsAppMessage,downloadPDF } from './utils'
import { ShareSheet } from '../ShareSheet/ShareSheet'


const STATUS_LABELS = {
  unpaid:    'Unpaid',
  part_paid: 'Part Payment',
  paid:      'Full Payment',
  overdue:   'Overdue',
}

export default function InvoiceViewer({ 
  invoice: initialInvoice, 
  customer, 
  onClose, 
  onStatusChange, 
  onDelete, 
  showToast 
}) {
  const { brand } = useBrand()
  const paperRef  = useRef(null)
  const [invoice,    setInvoice]    = useState(initialInvoice)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showShare,  setShowShare]  = useState(false)

  const templateKey = brand.invoiceTemplate || 'invoiceTemplate1'
  const Template = TEMPLATE_MAPPINGS[templateKey] || TEMPLATE_MAPPINGS.invoiceTemplate1

  const effectiveBrand = invoice.brandSnapshot
    ? { ...brand, ...invoice.brandSnapshot }
    : brand

  const brandCSSVars = getBrandCSSVars(effectiveBrand.colour)
  const filename     = `Invoice-${invoice.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

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

  // Single paper element — one ref, works for both layout branches
  const paper = (
    <div className={styles.paperWrap}>
      <div className={styles.paperInner} ref={paperRef} style={brandCSSVars}>
        <Template invoice={invoice} customer={customer} brand={effectiveBrand} />
      </div>
    </div>
  )

  const notes = invoice.notes ? (
    <div className={styles.notesBox}>
      <div className={styles.notesLabel}>Notes</div>
      <div className={styles.notesText}>{invoice.notes}</div>
    </div>
  ) : null

  const badge = (
    <div className={styles.statusRow}>
      <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
        {STATUS_LABELS[invoice.status] || invoice.status}
      </div>
    </div>
  )

  return (
    <div className={styles.overlay}>
      <Header
        type="back"
        title={invoice.number}
        onBackClick={onClose}
        customActions={[
          { icon: pdfLoading ? 'hourglass_top' : 'download', onClick: handleDownload, disabled: pdfLoading },
          { icon: 'share', onClick: () => setShowShare(true) },
          { icon: 'delete', onClick: () => onDelete(invoice.id), style: { color: '#ef4444' } },
        ]}
      />

      <div className={styles.scrollArea}>

        {/* ── MOBILE: original untouched stacked layout ── */}
        <div className={styles.mobileLayout}>
          {badge}
          {paper}
          {notes}
        </div>

        {/* ── DESKTOP: centred two-column layout ── */}
        <div className={styles.desktopLayout}>
          {badge}
          <div className={styles.desktopColumns}>
            <div className={styles.previewCol}>{paper}</div>
            <div className={styles.metaCol}>{notes}</div>
          </div>
        </div>

        <div style={{ height: 32 }} />
      </div>

      <ShareSheet
        open={showShare}
        onClose={() => setShowShare(false)}
        paperRef={paperRef}
        filename={filename}
        docNumber={invoice.number}
        customer={customer}
        brand={effectiveBrand}
        docType="Invoice"
        buildMessage={() => buildInvoiceWhatsAppMessage(invoice, customer, effectiveBrand)}
      />
    </div>
  )
}