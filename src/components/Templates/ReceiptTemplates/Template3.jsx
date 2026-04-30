import styles from "../styles/Template3.module.css"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { ItemsTable } from "../components/ReceiptItemsTable/ReceiptItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"

export function ReceiptTemplate3({ receipt, customer, brand }) {

  const bannerBg = brand.colour || '#0057D7'

  return (

    <div className={styles.template} style={{ padding : 0 }}>

      <div className={styles.customBanner} style={{ background : bannerBg }}>

        <div className={styles.customBannerLogo}>
          <LogoOrName brand={brand} darkBg />
        </div>

        <div className={styles.customBannerRight}>

          <div className={styles.customBannerTitle}>RECEIPT</div>
          <div className={styles.customBannerReceiptNumber}>{receipt.number}</div>

        </div>

      </div>

      <div className={styles.body}>

        <div className={styles.metaRow} style={{ marginBottom : 16 }}>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>RECEIVED BY</div>
            <div className={styles.metaVal}>{brand.name}</div>
            {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
            {brand.address && <div className={styles.metaSub}>{brand.address}</div>}

          </div>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>RECEIVED FROM</div>
            <div className={styles.metaVal}>{customer.name}</div>
            {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
            {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

          </div>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>ISSUE DATE</div>
            <div className={styles.metaSub}>{receipt.date}</div>

          </div>

          <div className={styles.metaItem} style={{ textAlign : 'right' }}>

            <div className={styles.metaLabel}>DUE DATE</div>
      

          </div>

        </div>

        <ItemsTable receipt={receipt} brand={brand} />
        <ReceiptPaymentSummary receipt={receipt} brand={brand} />

        {brand.accountBank && (
          <div className={styles.paymentRow}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Details :</strong><br/>

              <div>

                {brand.name && (
                  <div>Received By  : {brand.name}</div>
                )}
                
              </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText} >{brand.footer || 'Thank you for your patronage'}</div>
      </div>

    </div>
  )
}
