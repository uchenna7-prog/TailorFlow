// ─────────────────────────────────────────────────────────────
// Shared receipt payment summary block (used by templates 1-3)
// ─────────────────────────────────────────────────────────────

function ReceiptPaymentSummary({ receipt, brand }) {
  const { currency, showTax, taxRate } = brand

  const orderTotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(receipt.orderPrice) || 0)

  const tax            = calcTax(orderTotal, taxRate, showTax)
  const cumulativePaid = resolveCumulativePaid(receipt)
  const previousPaid   = parseFloat(receipt.previousPaid) || 0

  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0

  const paymentRows = buildPaymentRows(receipt)

  return (
    <div className={styles.tableWrapper}>
      <div style={{ fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, color: '#444' }}>Order Details</div>
      <div className={styles.tHead}>
        <span style={{ width: 18, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>S/N</span>
        <span className={styles.tColDesc}>Description</span>
        <span className={styles.tColNum}>Amount</span>
      </div>
      {receipt.items?.length > 0 ? (
        receipt.items.map((item, idx) => (
          <div key={idx} className={styles.tRowSub} style={{ padding: '5px 0', fontSize: 10, color: '#1a1a1a', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ width: 18, flexShrink: 0, color: '#888' }}>{idx + 1}</span>
            <span className={styles.tColDesc}>{item.name}</span>
            <span className={styles.tColNum}>{fmt(currency, item.price)}</span>
          </div>
        ))
      ) : (
        <div className={styles.tRowMain}>
          <div style={{ width: 18, flexShrink: 0, color: '#888', fontSize: 10 }}>1</div>
          <div className={styles.tColDesc}>{receipt.orderDesc || 'Garment Order'}</div>
          <div className={styles.tColNum}>{fmt(currency, orderTotal)}</div>
        </div>
      )}
      <div className={styles.summary} style={{ width: '100%', marginLeft: 0 }}>
        <div className={styles.sumRow}><span>Order Value</span><span>{fmt(currency, orderTotal)}</span></div>
      </div>
      {/* Payment History */}
      {paymentRows.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, color: '#444', borderTop: '1px solid #eee', paddingTop: 10 }}>
            Payment History
          </div>
          <div className={styles.tHead}>
            <span style={{ width: 18, flexShrink: 0 }}>S/N</span>
            <span className={styles.tColDesc}>Payment Date</span>
            <span className={styles.tColNum}>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.tRowSub}>
              <span style={{ width: 18, flexShrink: 0, color: p._isCurrent ? '#1a1a1a' : '#888', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
              <span className={styles.tColDesc} style={{ color: p._isCurrent ? '#1a1a1a' : '#6b7280', fontWeight: p._isCurrent ? 700 : 400 }}>
                {p.date}{p.method ? (
                  <span style={{ color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
                ) : null}
              </span>
              <span className={styles.tColNum} style={{ color: p._isCurrent ? '#16a34a' : '#6b7280', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
            </div>
          ))}
          <div className={styles.summary} style={{ width: '100%', marginLeft: 0, marginTop: 10 }}>
            {showTax && taxRate > 0 && (
              <div className={styles.sumRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
            )}
            <div className={styles.sumRow}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && (
              <div className={styles.sumRow}><span>Balance Remaining</span><span style={{ color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>
            )}
            <div className={`${styles.sumRow} ${styles.sumTotal}`}>
              <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
        </div>
      )}
      {paymentRows.length === 0 && (
        <div className={styles.summary} style={{ width: '100%', marginLeft: 0, marginTop: 10 }}>
          {showTax && taxRate > 0 && (
            <div className={styles.sumRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
          )}
          {!isFullPayment && (
            <div className={styles.sumRow}><span>Balance Remaining</span><span style={{ color: '#ef4444', fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>
          )}
          <div className={`${styles.sumRow} ${styles.sumTotal}`}>
            <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
            <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
