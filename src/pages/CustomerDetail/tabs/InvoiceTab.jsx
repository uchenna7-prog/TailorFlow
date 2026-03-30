import { useState } from 'react'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './Tabs.module.css'

function InvoiceDetail({ invoice, customer, onClose, onDelete, onStatusChange }) {
  if (!invoice) return null
  const priceEach = invoice.price ?? 0
  const total = priceEach * invoice.qty
  const priceStr = priceEach ? `₦${Number(priceEach).toLocaleString()}` : '—'
  const totalStr = priceEach ? `₦${Number(total).toLocaleString()}` : '—'

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <div className={styles.detailHeader}>
        <button className="mi" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem' }}>arrow_back</button>
        <h3 style={{ flex: 1 }}>{invoice.number}</h3>
        <button className="mi" onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.3rem' }}>delete_outline</button>
      </div>
      <div className={styles.detailBody}>
        <div className={styles.invoiceStatusRow}>
          <button className={`${styles.invoiceStatusBtn} ${invoice.status === 'paid' ? styles.invoicePaid : ''}`} onClick={() => onStatusChange(invoice.id, 'paid')}>Paid</button>
          <button className={`${styles.invoiceStatusBtn} ${invoice.status !== 'paid' ? styles.invoiceUnpaid : ''}`} onClick={() => onStatusChange(invoice.id, 'unpaid')}>Unpaid</button>
        </div>
        <div className={styles.invoiceDoc}>
          <div className={styles.invoiceDocHeader}>
            <div><div className={styles.invoiceBrand}>Tailor<span>Book</span></div><div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{invoice.date}</div></div>
            <div className={styles.invoiceNumBlock}><div className={styles.invLabel}>Invoice</div><div className={styles.invValue}>{invoice.number}</div></div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className={styles.invoiceSectionLabel}>Bill To</div>
            <div className={styles.clientName}>{customer.name}</div>
            <div className={styles.clientPhone}>{customer.phone}</div>
          </div>
          <table className={styles.invoiceTable}>
            <thead><tr><th>Description</th><th style={{ textAlign: 'center' }}>Qty</th><th>Amount</th></tr></thead>
            <tbody>
              <tr>
                <td className={styles.itemName}>{invoice.orderDesc}</td>
                <td style={{ textAlign: 'center' }}>{invoice.qty}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{priceStr}</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.invoiceTotalRow}><div className={styles.totalLabel}>Total</div><div className={styles.totalValue}>{totalStr}</div></div>
          <div className={styles.invoiceFooter}>Thank you for your patronage 🙏</div>
        </div>
      </div>
    </div>
  )
}

export default function InvoiceTab({ invoices, customer, onDelete, onStatusChange, showToast }) {
  const [detailInvoice, setDetailInvoice] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const handleDeleteConfirm = () => {
    onDelete(confirmDel.id)
    showToast('Invoice deleted')
    setConfirmDel(null)
    setDetailInvoice(null)
  }

  return (
    <>
      {invoices.length === 0 && (
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>receipt_long</span>
          <p>No invoices yet.</p>
        </div>
      )}
      {invoices.map(inv => (
        <div key={inv.id} className={styles.invoiceCard} onClick={() => setDetailInvoice(inv)}>
          <div className={styles.invoiceCardIcon}><span className="mi">receipt_long</span></div>
          <div className={styles.invoiceCardInfo}>
            <h4>{inv.orderDesc}</h4>
            <p>{inv.date} <span className={`${styles.statusBadge} ${inv.status === 'paid' ? styles.statusDone : styles.statusPending}`}>{inv.status}</span></p>
          </div>
          <div className={styles.invoiceNumber}>{inv.number}</div>
        </div>
      ))}
      {detailInvoice && <InvoiceDetail invoice={detailInvoice} customer={customer} onClose={() => setDetailInvoice(null)} onDelete={() => setConfirmDel(detailInvoice)} onStatusChange={onStatusChange} />}
      <ConfirmSheet open={!!confirmDel} title="Delete Invoice?" onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDel(null)} />
    </>
  )
}
