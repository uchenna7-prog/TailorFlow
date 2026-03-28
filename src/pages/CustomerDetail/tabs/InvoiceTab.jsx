import { useState, useEffect } from 'react'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import styles from './Tabs.module.css'

// ── INVOICE DETAIL ──
function InvoiceDetail({ invoice, customer, onClose, onDelete, onStatusChange }) {
  if (!invoice) return null
  const priceEach = invoice.price ?? 0
  const total     = priceEach * invoice.qty
  const priceStr  = priceEach ? `₦${Number(priceEach).toLocaleString()}` : '—'
  const totalStr  = priceEach ? `₦${Number(total).toLocaleString()}` : '—'

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <div className={styles.detailHeader}>
        <button className="mi" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.6rem', cursor: 'pointer' }}>arrow_back</button>
        <h3 style={{ flex: 1 }}>{invoice.number}</h3>
        <button className="mi" onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.3rem', cursor: 'pointer' }}>delete_outline</button>
      </div>
      <div className={styles.detailBody}>
        {/* Status toggle */}
        <div className={styles.invoiceStatusRow}>
          {invoice.status === 'paid'
            ? <>
                <button className={`${styles.invoiceStatusBtn} ${styles.invoicePaid}`} onClick={() => onStatusChange(invoice.id, 'paid')}>✓ Paid</button>
                <button className={styles.invoiceStatusBtn} onClick={() => onStatusChange(invoice.id, 'unpaid')}>Mark Unpaid</button>
              </>
            : <>
                <button className={`${styles.invoiceStatusBtn} ${styles.invoiceUnpaid}`} onClick={() => onStatusChange(invoice.id, 'unpaid')}>Unpaid</button>
                <button className={styles.invoiceStatusBtn} onClick={() => onStatusChange(invoice.id, 'paid')}>Mark as Paid</button>
              </>
          }
        </div>

        {/* Invoice document */}
        <div className={styles.invoiceDoc}>
          <div className={styles.invoiceDocHeader}>
            <div>
              <div className={styles.invoiceBrand}>Tailor<span>Book</span></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>{invoice.date}</div>
            </div>
            <div className={styles.invoiceNumBlock}>
              <div className={styles.invLabel}>Invoice</div>
              <div className={styles.invValue}>{invoice.number}</div>
              {invoice.due && <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 4 }}>Due {invoice.due}</div>}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className={styles.invoiceSectionLabel}>Bill To</div>
            <div className={styles.clientName}>{customer.name}</div>
            <div className={styles.clientPhone}>{customer.phone}</div>
          </div>

          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.itemName}>{invoice.orderDesc}</td>
                <td style={{ textAlign: 'center' }}>{invoice.qty}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{priceStr}</td>
              </tr>
              {invoice.linkedNames?.length > 0 && (
                <tr>
                  <td colSpan="3" style={{ fontSize: '0.72rem', color: 'var(--text3)', paddingTop: 4, borderBottom: 'none' }}>
                    {invoice.linkedNames.join(', ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className={styles.invoiceTotalRow}>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalValue}>{totalStr}</div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text3)' }}>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.6rem' }}>Notes</span>
              <br />
              <span style={{ color: 'var(--text2)' }}>{invoice.notes}</span>
            </div>
          )}

          <div className={styles.invoiceFooter}>Thank you for your patronage 🙏</div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN TAB ──
export default function InvoiceTab({ invoices, orders, measurements, customer, onSave, onDelete, onStatusChange, showToast }) {
  const [detailInvoice, setDetailInvoice] = useState(null)
  const [confirmDel, setConfirmDel]       = useState(null)

  // Listen for generate invoice event from OrdersTab
  useEffect(() => {
    const handler = (e) => {
      const { orderId } = e.detail
      const existing = invoices.find(inv => String(inv.orderId) === String(orderId))
      if (existing) {
        showToast('Invoice already exists for this order')
        setDetailInvoice(existing)
        return
      }
      const order = orders.find(o => String(o.id) === String(orderId))
      if (!order) return

      const invNumber = `INV-${String(invoices.length + 1).padStart(3, '0')}`
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const ids = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
      const linkedNames = ids.map(id => measurements.find(m => String(m.id) === String(id))?.name).filter(Boolean)

      const invoice = {
        id: Date.now() + Math.random(),
        orderId,
        number: invNumber,
        orderDesc: order.desc,
        price: order.price,
        qty: order.qty,
        linkedNames,
        due: order.due,
        notes: order.notes,
        status: 'unpaid',
        date: today,
      }
      onSave(invoice)
      showToast(`${invNumber} generated ✓`)
      setDetailInvoice(invoice)
    }

    document.addEventListener('generateInvoice', handler)
    return () => document.removeEventListener('generateInvoice', handler)
  }, [invoices, orders, measurements, onSave, showToast])

  const handleDeleteConfirm = () => {
    onDelete(confirmDel.id)
    showToast('Invoice deleted')
    setConfirmDel(null)
    setDetailInvoice(null)
  }

  const handleStatusChange = (id, status) => {
    onStatusChange(id, status)
    setDetailInvoice(prev => prev && String(prev.id) === String(id) ? { ...prev, status } : prev)
  }

  return (
    <>
      {invoices.length === 0 && (
        <div className={styles.emptyState}>
          <span style={{ fontSize: '2.8rem', opacity: 0.4 }}>🧾</span>
          <p>No invoices yet.</p>
          <span className={styles.hint}>Generate one from an order</span>
        </div>
      )}

      {invoices.map(inv => {
        const priceStr = inv.price !== null && inv.price !== undefined ? `₦${Number(inv.price * inv.qty).toLocaleString()}` : '—'
        const statusClass = inv.status === 'paid' ? styles.statusDone : styles.statusPending
        const statusLabel = inv.status === 'paid' ? 'Paid' : 'Unpaid'
        return (
          <div key={inv.id} className={styles.invoiceCard} onClick={() => setDetailInvoice(inv)}>
            <div className={styles.invoiceCardIcon}>🧾</div>
            <div className={styles.invoiceCardInfo}>
              <h4>{inv.orderDesc}</h4>
              <p>{inv.date} <span className={`${styles.statusBadge} ${statusClass}`} style={{ marginLeft: 4 }}>{statusLabel}</span></p>
            </div>
            <div className={styles.invoiceNumber}>{inv.number}</div>
          </div>
        )
      })}

      {detailInvoice && (
        <InvoiceDetail
          invoice={detailInvoice}
          customer={customer}
          onClose={() => setDetailInvoice(null)}
          onDelete={() => setConfirmDel(detailInvoice)}
          onStatusChange={handleStatusChange}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Invoice?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />
    </>
  )
}
