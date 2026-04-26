import styles from "../styles/Template3.module.css"


export function ReceiptTemplate3({ receipt, customer, brand }) {
  const bannerBg = brand.colour || '#7c3aed'
  return (
    <div className={styles.tplBase} style={{ padding: 0 }}>
      <div className={styles.customBanner} style={{ background: bannerBg }}>
        <div className={styles.customBannerLogo}><LogoOrName brand={brand} darkBg /></div>
        <div className={styles.customBannerRight}>
          <div className={styles.customBannerTitle}>RECEIPT</div>
          <div className={styles.customBannerNum}>{receipt.number}</div>
        </div>
      </div>
      <div className={styles.customBody}>
        <div className={styles.metaRow} style={{ marginBottom: 16 }}>
          <div>
            <div className={styles.metaLabel}>FROM</div>
            <div className={styles.metaVal}>{brand.name}</div>
            {brand.address && <div className={styles.metaSub}>{brand.address}</div>}
            {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
          </div>
          <div>
            <div className={styles.metaLabel}>RECEIVED FROM</div>
            <div className={styles.metaVal}>{customer.name}</div>
            {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.metaLabel}>DATE</div>
            <div className={styles.metaSub}>{receipt.date}</div>
          </div>
        </div>
        <ReceiptPaymentSummary receipt={receipt} brand={brand} />
      </div>
      <div className={styles.customFooter}>
        <div className={styles.customFooterText} style={{ color: bannerBg }}>
          {brand.footer || 'Thank you for your payment'}
        </div>
      </div>
    </div>
  )
}
