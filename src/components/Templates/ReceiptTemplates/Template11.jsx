import styles from "../styles/Template11.module.css"
import { calcTax,fmt } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"

export function ReceiptTemplate11({ receipt, customer, brand }) {
 
  const accentColor = brand.colour || '#0057D7'
  const barBg       = '#dbeeff'
  const { currency, showTax, taxRate } = brand
  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
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

      <div className={styles.receiptTitle}>receipt</div>

      <div className={styles.bar} style={{ background: "var(--brand-muted)", color: accentColor }}>
        <span>RECEIPT # {receipt.number}</span>
        <span>DATE ISSUED: {receipt.date}</span>

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

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.colDesc}>Item Description</th>
              <th className={styles.colQty}>Qty</th>
              <th className={styles.colPrice}>Unit Price</th>
              <th className={styles.colTotal}>Amount</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {receipt.items?.map((item, i) => {
              const qty = item.qty ?? 1;
              const unitPrice = parseFloat(item.price) || 0;
              const lineAmount = qty * unitPrice;

              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colDesc}>• {item.name}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colPrice}>{fmt(currency, unitPrice)}</td>
                  <td className={styles.colTotal}>{fmt(currency, lineAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <ReceiptPaymentSummary receipt={receipt} brand={brand} />
        
      </div>
      
      {(brand.accountBank || brand.phone) && (
        <>
          <div className={styles.paymentTitle}>Payment Details</div>
          <div className={styles.paymentBoxRow}>
            {brand.accountBank && (
              <div className={styles.paymentBox} style={{background: "var(--brand-muted)"}}>
                <div className={styles.paymentBoxTitle}>Bank Transfer</div>
                <div>

                  {brand.name && (
                  <div>Received By : {brand.name}</div>
                )}

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
