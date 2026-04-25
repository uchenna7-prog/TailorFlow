import styles from "../styles/Template11.module.css"
import { getDueDate,calcTax,fmt } from "../../../utils/invoiceUtils"

export function InvoiceTemplate11({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#0057D7'
  const barBg       = '#dbeeff'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.template}>

      <div className={styles.topBar}>

        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: "45px", height: "45px", objectFit: 'contain', borderRadius: 2 }} />
              : <span className="mi" style={{ fontSize: 11, color: '#fff' }}>checkroom</span>
            }
          </div>

          <div>
            <div className={styles.companyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</div>
            {brand.tagline && <div className={styles.companySub}>{brand.tagline}</div>}
          </div>

        </div>

        {brand.address && <div className={styles.companyInfo}>{brand.address}</div>}

        <div className={styles.companyInfo} style={{ textAlign: 'right' }}>
          {brand.website && <div>{brand.website}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.phone   && <div>{brand.phone}</div>}
        </div>

      </div>

      <div className={styles.invoiceTitle}>Invoice</div>

      <div className={styles.bar} style={{ background: "var(--brand-muted)", color: accentColor }}>
        <span>INVOICE: #{invoice.number}</span>
        <span>DATE ISSUED: {invoice.date}</span>
        <span>DUE DATE: {dueDate}</span>
      </div>

      <div className={styles.issuedRow}>

        <div>
          <div className={styles.issuedLabel}>ISSUED TO</div>
          <div>{customer.name}</div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className={styles.amountLabel} style={{ color: accentColor }}>AMOUNT</div>
          <div className={styles.amountVal} style={{ color: accentColor }}>{fmt(currency, total)}</div>
        </div>

      </div>
      {invoice.orderDesc && <div className={styles.projectName}>{invoice.orderDesc}</div>}
      <div className={styles.tableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>Qty</span><span>Price</span><span>Subtotal</span>
      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.tableRow}>
          <span style={{ flex: 3 }}>• {item.name}</span>
          <span>1</span>
          <span>{fmt(currency, item.price)}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      <div className={styles.totalArea}>
        <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && (
          <div className={styles.totalRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
        )}
        <div className={styles.totalRow}><span>TOTAL</span><span>{fmt(currency, total)}</span></div>
      </div>
      {(brand.accountBank || brand.phone) && (
        <>
          <div className={styles.paymentTitle}>Payment Information</div>
          <div className={styles.paymentBoxRow}>
            {brand.accountBank && (
              <div className={styles.paymentBox} style={{background: "var(--brand-muted)"}}>
                <div className={styles.paymentBoxTitle}>Bank Transfer</div>
                <div>
                  {brand.accountBank}<br />
                  {brand.accountName && <span>{brand.accountName}<br /></span>}
                  {brand.accountNumber && <span>Acct: {brand.accountNumber}</span>}
                </div>
              </div>
            )}
            {brand.phone && (
              <div className={styles.paymentBox} style={{background: "var(--brand-muted)"}}>
                <div className={styles.paymentBoxTitle}>Contact</div>
                <div>
                  {brand.phone}<br />
                  {brand.email && <span>{brand.email}</span>}
                </div>
              </div>
            )}
            {brand.address && (
              <div className={styles.paymentBox} style={{ background: "var(--brand-muted)"}}>
                <div className={styles.paymentBoxTitle}>Visit Us</div>
                <div>{brand.address}</div>
              </div>
            )}
          </div>
        </>
      )}
      <div className={styles.thankYou} style={{ color: accentColor }}>{brand.footer || 'THANK YOU!'}</div>
    </div>
  )
}
