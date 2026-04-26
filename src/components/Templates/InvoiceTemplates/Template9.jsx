import styles from "../styles/Template9.module.css"
import { getDueDate,calcTax,fmt } from "../utils/invoiceUtils"


export function InvoiceTemplate9({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.template}>

      <div className={styles.header}>

        <div>
          <div className={styles.logoRow}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: "45px", height: "45px", objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 14, color: '#333' }}>checkroom</span>
            }
            <span className={styles.companyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</span>
          </div>
          {brand.tagline && <div className={styles.companySub}>{brand.tagline.toUpperCase()}</div>}
          {brand.address && <div className={styles.companyAddress}>{brand.address}</div>}
        </div>
        <div className={styles.invoiceTitle} style={{ color: accentColor }}>INVOICE</div>
      </div>
      <div className={styles.numberBar}>
        <span>INVOICE # {invoice.number}</span><span>|</span>
        <span>DATE: {invoice.date}</span><span>|</span>
        <span>DUE: {dueDate}</span>
      </div>
      <div className={styles.billShip}>
        <div>
          <span className={styles.billLabel}>Bill to:</span>
          <div><strong>{customer.name}</strong></div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div>
          <span className={styles.billLabel}>From:</span>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
        </div>
      </div>
      <div className={styles.tableHeader}>
       
        <span style={{ flex: 3,textAlign:"left"}}>DESCRIPTION</span>
        <span style={{ textAlign:"center"}}>QTY</span>
        <span style={{ textAlign:"center"}}>PRICE</span>
        <span style={{ textAlign:"center"}}>TOTAL</span>

      </div>
      {invoice.items?.map((item, i) => (
        <div key={i} className={styles.tableRow}>
          
          <span style={{ flex: 3,textAlign:"left"}}>{item.name}</span>
          <span style={{ textAlign:"center"}}>1</span>
          <span style={{ textAlign:"center"}}>{fmt(currency, item.price)}</span>
          <span style={{ textAlign:"right"}}>{fmt(currency, item.price)}</span>

        </div>
      ))}
      <div className={styles.subArea}>
        <div className={styles.subRow}>
          
          <span style={{fontWeight:900,color:"var(--brand-primary-dark)"}}>Subtotal:</span>
          <span>{fmt(currency, subtotal)}</span>

        </div>
        {showTax && taxRate > 0 && <div className={styles.subRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>}
      </div>
      <div className={styles.totalBar}>
        <span>TOTAL</span><span>{fmt(currency, total)}</span>
      </div>
      <div className={styles.footer}>
        <div>
          {brand.accountBank && (
            <>
              <div className={styles.thankYou}>PAYMENT INFORMATION</div>
                <div>

                  {brand.accountBank && (
                    <div>Bank Name: {brand.accountBank}</div>
                  )}

                  {brand.accountNumber && (
                    <div>Account Number: {brand.accountNumber}</div>
                  )}

                  {brand.accountName && (
                    <div>Account Name: {brand.accountName}</div>
                  )}
                  
                </div>

            </>
          )}

        <div className={styles.paymentNote} style={{fontWeight:900,color:"var(--brand-primary-dark)"}}>{brand.footer}</div>
        </div>
        <div className={styles.signArea}>

          <div className={styles.signLine} />
          <div className={styles.signLabel}>Signature</div>

        </div>
      </div>
      <div className={styles.cornerDecoration} />
    </div>
  )
}
