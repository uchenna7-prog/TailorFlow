import styles from "../styles/Template7.module.css"


export function ReceiptTemplate7({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#cc0000'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t7Wrap}>
      <div className={styles.t7Header}>
        <div className={styles.t7LogoCircle} style={{ borderColor: accentColor }}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: '50%' }} />
            : <span className="mi" style={{ fontSize: 13, color: accentColor }}>checkroom</span>
          }
        </div>
        <div className={styles.t7TitleGroup}>
          <span className={styles.t7InvoiceWord}>RECEIPT</span>
          <span className={styles.t7InvoiceNum}>#{receipt.number}</span>
        </div>
        <div className={styles.t7DateBlock}>
          <div className={styles.t7DateLabel}>DATE:</div>
          <div className={styles.t7DateVal} style={{ color: accentColor }}>{receipt.date}</div>
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7FromTo}>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7FromLabel}>FROM:</div>
          <div className={styles.t7FromDivider} />
          {[
            ['NAME:', brand.ownerName || brand.name],
            ['COMPANY:', (brand.name || '').toUpperCase()],
            ['ADDRESS:', (brand.address || '').toUpperCase()],
            ['PHONE:', (brand.phone || '').toUpperCase()],
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.t7InfoRow}>
              <span className={styles.t7InfoKey}>{l}</span>
              <span className={styles.t7InfoVal}>{v}</span>
            </div>
          ))}
        </div>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7ToLabel}>TO:</div>
          <div className={styles.t7FromDivider} />
          {[
            ['NAME:', (customer.name || '').toUpperCase()],
            ['PHONE:', (customer.phone || '').toUpperCase()],
            ['ADDRESS:', (customer.address || '').toUpperCase()],
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.t7InfoRow}>
              <span className={styles.t7InfoKey}>{l}</span>
              <span className={styles.t7InfoVal}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7ForLabel}>FOR:</div>
      <div style={{ fontWeight: 900, fontSize: 8, letterSpacing: '0.04em', margin: '3px 16px 2px', color: '#1a1a1a' }}>Order Details</div>
      <div className={styles.t7TableHead}>
        <span className={styles.t7NumCol}>S/N</span>
        <span style={{ flex: 3 }}>Description</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span className={styles.t7RedPrice} style={{ color: accentColor }}>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span className={styles.t7RedPrice} style={{ color: accentColor }}>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className={styles.t7Divider} />
          <div style={{ fontWeight: 900, fontSize: 9, letterSpacing: '0.04em', padding: '4px 16px 2px', color: '#1a1a1a' }}>Payment History</div>
          <div className={styles.t7TableHead}>
            <span className={styles.t7NumCol}>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t7TableRow}>
              <span className={styles.t7NumCol} style={{ color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span style={{ flex: 3, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
                {p.date}
                {p.method && (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                )}
              </span>
              <span style={{ flex: 1, textAlign: 'right', color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.t7TableRow} style={{ fontWeight: 700 }}>
            <span className={styles.t7NumCol} />
            <span style={{ flex: 3, color: '#444' }}>Total Paid</span>
            <span style={{ flex: 1, textAlign: 'right', color: '#16a34a' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
          {!isFullPayment && (
            <div className={styles.t7TableRow}>
              <span className={styles.t7NumCol}>—</span>
              <span style={{ flex: 3, color: '#ef4444', fontWeight: 700 }}>Balance Remaining</span>
              <span style={{ flex: 1, textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span>
            </div>
          )}
        </div>
      )}
      {paymentRows.length === 0 && !isFullPayment && (
        <div className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>—</span>
          <span style={{ flex: 3, color: '#ef4444', fontWeight: 700 }}>Balance Remaining</span>
          <span style={{ flex: 1, textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span>
        </div>
      )}
      <div className={styles.t7TotalBar} style={{ background: accentColor }}>
        <span>{isFullPayment ? 'PAID IN FULL:' : 'RECEIVED:'}</span>
        <span className={styles.t7TotalAmt}>{fmt(currency, thisPaymentTotal)}</span>
      </div>
    </div>
  )
}
