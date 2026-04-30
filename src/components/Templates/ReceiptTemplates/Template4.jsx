import styles from "../styles/Template4.module.css"
import { calcTax,fmt } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"

export function ReceiptTemplate4({ receipt, customer, brand }) {

  const barColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
  const tax = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (

    <div className={styles.template}>
      
      <div className={styles.bar}/>

        <div className={styles.body}>

          <div className={styles.headerSplit}>
              
            <div className={styles.title}>receipt</div>

            <div style={{ textAlign: 'right', fontSize: 9 }}>
              <div>ISSUE DATE: <strong>{receipt.date}</strong></div>
              <div>receipt #: <strong>{receipt.number}</strong></div>
            </div>

          </div>
          <div className={styles.metaRow}>

            <div  className={styles.metaItem} >

              <div className={styles.metaLabel}>RECEIVED BY:</div>
              <div className={styles.metaVal}>{brand.name}</div>
              {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
              {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
             

            </div>

            <div className={styles.metaItem}  style={{ textAlign: 'right' }}>

              <div className={styles.metaLabel}>RECEIVED FROM:</div>
              <div className={styles.metaVal}>{customer.name}</div>
              {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
              {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

            </div>

          </div>


          <div className={styles.table}>
            <table
              className={styles.tableEl}
              style={{ borderColor: barColor }}
            >
              <thead>
                <tr className={styles.tableHeader} style={{ borderColor: barColor }}>
                  <th className={styles.colDesc}>Item Description</th>
                  <th className={styles.colPrice}>Unit Price</th>
                  <th className={styles.colQty}>Qty</th>
                  <th className={styles.colTotal}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items?.map((item, i) => {
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

            <ReceiptPaymentSummary receipt={receipt} brand={brand} />

          </div>
        

        {brand.accountBank && (
          
          <div className={styles.footer}>
            <div className={styles.footerSection}>
              <strong style={{fontWeight:900,color:"var(--brand-primary-dark)"}}>Payment Details:</strong><br />

              <div>

                {brand.name && (
                    <div>Received By : {brand.name}</div>
                  )}
                
              </div>
              
            </div>
            {brand.footer && (
              <div className={styles.footerSection}>
                <strong style={{fontWeight:900,color:"var(--brand-primary-dark)"}}>Notes:</strong><br />{brand.footer}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  )
}
