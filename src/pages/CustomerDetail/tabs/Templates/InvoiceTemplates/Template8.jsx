import styles from "../styles/Template8.module.css"
import { getDueDate,calcTax,fmt } from "../../../utils/invoiceUtils"


export function InvoiceTemplate8({ invoice, customer, brand }) {
  const dueDate    = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.logoArea}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: "45px", height: "45px", objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.brandName}>{brand.name || brand.ownerName}</div>
            {brand.tagline && <div className={styles.brandSub}>{brand.tagline.toUpperCase()}</div>}
          </div>

        </div>

        <div className={styles.invoiceBox} style={{ background: accentColor }}>

          <div className={styles.invoiceTitle}>INVOICE</div>
          <div className={styles.invoiceMeta}>

            <div>
              <span>Invoice No:</span><span>#{invoice.number}</span>
            </div>
            <div>
              <span>Issue Date:</span><span>{invoice.date}</span>
            </div>
            <div>
               <span>Due Date:</span><span>{dueDate}</span>
            </div>

          </div>
        </div>
      </div>

      <div className={styles.tableHeader}>

        <span>SN</span>
        <span style={{ flex: 3,textAlign:"left" }}>Description</span>
        <span style={{ textAlign:"center" }}>Price</span>
        <span style={{ textAlign:"center" }}>Qty</span>
        <span style={{ textAlign:"center" }}>Total</span>

      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.tableRow}>

          <span>{i + 1}</span>
          <span style={{ flex: 3,textAlign:"left"  }}>{item.name}</span>
          <span style={{ textAlign:"center" }}>{fmt(currency, item.price)}</span>
          <span style={{ textAlign:"center" }}>1</span>
          <span style={{ textAlign:"center" }}>{fmt(currency, item.price)}</span>

        </div>
      ))}
      <div className={styles.divider} />

      <div className={styles.bottom}>

        <div className={styles.box} style={{ background: accentColor }}>

          <div className={styles.boxTitle}>Invoice to:</div>
          <div className={styles.boxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.boxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.boxAddr}>{customer.address}</div>}

        </div>
        {brand.accountBank && (
          <div className={styles.paymentInfo}>
            <div className={styles.paymentLabel}>Payment Info:</div>
            {brand.accountNumber && <div>Account Number: {brand.accountNumber}</div>}
            {brand.accountBank   && <div>Bank: {brand.accountBank}</div>}
            {brand.accountName   && <div>Account Name: {brand.accountName}</div>}
            {brand.phone         && <div className={styles.thankYou}>{brand.footer}</div>}
          </div>
        )}
        <div className={styles.totals}>
          <div className={styles.totalRow}><span>Sub Total:</span><span>{fmt(currency, subtotal)}</span></div>
          {showTax && taxRate > 0 && <div className={styles.totalRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
          <div className={styles.totalDivider} />
          <div className={styles.total}><span>Total:</span><span>{fmt(currency, total)}</span></div>
          <div className={styles.signLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}
