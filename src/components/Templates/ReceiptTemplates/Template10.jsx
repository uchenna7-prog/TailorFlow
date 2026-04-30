import styles from "../styles/Template10.module.css"
import { calcTax,fmt } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"

export function ReceiptTemplate10({ receipt, customer, brand }) {

  const accentColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
  const tax      = calcTax(subtotal, taxRate, showTax)
  const total    = subtotal + tax

  return (
    <div className={styles.template}>
      <div className={styles.headerZone}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 400 72"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 400,0 400,28 0,72" fill={accentColor} />
        </svg>
        <div style={{ position: 'absolute', top: 10, left: 18, zIndex: 1 }}>
          <span className={styles.bannerTitle}>RECEIPT</span>
        </div>
        <div className={styles.brandInBanner}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: "25px", height: "25px", objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 14,  color: "var(--brand-on-primary)" }}>checkroom</span>
          }
          <div>
            <div className={styles.brandName} style={{ color: "var(--brand-on-primary)" }} >{brand.name || brand.ownerName}</div>
            <div className={styles.brandSub}>TAILOR SHOP</div>
          </div>
        </div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>receipt To:</div>
          <div className={styles.metaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaAddress}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaAddress}>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span className={styles.metaKey}>receipt#</span> <strong>{receipt.number}</strong></div>
          <div><span className={styles.metaKey}>Date </span> <strong>{receipt.date}</strong></div>
        
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
        <div style={{ flex: 1 }}>
          <div className={styles.thankYou}>{brand.footer || 'Thank you for your business'}</div>
          {brand.accountBank && (
            <>
              <div className={styles.paymentLabel}>Payment Details:</div>
              <div className={styles.paymentInfo}>

                {brand.name && (
                  <div>Received By : {brand.name}</div>
                )}

              </div>
            </>
          )}
          {(brand.phone || brand.email) && (
            <>
              <div className={styles.label}>Contact</div>
              <div className={styles.text}>
                {brand.phone && <span>{brand.phone}<br /></span>}
                {brand.email && <span>{brand.email}</span>}
              </div>
            </>
          )}
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.totals}>
            <div className={styles.totalRow}><span>Sub Total :</span><span>{fmt(currency, subtotal)}</span></div>
            {showTax && taxRate > 0 && <div className={styles.totalRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
            <div className={styles.totalDivider} />
            <div className={styles.totalTotal}><span>Total :</span><span>{fmt(currency, total)}</span></div>
          </div>
          <div className={styles.signBlock}>
            <div className={styles.signLine} />
            <div className={styles.SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>
      {/* Corner accent — in normal flow so PDF capture always includes it */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <svg
          style={{ display: 'block', width: 68, height: 58 }}
          viewBox="0 0 68 58"
        >
          <polygon points="68,0 68,58 0,58" fill={accentColor} />
        </svg>
      </div>
      
    </div>
  )
}
