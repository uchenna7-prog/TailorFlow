import styles from "../styles/Template10.module.css"


export function ReceiptTemplate10({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#ff5c8a'
  const { currency } = brand
  const orderTotal       = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid   = resolveCumulativePaid(receipt)
  const thisPaymentTotal = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceRemaining = Math.max(0, orderTotal - cumulativePaid)
  const isFullPayment    = balanceRemaining <= 0
  const paymentRows      = buildPaymentRows(receipt)

  return (
    <div className={styles.t10Wrap}>
      <div className={styles.t10HeaderZone}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 400 72"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 400,0 400,28 0,72" fill={accentColor} />
        </svg>
        <div style={{ position: 'absolute', top: 10, left: 18, zIndex: 1 }}>
          <span className={styles.t10BannerTitle}>RECEIPT</span>
        </div>
        <div className={styles.t10BrandInBanner}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            : <span className="mi" style={{ fontSize: 14, color: '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.t10BrandName}>{brand.name || brand.ownerName}</div>
            <div className={styles.t10BrandSub}>TAILOR SHOP</div>
          </div>
        </div>
      </div>
      <div className={styles.t10MetaRow}>
        <div>
          <div className={styles.t10MetaLabel}>Received from:</div>
          <div className={styles.t10MetaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.t10MetaAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.t10MetaAddr}>{customer.address}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span className={styles.t10MetaKey}>Receipt#</span> <strong>{receipt.number}</strong></div>
          <div><span className={styles.t10MetaKey}>Date</span> <strong>{receipt.date}</strong></div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Order Details</div>
      <div className={styles.t10TableHead}>
        <span>S/N</span>
        <span style={{ flex: 3 }}>Description</span>
        <span>Amount</span>
      </div>
      {receipt.items?.map((item, i) => (
        <div key={i} className={styles.t10TableRow}>
          <span>{i + 1}</span>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span>{fmt(currency, item.price)}</span>
        </div>
      ))}
      {!receipt.items?.length && (
        <div className={styles.t10TableRow}>
          <span>1</span>
          <span style={{ flex: 3 }}>{receipt.orderDesc || 'Garment Order'}</span>
          <span>{fmt(currency, orderTotal)}</span>
        </div>
      )}
      <div className={styles.t10Divider} />
      {paymentRows.length > 0 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 16px 3px', color: '#555' }}>Payment History</div>
          <div className={styles.t10TableHead}>
            <span>S/N</span>
            <span style={{ flex: 3 }}>Payment Date</span>
            <span>Amount</span>
          </div>
          {paymentRows.map((p, idx) => (
            <div key={p.id ?? idx} className={styles.t10TableRow}>
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
          <div className={styles.t10Divider} />
        </>
      )}
      <div className={styles.t10Bottom}>
        <div style={{ flex: 1 }}>
          <div className={styles.t10ThankYou}>{brand.footer || 'Thank you for your payment'}</div>
          {(brand.phone || brand.email) && (
            <>
              <div className={styles.t10TCLabel}>Contact</div>
              <div className={styles.t10TCText}>
                {brand.phone && <span>{brand.phone}<br /></span>}
                {brand.email && <span>{brand.email}</span>}
              </div>
            </>
          )}
        </div>
        <div className={styles.t10RightCol}>
          <div className={styles.t10TotalsWrap}>
            <div className={styles.t10TotRow}><span>Order Value:</span><span>{fmt(currency, orderTotal)}</span></div>
            <div className={styles.t10TotRow}><span>Total Paid:</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(currency, thisPaymentTotal)}</span></div>
            {!isFullPayment && <div className={styles.t10TotRow} style={{ color: '#ef4444' }}><span>Balance:</span><span style={{ fontWeight: 700 }}>{fmt(currency, balanceRemaining)}</span></div>}
            <div className={styles.t10TotDivider} />
            <div className={styles.t10TotTotal}>
              <span>{isFullPayment ? 'Paid:' : 'Received:'}</span>
              <span style={{ color: isFullPayment ? '#16a34a' : '#1a1a1a' }}>{fmt(currency, thisPaymentTotal)}</span>
            </div>
          </div>
          <div className={styles.t10SignBlock}>
            <div className={styles.t10SignLine} />
            <div className={styles.t10SignLabel}>Authorised Sign</div>
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
