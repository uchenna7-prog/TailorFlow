import styles from "../styles/Template2.module.css"


export function ReceiptTemplate2({ receipt, customer, brand }) {
  return (
    <div className={styles.tplBase}>
      <div className={styles.freeHeader}>
        <div>
          <div className={styles.printTitle}>RECEIPT</div>
          <div className={styles.freeNum}>{receipt.number}</div>
        </div>
        <div className={styles.freeLogoBox}><LogoOrName brand={brand} /></div>
      </div>
      <div className={styles.freeGrid}>
        <div className={styles.freeBox}>
          <strong>FROM</strong><br />
          {brand.name}<br />
          {brand.address && <span>{brand.address}<br /></span>}
          {brand.phone}
        </div>
        <div className={styles.freeBox}><strong>RECEIVED FROM</strong><br />{customer.name}<br />{customer.phone}</div>
        <div className={styles.freeBox}><strong>DATE</strong><br />{receipt.date}</div>
      </div>
      <ReceiptPaymentSummary receipt={receipt} brand={brand} />
      <div className={styles.tplFooterPush} />
      <div className={styles.freeFooterCentered}>{brand.footer || 'Thank you!'}</div>
    </div>
  )
}
