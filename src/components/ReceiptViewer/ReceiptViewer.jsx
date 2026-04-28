import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useBrand } from '../../contexts/BrandContext'
import Header from '../Header/Header'
import styles from './ReceiptViewer.module.css'
import { TEMPLATE_MAPPINGS } from '../Templates/datas/receiptTemplateMappings'
import { getBrandCSSVars, downloadPDF, resolveCumulativePaid, buildReceiptWhatsAppMessage } from './utils'
import ShareSheet from '../ShareSheet/ShareSheet'




export default function ReceiptViewer({ receipt: initialReceipt, customer, onClose, onDelete, showToast }) {
  const { brand } = useBrand()
  const paperRef  = useRef(null)
  const [receipt,    setReceipt]    = useState(initialReceipt)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showShare,  setShowShare]  = useState(false)

  const templateKey = receipt.template || brand.receiptTemplate || 'receiptTemplate1'
  const Template    = TEMPLATE_MAPPINGS[templateKey] || TEMPLATE_MAPPINGS.receiptTemplate1

  // FIX: if the receipt has a brandSnapshot, use it exclusively for all brand
  // fields so the frozen-at-generation colours/details are always shown.
  // Only fall back to the live brand for fields the snapshot doesn't have.
  const effectiveBrand = receipt.brandSnapshot
    ? { ...brand, ...receipt.brandSnapshot }
    : brand

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
