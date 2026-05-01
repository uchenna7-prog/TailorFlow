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

            <div style={{ textAlign : 'right', fontSize : 9 }}>
              <div>ISSUE DATE : <strong>{invoice.date}</strong></div>
              <div>DUE DATE : <strong>{dueDate}</strong></div>
              <div>INVOICE # : <strong>{invoice.number}</strong></div>
            </div>

          </div>
          <div className={styles.metaRow}>

            <div  className={styles.metaItem} >

              <div className={styles.metaLabel}>BILL FROM</div>
              <div className={styles.metaVal}>{brand.name}</div>
              {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
              {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
             

            </div>

            <div className={styles.metaItem}  style={{ textAlign : 'right' }}>

              <div className={styles.metaLabel}>BILL TO</div>
              <div className={styles.metaVal}>{customer.name}</div>
              {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
              {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

            </div>

          </div>



        <div>


          <div className={styles.table}>

            <div className={styles.orderDescriptionRow}>
              <div className={styles.orderText}>ORDER:</div>
              <div className={styles.orderDescLabel}>{invoice.orderDesc || 'Garment Order'}</div>
      
            </div>
            
            <table
              className={styles.tableEl}
              style={{ borderColor : barColor }}
            >
              <thead>
                <tr className={styles.tableHeader} style={{ borderColor : barColor }}>
                  <th className={styles.colDesc}>Item Description</th>
                  <th className={styles.colPrice}>Unit Price</th>
                  <th className={styles.colQty}>Qty</th>
                  <th className={styles.colTotal}>Total</th>
                </tr>
              </thead>
              <tbody>
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

            <div className={styles.totalRow}>

              <span>Subtotal</span>
              <span>{fmt(currency, subtotal)}</span>

            </div>
            {showTax && taxRate > 0 && 
            <div className={styles.totalRow}>

              <span>Tax ({taxRate}%)</span>
              <span>{fmt(currency, tax)}</span>

            </div>}

            <div className={styles.totalDivider} style={{ background : barColor }}></div>
            <div className={styles.totalBold}>
              <span>Total Due</span>
              <span>{fmt(currency, total)}</span>
            </div>

          </div>
        </div>

        {brand.accountBank && (
          
          <div className={styles.footer}>
            <div className={styles.footerSection}>
              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information :</strong><br />

              <div>

                {brand.accountBank && (
                  <div>Bank Name : {brand.accountBank}</div>
                )}

                {brand.accountNumber && (
                  <div>Account Number : {brand.accountNumber}</div>
                )}

                {brand.accountName && (
                  <div>Account Name : {brand.accountName}</div>
                )}
                
              </div>
              
            </div>
            {brand.footer && (
              <div className={styles.footerSection}>
                <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Notes :</strong><br />{brand.footer}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  )
}
