import styles from "../styles/Template9.module.css"


export function ReceiptTemplate9({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#00b4c8'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t9Wrap}>
      <div className={styles.t9Header}>
        <div>
          <div className={styles.t9LogoRow}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
              : <span className="mi" style={{ fontSize: 14, color: '#333' }}>checkroom</span>
            }
            <span className={styles.t9CompanyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</span>
          </div>
          {brand.tagline && <div className={styles.t9CompanySub}>{brand.tagline.toUpperCase()}</div>}
          {brand.address && <div className={styles.t9CompanyAddr}>{brand.address}</div>}
        </div>
        <div className={styles.t9InvoiceTitle} style={{ color: accentColor }}>RECEIPT</div>
      </div>
      <div className={styles.t9NumBar}>
        <span>RECEIPT # {receipt.number}</span><span>|</span>
        <span>DATE: {receipt.date}</span>
      </div>
      <div className={styles.t9BillShip}>
        <div>
          <span className={styles.t9BillLabel}>Received from:</span>
          <div><strong>{customer.name}</strong></div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div>
          <span className={styles.t9BillLabel}>From:</span>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t9TableHead}>
        <span>S/N</span>
        <span style={{ flex: 3 }}>DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t9TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t9TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t9SubArea}>
        <div className={styles.t9SubRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Payment History</div>
          <div className={styles.t9TableHead}>
            <span>S/N</span>
            <span style={{ flex: 3 }}>PAYMENT DATE</span>
            <span>AMOUNT</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t9TableRow}>
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
          <div className={styles.t9SubArea}>
            <div className={styles.t9SubRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t9SubRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t9SubArea}>
          {!isFullPayment && <div className={styles.t9SubRow} style={{ color: '#ef4444' }}><span>Balance</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
        </div>
      )}
      <div className={styles.t9TotalBar}>
        <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
        <span>{fmt(currency, thisPaymentTotal)}</span>
      </div>
      <div className={styles.t9Footer}>
        <div>
          {!brand.accountBank && <div className={styles.t9ThankYou}>THANK YOU FOR YOUR PAYMENT</div>}
          {brand.footer && <div className={styles.t9PayNote}>{brand.footer}</div>}
        </div>
        <div className={styles.t9SignArea}>
          <div className={styles.t9SignLine} />
          <div className={styles.t9SignLabel}>Signature</div>
        </div>
      </div>
      <div className={styles.t9CornerDeco} />
    </div>
  )
}
