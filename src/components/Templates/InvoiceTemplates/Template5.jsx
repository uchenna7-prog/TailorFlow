import styles from "../styles/Template5.module.css"
import { getDueDate,calcTax,fmt } from "../utils/invoiceUtils"


export function InvoiceTemplate5({ invoice, customer, brand }) {

  const dueDate = getDueDate(invoice, brand.dueDays)
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (

    <div className={styles.template}>

      <div className={styles.top}>

        <div className={styles.title}>Invoice</div>

        <div className={styles.topRight}>
          <div>{invoice.date}</div>
          <div><strong>Invoice No: {invoice.number}</strong></div>
        </div>

      </div>

      <div className={styles.divider} />

      <div className={styles.billedTo}>

        <div className={styles.billedLabel}>Billed to:</div>
        <div><strong>{customer.name}</strong></div>
        {customer.phone   && <div>{customer.phone}</div>}
        {customer.address && <div>{customer.address}</div>}

      </div>

      <div className={styles.divider} />

      <div className={styles.tableHead}>

        <span style={{ flex: 3 }}>Item Description</span>
        <span>Unit Price</span>
        <span>Qty</span>
        <span>Total</span>

      </div>

      {invoice.items?.map((item, i) => {
        const qty = item.qty ?? 1;
        const unitPrice = parseFloat(item.price) || 0;
        const lineAmount = qty * unitPrice;

        return (
          <div key={i} className={styles.tableRow}>
            <span style={{ flex: 3 }}>{item.name}</span>
            <span>{fmt(currency, unitPrice)}</span>
            <span>{qty}</span>
            <span>{fmt(currency, lineAmount)}</span>
          </div>
        );
      })}

      <div className={styles.divider} />

      <div className={styles.totalsSection}>

        <div className={styles.totalRow}>

          <span>Subtotal</span>
          <span>{fmt(currency, subtotal)}</span>

        </div>

        {showTax && taxRate > 0 && 
        <div className={styles.totalRow}>

          <span>Tax ({taxRate}%)</span>
          <span>{fmt(currency, tax)}</span>

        </div>}

        <div className={`${styles.totalRow} ${styles.totalBold}`}>

          <span>Total</span>
          <span>{fmt(currency, total)}</span>

        </div>

      </div>

      <div className={styles.divider} />

      <div className={styles.footer}>
       
        {brand.accountBank ? (
          
          <div className={styles.footerItem}>
            
            <div className={styles.footerLabel}>Payment Information</div>
            <div>{brand.name || brand.ownerName}</div>
            {brand.accountBank   && <div>Bank Name: {brand.accountBank}</div>}
            {brand.accountNumber && <div>Account No: {brand.accountNumber}</div>}
            {brand.accountName   && <div>Name: {brand.accountName}</div>}

          </div>
        ) : <div />}
        <div className={styles.footerItem} style={{ textAlign: 'right' }}>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.address && <div>{brand.address}</div>}
        </div>
      </div>
    </div>
  )
}
