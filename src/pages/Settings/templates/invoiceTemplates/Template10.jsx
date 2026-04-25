import styles from "../styles/Template10.module.css"
import { TAILOR_ROWS } from "../../datas/sampleDatas"

export function InvoiceTemplate10() {
  return (
    <div className={styles.t10Base}>
      <div className={styles.t10HeaderZone}>
        <div className={styles.t10FullBanner}>
          <span className={styles.t10BannerTitle}>INVOICE</span>
        </div>
        <div className={styles.t10BrandInBanner}>
          <span className="mi" style={{ fontSize:14,color:'#333' }}>checkroom</span>
          <div>
            <div className={styles.t10BrandName}>Adeola Couture</div>
            <div className={styles.t10BrandSub}>TAILORING STUDIO</div>
          </div>
        </div>
      </div>
      <div className={styles.t10MetaRow}>
        <div>
          <div className={styles.t10MetaLabel}>Invoice to:</div>
          <div className={styles.t10MetaName}>Mrs. Amina Garba</div>
          <div className={styles.t10MetaAddr}>Plot 22, Maitama District,<br />Abuja, FCT, 900211</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div><span className={styles.t10MetaKey}>Invoice#</span> <strong>0000010</strong></div>
          <div><span className={styles.t10MetaKey}>Date</span> <strong>08 / 04 / 2025</strong></div>
        </div>
      </div>
      <div className={styles.t10TableHead}>
        <span>SN</span>
        <span style={{ flex:3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {TAILOR_ROWS.map(([d,p,q,t],i)=>(
        <div key={d} className={styles.t10TableRow}>
          <span>{i+1}</span>
          <span style={{ flex:3 }}>{d}</span>
          <span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t10Divider} />
      <div className={styles.t10Bottom}>
        <div style={{ flex:1 }}>
          <div className={styles.t10ThankYou}>Thank you for your business</div>
          <div className={styles.t10PayLabel}>Payment Info:</div>
          <div className={styles.t10PayInfo}>
            Account #: 0123 4567 89<br />
            A/C Name: Adeola Stitches<br />
            Bank: GT Bank Nigeria
          </div>
          <div className={styles.t10TCLabel}>Terms &amp; Conditions</div>
          <div className={styles.t10TCText}>Garments not collected within 30 days become property of the studio.</div>
        </div>
        <div className={styles.t10RightCol}>
          <div className={styles.t10TotalsWrap}>
            <div className={styles.t10TotRow}><span>Sub Total:</span><span>₦56,200</span></div>
            <div className={styles.t10TotRow}><span>Tax:</span><span>0.00%</span></div>
            <div className={styles.t10TotDivider} />
            <div className={styles.t10TotTotal}><span>Total:</span><span>₦56,200</span></div>
          </div>
          <div className={styles.t10SignBlock}>
            <div className={styles.t10SignLine} />
            <div className={styles.t10SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>
      <div className={styles.t10CornerPink} />
    </div>
  )
}
