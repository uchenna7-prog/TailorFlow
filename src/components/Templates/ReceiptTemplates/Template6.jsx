import styles from "../styles/Template6.module.css"


export function ReceiptTemplate6({ receipt, customer, brand }) {
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t6Wrap}>
      <div className={styles.t6Header}>
        <div className={styles.t6LogoArea}>
          <div className={styles.t6LogoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 13, color: 'var(--brand-on-primary)' }}>checkroom</span>
            }
          </div>
          <div>
            <div className={styles.t6CompanyName}>{(brand.name || brand.ownerName || 'YOUR BRAND').toUpperCase()}</div>
            {brand.tagline && <div className={styles.t6CompanySub}>{brand.tagline.toUpperCase()}</div>}
          </div>
        </div>
        <div className={styles.t6HeaderRight}>
          {brand.address && <div>{brand.address}</div>}
        </div>
        <div className={styles.t6HeaderRight}>
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.website && <div>{brand.website}</div>}
        </div>
      </div>
      <div className={styles.t6InvoiceRow}>
        <div className={styles.t6InvoiceLeft}>
          <span className={styles.t6InvoiceWord}>RECEIPT </span>
          <span className={styles.t6InvoiceNum}>#{receipt.number}</span>
        </div>
        <div className={styles.t6InvoiceRight}>
          <div><span className={styles.t6Label}>DATE:</span> {receipt.date}</div>
        </div>
      </div>
      <div className={styles.t6InfoRow}>
        <div>
          <div className={styles.t6InfoLabel}>FROM:</div>
          {brand.name || brand.ownerName}<br />
          {brand.address}
        </div>
        <div>
          <div className={styles.t6InfoLabel}>RECEIVED FROM:</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t6TableHead}>
        <span style={{ flex: 0.5 }}>S/N</span>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>AMOUNT</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t6TableRow}>
          <span style={{ flex: 0.5 }}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t6TableRow}>
          <span style={{ flex: 0.5 }}>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t6TotalsArea}>
        <div className={styles.t6TotRow}><span>ORDER VALUE</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 4px', color: '#555' }}>Payment History</div>
          <div className={styles.t6TableHead}>
            <span style={{ flex: 0.5 }}>S/N</span>
            <span style={{ flex: 3 }}>PAYMENT DATE</span><span>AMOUNT</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t6TableRow}>
              <span style={{ flex: 0.5, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t6TotalsArea}>
            <div className={styles.t6TotRow}><span>TOTAL PAID</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t6TotRow} style={{ color: '#ef4444' }}><span>BALANCE</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.t6TotTotal}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : 'var(--brand-on-primary)' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t6TotalsArea}>
          {!isFullPayment && <div className={styles.t6TotRow} style={{ color: '#ef4444' }}><span>BALANCE</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={styles.t6TotTotal}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : 'var(--brand-on-primary)' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
      <div className={styles.t6ThankYou}>{brand.footer || 'THANK YOU FOR YOUR PAYMENT'}</div>
    </div>
  )
}
