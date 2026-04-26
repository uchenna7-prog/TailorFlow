// ─────────────────────────────────────────────────────────────
// Shared payment history block for templates 4-11
// Renders all rows (previous greyed, current bold/green) then totals
// ─────────────────────────────────────────────────────────────
function PaymentHistoryBlock({ receipt, currency, orderTotal, thisPaymentTotal, balanceRemaining, isFullPayment,
  headStyle, rowStyle, totalsAreaStyle, totRowStyle, totDividerStyle, totBoldStyle,
  headSNStyle, headDateStyle, headAmtStyle,
  rowSNStyle, rowDateStyle, rowAmtStyle,
  sectionLabelStyle,
}) {
  const paymentRows = buildPaymentRows(receipt)
  if (paymentRows.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      {sectionLabelStyle && (
        <div style={sectionLabelStyle}>Payment History</div>
      )}
      <div style={headStyle}>
        <span style={headSNStyle}>S/N</span>
        <span style={headDateStyle}>Payment Date</span>
        <span style={headAmtStyle}>Amount</span>
      </div>
      {paymentRows.map((p, idx) => (
        <div key={p.id ?? idx} style={rowStyle}>
          <span style={{ ...rowSNStyle, color: p._isCurrent ? (rowSNStyle?.color || '#1a1a1a') : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{p._sn}</span>
          <span style={{ ...rowDateStyle, color: p._isCurrent ? '#1a1a1a' : '#9ca3af', fontWeight: p._isCurrent ? 600 : 400 }}>
            {p.date}
            {p.method && (
              <span style={{ color: p._isCurrent ? '#16a34a' : '#b0b8c1', fontWeight: 700 }}> · {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</span>
            )}
          </span>
          <span style={{ ...rowAmtStyle, color: p._isCurrent ? '#16a34a' : '#9ca3af', fontWeight: p._isCurrent ? 700 : 400 }}>{fmt(currency, p.amount)}</span>
        </div>
      ))}
      <div style={totalsAreaStyle}>
        <div style={totRowStyle}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
        {!isFullPayment && <div style={{ ...totRowStyle, color: '#ef4444' }}><span>Balance Remaining</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
        <div style={totDividerStyle} />
        <div style={totBoldStyle}>
          <span>{isFullPayment ? 'PAID IN FULL' : 'AMOUNT RECEIVED'}</span>
          <span style={{ color: isFullPayment ? '#16a34a' : undefined }}>{fmt(currency, thisPaymentTotal)}</span>
        </div>
      </div>
    </div>
  )
}
