import styles from "../styles/Template5.module.css"


export function ReceiptTemplate5({ receipt, customer, brand }) {
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t5Wrap}>
      <div className={styles.t5Top}>
        <div className={styles.t5Title}>Receipt</div>
        <div className={styles.t5TopRight}>
          <div>{receipt.date}</div>
          <div><strong>Receipt No. {receipt.number}</strong></div>
        </div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5BilledTo}>
        <div className={styles.t5BilledLabel}>Received from:</div>
        <div><strong>{customer.name}</strong></div>
        {customer.phone   && <div>{customer.phone}</div>}
        {customer.address && <div>{customer.address}</div>}
      </div>
      <div className={styles.t5Divider} />
      <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px', color: 'rgba(255,255,255,0.7)' }}>Order Details</div>
      <div className={styles.t5TableHead}>
        <span style={{ flex: 0.5 }}>S/N</span>
        <span style={{ flex: 3 }}>Description</span><span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t5TableRow}>
          <span style={{ flex: 0.5 }}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t5TableRow}>
          <span style={{ flex: 0.5 }}>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t5Divider} />
      <div className={styles.t5TotalsSection}>
        <div className={styles.t5TotRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {paymentRows.length > 0 && (
        <>
          <div className={styles.t5Divider} />
          <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0', color: 'rgba(255,255,255,0.7)' }}>Payment History</div>
          <div className={styles.t5TableHead}>
            <span style={{ flex: 0.5 }}>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span><span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t5TableRow}>
              <span style={{ flex: 0.5, opacity: p._isCurrent ? 1 : 0.55, fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, opacity: p._isCurrent ? 1 : 0.55, fontWeight: p._isCurrent ? 700 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ fontWeight: 700, opacity: p._isCurrent ? 1 : 0.7 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ fontWeight: p._isCurrent ? 700 : 400, opacity: p._isCurrent ? 1 : 0.55 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t5Divider} />
          <div className={styles.t5TotalsSection}>
            <div className={styles.t5TotRow}><span>Total Paid</span><span style={{ fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t5TotRow}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.t5TotalsSection}>
          {!isFullPayment && <div className={styles.t5TotRow}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
          <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
            <span>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
      <div className={styles.t5Divider} />
      <div className={styles.t5Footer}>
        <div />
        <div style={{ textAlign: 'right' }}>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.address && <div>{brand.address}</div>}
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
        </div>
      </div>
      {brand.footer && <div className={styles.t5FootNote}>{brand.footer}</div>}
    </div>
  )
}
