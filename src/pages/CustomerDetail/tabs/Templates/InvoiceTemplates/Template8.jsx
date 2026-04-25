import styles from "../styles/Template8.module.css"
import { getDueDate,calcTax,fmt } from "../../../utils/invoiceUtils"


export function InvoiceTemplate8({ invoice, customer, brand }) {
  const dueDate    = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#00c896'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.t8Wrap}>
      <div className={styles.t8Header}>
        <div className={styles.t8LogoArea}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.t8BrandName}>{brand.name || brand.ownerName}</div>
            {brand.tagline && <div className={styles.t8BrandSub}>{brand.tagline.toUpperCase()}</div>}
          </div>
        </div>
        <div className={styles.t8InvoiceBox} style={{ background: accentColor }}>
          <div className={styles.t8InvoiceTitle}>INVOICE</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Invoice#</span><span>{invoice.number}</span>
            <span>Date</span><span>{invoice.date}</span>
            <span>Due</span><span>{dueDate}</span>
          </div>
        </div>
      </div>
      <div className={styles.t8TableHead}>
        <span>SL.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.t8TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.t8Divider} />
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox} style={{ background: accentColor }}>
          <div className={styles.t8GreenBoxTitle}>Invoice to:</div>
          <div className={styles.t8GreenBoxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t8GreenBoxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t8GreenBoxAddr}>{customer.address}</div>}
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Terms &amp; Conditions</div>
          <div className={styles.t8GreenBoxAddr}>{brand.footer || 'All garments collected within 30 days of completion.'}</div>
        </div>
        {brand.accountBank && (
          <div className={styles.t8PaymentInfo}>
            <div className={styles.t8PayLabel}>Payment Info:</div>
            {brand.accountNumber && <div>Account #: {brand.accountNumber}</div>}
            {brand.accountName   && <div>A/C Name: {brand.accountName}</div>}
            {brand.accountBank   && <div>Bank: {brand.accountBank}</div>}
            {brand.phone         && <div className={styles.t8ThankYou}>{brand.phone}</div>}
          </div>
        )}
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Sub Total:</span><span>{fmt(currency, subtotal)}</span></div>
          {showTax && taxRate > 0 && <div className={styles.t8TotRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}><span>Total:</span><span>{fmt(currency, total)}</span></div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}
