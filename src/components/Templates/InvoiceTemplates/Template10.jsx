import styles from "../styles/Template10.module.css"
import { getDueDate,calcTax,fmt } from "../utils/invoiceUtils"

export function InvoiceTemplate10({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.dueDays)
  const accentColor = brand.colour || '#0057D7'
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
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
          <span className={styles.bannerTitle}>INVOICE</span>
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
          <div className={styles.metaLabel}>Invoice to:</div>
          <div className={styles.metaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaAddress}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaAddress}>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span className={styles.metaKey}>Invoice#</span> <strong>{invoice.number}</strong></div>
          <div><span className={styles.metaKey}>Date</span> <strong>{invoice.date}</strong></div>
          <div><span className={styles.metaKey}>Due</span> <strong>{dueDate}</strong></div>
        </div>
      </div>
      <div className={styles.tableHeader}>
        <span style={{flex: 1, textAlign:"left"}}>SN</span>
        <span style={{ flex: 3,textAlign:"left"}}>Item Description</span>
        <span style={{flex: 1, textAlign:"center"}}>Unit Price</span>
        <span style={{flex: 1, textAlign:"center"}}>Qty</span>
        <span style={{flex: 1, textAlign:"center"}}>Total</span>
      </div>
      {invoice.items?.map((item, i) => {
        const qty = item.qty ?? 1;
        const unitPrice = parseFloat(item.price) || 0;
        const lineAmount = qty * unitPrice;

        return (
          <div key={i} className={styles.tableRow}>
            <span style={{flex: 1, textAlign: "left" }}>{i + 1}</span>
            <span style={{ flex: 3, textAlign: "left" }}>{item.name}</span>
            <span style={{flex: 1, textAlign: "center" }}>
              {fmt(currency, unitPrice)}
            </span>
            <span style={{flex: 1, textAlign: "center" }}>{qty}</span>
            <span style={{flex: 1, textAlign: "center" }}>
              {fmt(currency, lineAmount)}
            </span>
          </div>
        );
      })}
      <div className={styles.divider} />
      <div className={styles.bottom}>
        <div style={{ flex: 1 }}>
          <div className={styles.thankYou}>{brand.footer || 'Thank you for your business'}</div>
          {brand.accountBank && (
            <>
              <div className={styles.paymentLabel}>Payment Info:</div>
              <div className={styles.paymentInfo}>
                {brand.accountNumber && <span>Account Number: {brand.accountNumber}<br /></span>}
                {brand.accountBank   && <span>Bank: {brand.accountBank}<br/></span>}
                {brand.accountName   && <span>Account Name: {brand.accountName}<br /></span>}
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
            <div className={styles.totalRow}><span>Sub Total:</span><span>{fmt(currency, subtotal)}</span></div>
            {showTax && taxRate > 0 && <div className={styles.totalRow}><span>Tax ({taxRate}%):</span><span>{fmt(currency, tax)}</span></div>}
            <div className={styles.totalDivider} />
            <div className={styles.totalTotal}><span>Total:</span><span>{fmt(currency, total)}</span></div>
          </div>
          <div className={styles.signBlock}>
            <div className={styles.signLine} />
            <div className={styles.SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>
      <svg
        style={{ position: 'absolute', bottom: 0, right: 0, width: 68, height: 58 }}
        viewBox="0 0 68 58"
      >
        <polygon points="68,0 68,58 0,58" fill={accentColor} />
      </svg>
    </div>
  )
}
