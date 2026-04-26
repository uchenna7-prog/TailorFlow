import styles from "../styles/Template11.module.css"


export function ReceiptTemplate11({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#5da0d0'
  const barBg       = '#dbeeff'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t11Wrap}>
      <div className={styles.t11TopBar}>
        <div className={styles.t11LogoArea}>
          <div className={styles.t11LogoHex}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 2 }} />
              : <span className="mi" style={{ fontSize: 11, color: '#fff' }}>checkroom</span>
            }
          </div>
          <div>
            <div className={styles.t11CompanyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</div>
            {brand.tagline && <div className={styles.t11CompanySub}>{brand.tagline}</div>}
          </div>
        </div>
        {brand.address && <div className={styles.t11CompanyInfo}>{brand.address}</div>}
        <div className={styles.t11CompanyInfo} style={{ textAlign: 'right' }}>
          {brand.website && <div>{brand.website}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.phone   && <div>{brand.phone}</div>}
        </div>
      </div>
      <div className={styles.t11InvoiceTitle}>Receipt</div>
      <div className={styles.t11BlueBar} style={{ background: barBg, color: accentColor }}>
        <span>RECEIPT: #{receipt.number}</span>
        <span>DATE: {receipt.date}</span>
        <span>AMOUNT: {fmt(currency, thisPaymentTotal)}</span>
      </div>
      <div className={styles.t11IssuedRow}>
        <div>
          <div className={styles.t11IssuedLabel}>RECEIVED FROM</div>
          <div>{customer.name}</div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.t11AmountLabel} style={{ color: accentColor }}>AMOUNT PAID</div>
          <div className={styles.t11AmountVal} style={{ color: accentColor }}>{fmt(currency, thisPaymentTotal)}</div>
        </div>
      </div>
      {receipt.orderDesc && <div className={styles.t11ProjectName}>{receipt.orderDesc}</div>}
      <div className={styles.t11PayTitle}>Order Details</div>
      <div className={styles.t11TableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>S/N</span><span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t11TableRow}>
          <span style={{ flex: 3 }}>• {item.name}</span>
          <span>{i + 1}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t11TableRow}>
          <span style={{ flex: 3 }}>• {receipt.orderDesc || 'Garment Order'}</span>
          <span>1</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t11TotArea}>
        <div className={styles.t11TotRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.t11PayTitle}>Payment History</div>
          <div className={styles.t11TableHead} style={{ background: barBg, color: accentColor }}>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>S/N</span><span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t11TableRow}>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t11TotArea}>
            <div className={styles.t11TotRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t11TotRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.t11TotBold}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : accentColor }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t11TotArea}>
          {!isFullPayment && <div className={styles.t11TotRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={styles.t11TotBold}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'RECEIVED'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : accentColor }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
      <div className={styles.t11ThankYou} style={{ color: accentColor }}>{brand.footer || 'THANK YOU!'}</div>
    </div>
  )
}
