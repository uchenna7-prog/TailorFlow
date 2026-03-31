import styles from './InvoiceView.module.css'

function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const STATUS_LABELS = { unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue' }
const STATUS_NEXT   = { unpaid: 'paid', paid: 'unpaid', overdue: 'paid' }

export default function InvoiceView({
  invoice,
  customer,
  onClose,
  onStatusChange,
  onDelete
}) {
  if (!invoice) return null

  const currency = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
      return s.invoiceCurrency || '₦'
    } catch { return '₦' }
  })()

  const total = (parseFloat(invoice.price) || 0) * (parseFloat(invoice.qty) || 1)

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>

        {/* HEADER */}
        <div className={styles.header}>
          <button className={styles.iconBtn} onClick={onClose}>
            <span className="mi">arrow_back</span>
          </button>
          <div className={styles.title}>Invoice</div>
          <div style={{ width: 32 }} />
        </div>

        {/* BODY */}
        <div className={styles.body}>

          <div className={styles.card}>

            <div className={styles.topRow}>
              <div className={styles.invoiceNum}>{invoice.number}</div>
              <div className={`${styles.status} ${styles[`status_${invoice.status}`]}`}>
                {STATUS_LABELS[invoice.status]}
              </div>
            </div>

            <div className={styles.customerName}>
              {customer?.name || 'Customer'}
            </div>

            <div className={styles.desc}>
              {invoice.orderDesc || 'Order'}
            </div>

            <div className={styles.metaRow}>
              <span>{invoice.date}</span>
              <span>x{invoice.qty || 1}</span>
            </div>

            <div className={styles.total}>
              {fmt(currency, total)}
            </div>

          </div>

          {/* ACTIONS */}
          <div className={styles.actions}>

            <button
              className={styles.primaryBtn}
              onClick={() =>
                onStatusChange(invoice.id, STATUS_NEXT[invoice.status])
              }
            >
              <span className="mi">
                {invoice.status === 'paid' ? 'undo' : 'check_circle'}
              </span>
              {invoice.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
            </button>

            <button
              className={styles.dangerBtn}
              onClick={() => onDelete(invoice.id)}
            >
              <span className="mi">delete</span>
              Delete Invoice
            </button>

          </div>

        </div>
      </div>
    </div>
  )
}