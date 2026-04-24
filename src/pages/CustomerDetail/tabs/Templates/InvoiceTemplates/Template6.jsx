import styles from "../styles/Template6.module.css"
import { getDueDate,calcTax,fmt } from "../../../utils/invoiceUtils"

export function InvoiceTemplate6({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 45, height: 45, objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 13, color: 'var(--brand-on-primary)' }}>checkroom</span>
            }
          </div>

          <div>
            <div className={styles.companyName}>{(brand.name || brand.ownerName || 'YOUR BRAND').toUpperCase()}</div>
            {brand.tagline && <div className={styles.companySub}>{brand.tagline}</div>}
          </div>

        </div>
        
        <div className={styles.headerRight}>
          {brand.address && <div>{brand.address}</div>}
        </div>

        <div className={styles.headerRight}>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
          {brand.website && <div>{brand.website}</div>}
        </div>

      </div>

      <div className={styles.invoiceRow}>
        <div className={styles.invoiceLeft}>
          <span className={styles.invoiceWord}>INVOICE </span>
          <span className={styles.invoiceNum}>#{invoice.number}</span>
        </div>
        <div className={styles.invoiceRight}>
          <div><span className={styles.label}>DATE:</span> {invoice.date}</div>
          <div><span className={styles.label}>DUE:</span> {dueDate}</div>
        </div>
      </div>
      <div className={styles.infoRow}>
        {brand.accountBank && (
          <div>
            <div className={styles.infoLabel}>PAYMENT:</div>
            <strong>{brand.accountBank}</strong><br />
            {brand.accountName && <span>{brand.accountName}<br /></span>}
            {brand.accountNumber && <span>Acct: {brand.accountNumber}</span>}
          </div>
        )}
        <div>
          <div className={styles.infoLabel}>BILL FROM:</div>
          {brand.name || brand.ownerName}<br />
          {brand.address}
        </div>
        <div>
          <div className={`${styles.infoLabel} ${styles.infoLabelRight}`}>BILL TO:</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>
      <div className={styles.tableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>PRICE</span><span>QTY</span><span>TOTAL</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.tableRow}>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.totalsArea}>
        <div className={styles.totalRow}><span>SUBTOTAL</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && <div className={styles.totalRow}><span>TAX ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
        <div className={styles.total}><span>TOTAL</span><span>{fmt(currency, total)}</span></div>
      </div>
      <div className={styles.thankYou}>{brand.footer || 'THANK YOU FOR YOUR BUSINESS'}</div>
    </div>
  )
}
