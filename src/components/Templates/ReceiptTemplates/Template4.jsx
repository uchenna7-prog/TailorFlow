import styles from "../styles/Template4.module.css"


export function ReceiptTemplate4({ receipt, customer, brand }) {
  const barColor = brand.colour || '#c8a96e'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.tplBase}>
      <div className={styles.printBar} style={{ background: barColor }} />
      <div className={styles.printHeaderSplit}>
        <div className={styles.printTitle}>RECEIPT</div>
        <div style={{ textAlign: 'right', fontSize: 9 }}>
          <div>DATE: <strong>{receipt.date}</strong></div>
          <div>RECEIPT #: <strong>{receipt.number}</strong></div>
        </div>
      </div>
      <div className={styles.metaRow} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 16 }}>
        <div>
          <div className={styles.metaLabel}>FROM</div>
          <div className={styles.metaVal}>{brand.name || brand.ownerName}</div>
          {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
          {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>RECEIVED FROM</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
        </div>
      </div>
      <div className={styles.p4TableArea}>
        <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', color: '#555' }}>Order Details</div>
        <div className={styles.p4TableHead} style={{ borderColor: barColor }}>
          <span style={{ flex: 0.5 }}>S/N</span>
          <span style={{ flex: 3 }}>Description</span>
          <span>Amount</span>
        </div>
        {receipt.items?.map((item, i) => (
          <div key={i} className={styles.p4TableRow}>
            <span style={{ flex: 0.5 }}>{i + 1}</span>
            <span style={{ flex: 3 }}>{item.name}</span>
            <span>{fmt(currency, item.price)}</span>
          </div>
        ))}
        {!receipt.items?.length && (
          <div className={styles.p4TableRow}>
            <span style={{ flex: 0.5 }}>1</span>
            <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
            <span>{fmt(currency, orderTotal)}</span>
          </div>
        )}
        <div className={styles.p4TotalsArea}>
          <div className={styles.p4TotRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
        </div>
      </div>
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '6px 0 4px', color: '#555' }}>Payment History</div>
          <div className={styles.p4TableHead} style={{ borderColor: barColor }}>
            <span style={{ flex: 0.5 }}>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.p4TableRow}>
              <span style={{ flex: 0.5, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ fontWeight: p._isCurrent ? 700 : 400, color: p._isCurrent ? '#16a34a' : '#9ca3af' }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.p4TotalsArea}>
            <div className={styles.p4TotRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.p4TotRow} style={{ color: '#ef4444' }}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.p4TotDivider} style={{ background: barColor }} />
            <div className={styles.p4TotBold}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.p4TableArea}>
          <div className={styles.p4TotalsArea}>
            {!isFullPayment && <div className={styles.p4TotRow} style={{ color: '#ef4444' }}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.p4TotDivider} style={{ background: barColor }} />
            <div className={styles.p4TotBold}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      <div className={styles.tplFooterPush} />
      {brand.footer && (
        <div className={styles.printFooterCentered}>
          <div className={styles.footSection}>{brand.footer}</div>
        </div>
      )}
    </div>
  )
}