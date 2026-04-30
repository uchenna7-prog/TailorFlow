import styles from "../styles/Template9.module.css"
import { calcTax, fmt } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"

export function ReceiptTemplate9({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0
  const tax   = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

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
          {brand.tagline  && <div className={styles.companySub}>{brand.tagline.toUpperCase()}</div>}
          {brand.address  && <div className={styles.companyAddress}>{brand.address}</div>}
        </div>
        <div className={styles.receiptTitle} style={{ color: accentColor }}>RECEIPT</div>
      </div>

      <div className={styles.numberBar}>
        <span>RECEIPT # {receipt.number}</span><span>|</span>
        <span>DATE: {receipt.date}</span><span>|</span>
      </div>

      <div className={styles.billShip}>
        <div>
          <span className={styles.billLabel}>Received From:</span>
          <div><strong>{customer.name}</strong></div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.email   && <div>{customer.email}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div>
          <span className={styles.billLabel}>Received By:</span>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.address && <div>{brand.address}</div>}
        </div>
      </div>
      
       <div className={styles.tableWrapper}>
              
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.colDesc}>ITEM DESCRIPTION</th>
              <th className={styles.colQty}>QTY</th>
              <th className={styles.colPrice}>UNIT PRICE</th>
              <th className={styles.colTotal}>TOTAL</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {receipt.items?.map((item, i) => {
              const qty = item.qty ?? 1;
              const unitPrice = parseFloat(item.price) || 0;
              const lineAmount = qty * unitPrice;
  
              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colDesc}>{item.name}</td>
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
      

      {/* Footer + corner pushed to bottom together */}
      <div style={{ marginTop: 'auto' }}>
        <div className={styles.footer}>
          <div>
            {brand.accountBank && (
              <>
                <div className={styles.thankYou}>Payment Details</div>
                {brand.name && <div>Received By : {brand.name}</div>}
              </>
            )}
            <div
              className={styles.paymentNote}
              style={{ fontWeight: 900, color: "var(--brand-primary-dark)" }}
            >
              {brand.footer}
            </div>
          </div>
          <div className={styles.signArea}>
            <div className={styles.signLine} />
            <div className={styles.signLabel}>Signature</div>
          </div>
        </div>

        {/* SVG corner — replaces clip-path div which html2canvas can't render */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <svg
            style={{ display: 'block', width: 50, height: 50 }}
            viewBox="0 0 50 50"
          >
            <polygon points="50,0 50,50 0,50" fill={accentColor} opacity="0.5" />
          </svg>
        </div>
      </div>

    </div>
  )
}