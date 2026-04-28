import styles from "../styles/Template4.module.css"
import { getDueDate,calcTax,fmt } from "../utils/invoiceUtils"


export function InvoiceTemplate4({ invoice, customer, brand }) {

  const dueDate  = getDueDate(invoice, brand.dueDays)
  const barColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
  const tax = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (

    <div className={styles.template}>
      
      <div className={styles.bar}/>

        <div className={styles.body}>

          <div className={styles.headerSplit}>
              
            <div className={styles.title}>INVOICE</div>

            <div style={{ textAlign: 'right', fontSize: 9 }}>
              <div>ISSUE DATE: <strong>{invoice.date}</strong></div>
              <div>DUE DATE: <strong>{dueDate}</strong></div>
              <div>INVOICE #: <strong>{invoice.number}</strong></div>
            </div>

          </div>
          <div className={styles.metaRow}>

            <div  className={styles.metaItem} >

              <div className={styles.metaLabel}>BILL FROM:</div>
              <div className={styles.metaVal}>{brand.name}</div>
              {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
              {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
             

            </div>

            <div className={styles.metaItem}  style={{ textAlign: 'right' }}>

              <div className={styles.metaLabel}>BILL TO:</div>
              <div className={styles.metaVal}>{customer.name}</div>
              {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
              {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

            </div>

          </div>

        <div className={styles.table}>

          <div className={styles.tableHeader} style={{ borderColor: barColor }}>

            <span style={{ flex: 3 }}>Item Description</span>
            <span>Unit Price</span>
            <span>QTY</span>
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

          <div className={styles.totalsArea}>

            <div className={styles.totalRow}>

              <span>Subtotal</span>
              <span>{fmt(currency, subtotal)}</span>

            </div>
            {showTax && taxRate > 0 && 
            <div className={styles.totalRow}>

              <span>Tax ({taxRate}%)</span>
              <span>{fmt(currency, tax)}</span>

            </div>}

            <div className={styles.totalDivider} style={{ background: barColor }}></div>
            <div className={styles.totalBold}>
              <span>Total Due</span>
              <span>{fmt(currency, total)}</span>
            </div>

          </div>
        </div>

        {brand.accountBank && (
          
          <div className={styles.footer}>
            <div className={styles.footerSection}>
              <strong style={{fontWeight:900,color:"var(--brand-primary-dark)"}}>Payment Information:</strong><br />

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
