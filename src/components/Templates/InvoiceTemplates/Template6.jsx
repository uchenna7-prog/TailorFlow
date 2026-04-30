import styles from "../styles/Template6.module.css"
import { getDueDate,calcTax,fmt } from "../utils/invoiceUtils"

export function InvoiceTemplate6({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.dueDays)
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: "45px", height: "45px", objectFit: 'contain' }} />
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
          <div><span className={styles.label}>ISSUE DATE:</span> {invoice.date}</div>
          <div><span className={styles.label}>DUE DATE:</span> {dueDate}</div>
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
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.address}
        </div>
        <div>
          <div className={`${styles.infoLabel} ${styles.infoLabelRight}`}>BILL TO:</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.colDesc}>ITEM DESCRIPTION</th>
              <th className={styles.colPrice}>UNIT PRICE</th>
              <th className={styles.colQty}>QTY</th>
              <th className={styles.colTotal}>TOTAL</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {invoice.items?.map((item, i) => {
              const qty = item.qty ?? 1;
              const unitPrice = parseFloat(item.price) || 0;
              const lineAmount = qty * unitPrice;

              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colDesc}>{item.name}</td>
                  <td className={styles.colPrice}>{fmt(currency, unitPrice)}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colTotal}>{fmt(currency, lineAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className={styles.totalsArea}>
        <div className={styles.totalRow}><span>SUBTOTAL</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && <div className={styles.totalRow}><span>TAX ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
        <div className={styles.total}><span>TOTAL</span><span>{fmt(currency, total)}</span></div>
      </div>
      <div className={styles.thankYou}>{brand.footer || 'THANK YOU FOR YOUR BUSINESS'}</div>
    </div>
  )
}
