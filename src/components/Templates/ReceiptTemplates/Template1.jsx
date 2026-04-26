import styles from "../styles/Template1.module.css"


export function ReceiptTemplate1({ receipt, customer, brand }) {
  const lineColor = brand.colour || '#c8a96e'
  return (
    <div className={styles.tplBase}>
      <div className={styles.editHeader}>
        <div className={styles.pBrandName}>{brand.name || 'Your Brand'}</div>
        {brand.tagline && <div className={styles.editTagline}>{brand.tagline}</div>}
        {brand.address && <div className={styles.editAddr}>{brand.address}</div>}
        <div className={styles.editTitleRow}>
          <div className={styles.editTitleLine} style={{ background: lineColor }} />
          <div className={styles.editTitle}>RECEIPT</div>
          <div className={styles.editTitleLine} style={{ background: lineColor }} />
        </div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>RECEIVED FROM</div>
          <div className={styles.metaVal}>{customer.name}</div>
          {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.metaLabel}>RECEIPT #</div>
          <div className={styles.metaVal}>{receipt.number}</div>
          <div className={styles.metaSub}>{receipt.date}</div>
        </div>
      </div>
      <ReceiptPaymentSummary receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
      {(brand.phone || brand.email || brand.footer) && (
        <div className={styles.editFooter}>
          {(brand.phone || brand.email || brand.footer) && (
            <div className={styles.footSection}>
              <strong>Notes:</strong><br />
              {brand.phone   && <span>{brand.phone}<br /></span>}
              {brand.email   && <span>{brand.email}<br /></span>}
              {brand.footer  && <span>{brand.footer}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
