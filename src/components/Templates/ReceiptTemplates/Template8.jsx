import styles from "../styles/Template8.module.css"
import { calcTax,fmt } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"

export function ReceiptTemplate8({ receipt, customer, brand }) {

  const accentColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
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

        <div className={styles.receiptBox} style={{ background: accentColor }}>

          <div className={styles.receiptTitle}>receipt</div>
          <div className={styles.receiptMeta}>

            <div>
              <span>receipt No:</span><span>#{receipt.number}</span>
            </div>
            <div>
              <span>Issue Date:</span><span>{receipt.date}</span>
            </div>


          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.colSn}>SN</th>
              <th className={styles.colDesc}>Item Description</th>
              <th className={styles.colPrice}>Unit Price</th>
              <th className={styles.colQty}>Qty</th>
              <th className={styles.colTotal}>Total</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {receipt.items?.map((item, i) => {
              const qty = item.qty ?? 1;
              const unitPrice = parseFloat(item.price) || 0;
              const lineAmount = qty * unitPrice;
  
              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colSn}>{i + 1}</td>
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
      <div className={styles.divider} />

      <div className={styles.bottom}>

        <div className={styles.box} style={{ background: accentColor }}>

          <div className={styles.boxTitle}>receipt to:</div>
          <div className={styles.boxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.boxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.boxAddr}>{customer.address}</div>}

        </div>
        {brand.accountBank && (
          <div className={styles.paymentInfomation}>
            <div className={styles.paymentLabel}>Payment Details:</div>
            {brand.name && (
              <div>Received By : {brand.name}</div>
            )}
            {brand.footer && <div className={styles.thankYou}>{brand.footer}</div>}
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
