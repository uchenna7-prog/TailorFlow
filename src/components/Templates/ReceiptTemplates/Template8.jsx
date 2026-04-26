import styles from "../styles/Template8.module.css"


export function ReceiptTemplate8({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#00c896'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t8Wrap}>
      <div className={styles.t8Header}>
        <div className={styles.t8LogoArea}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.t8BrandName}>{brand.name || brand.ownerName}</div>
            {brand.tagline && <div className={styles.t8BrandSub}>{brand.tagline.toUpperCase()}</div>}
          </div>
        </div>
        <div className={styles.t8InvoiceBox} style={{ background: accentColor }}>
          <div className={styles.t8InvoiceTitle}>RECEIPT</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Receipt#</span><span>{receipt.number}</span>
            <span>Date</span><span>{receipt.date}</span>
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t8TableHead}>
        <span>S/N</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t8TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t8TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t8Divider} />
      {paymentRows.length > 0 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Payment History</div>
          <div className={styles.t8TableHead} style={{ background: '#e8f5f0' }}>
            <span>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t8TableRow}>
              <span style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t8Divider} />
        </>
      )}
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox} style={{ background: accentColor }}>
          <div className={styles.t8GreenBoxTitle}>Received from:</div>
          <div className={styles.t8GreenBoxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t8GreenBoxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t8GreenBoxAddr}>{customer.address}</div>}
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Note</div>
          <div className={styles.t8GreenBoxAddr}>{brand.footer || 'Thank you for your payment.'}</div>
        </div>
        <div style={{ flex: 1, fontSize: 7, lineHeight: 1.6 }} />
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Order Value:</span><span>{fmt(currency, orderTotal)}</span></div>
          <div className={styles.t8TotRow}><span>Total Paid:</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
          {!isFullPayment && <div className={styles.t8TotRow} style={{ color: '#ef4444' }}><span>Balance:</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}>
            <span>{isFullPayment ? 'Paid:' : 'Received:'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}
