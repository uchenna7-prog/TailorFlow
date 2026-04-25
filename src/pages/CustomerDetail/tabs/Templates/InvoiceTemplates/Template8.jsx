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
    <div className={styles.Wrap}>
      <div className={styles.Header}>
        <div className={styles.LogoArea}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.BrandName}>{brand.name || brand.ownerName}</div>
            {brand.tagline && <div className={styles.BrandSub}>{brand.tagline.toUpperCase()}</div>}
          </div>
        </div>
        <div className={styles.InvoiceBox} style={{ background: accentColor }}>
          <div className={styles.InvoiceTitle}>INVOICE</div>
          <div className={styles.InvoiceMeta}>
            <span>Invoice#</span><span>{invoice.number}</span>
            <span>Date</span><span>{invoice.date}</span>
            <span>Due</span><span>{dueDate}</span>
          </div>
        </div>
      </div>
      <div className={styles.TableHead}>
        <span>SL.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.Divider} />
      <div className={styles.Bottom}>
        <div className={styles.GreenBox} style={{ background: accentColor }}>
          <div className={styles.GreenBoxTitle}>Invoice to:</div>
          <div className={styles.GreenBoxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.GreenBoxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.GreenBoxAddr}>{customer.address}</div>}
          <div className={styles.GreenDivider} />
          <div className={styles.GreenBoxTitle}>Terms &amp; Conditions</div>
          <div className={styles.GreenBoxAddr}>{brand.footer || 'All garments collected within 30 days of completion.'}</div>
        </div>
        {brand.accountBank && (
          <div className={styles.PaymentInfo}>
            <div className={styles.PayLabel}>Payment Info:</div>
            {brand.accountNumber && <div>Account #: {brand.accountNumber}</div>}
            {brand.accountName   && <div>A/C Name: {brand.accountName}</div>}
            {brand.accountBank   && <div>Bank: {brand.accountBank}</div>}
            {brand.phone         && <div className={styles.ThankYou}>{brand.phone}</div>}
          </div>
        )}
        <div className={styles.Totals}>
          <div className={styles.TotRow}><span>Sub Total:</span><span>{fmt(currency, subtotal)}</span></div>
          {showTax && taxRate > 0 && <div className={styles.TotRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
          <div className={styles.TotDivider} />
          <div className={styles.TotTotal}><span>Total:</span><span>{fmt(currency, total)}</span></div>
          <div className={styles.SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}
