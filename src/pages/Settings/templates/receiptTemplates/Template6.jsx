import styles from "../styles/Template6.module.css"
import {RECEIPT_SAMPLE,RECEIPT_SAMPLE_CUSTOMER,RECEIPT_BRAND_SAMPLE,TAILOR_ROWS} from "../../datas/sampleDatas";
import { RPreviewSummary } from "../../components/RPreviewSummary/RPreviewSummary";
import { rFmt,rResolvePaid } from "../../utils/receiptUtils";

export function RTemplate6() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.Base}>
      <div className={styles.Header}>
        <div className={styles.LogoArea}>
          <div className={styles.LogoCircle}>
            <span className="mi" style={{ fontSize: 13, color: '#1a1a1a' }}>checkroom</span>
          </div>
          <div>
            <div className={styles.CompanyName}>{b.name.toUpperCase()}</div>
            <div className={styles.CompanySub}>TAILORING STUDIO</div>
          </div>
        </div>
        <div className={styles.HeaderRight}><div>{b.address}</div></div>
        <div className={styles.HeaderRight}><div>{b.phone}</div><div>{b.email}</div></div>
      </div>
      <div className={styles.InvoiceRow}>
        <div className={styles.InvoiceLeft}>
          <span className={styles.InvoiceWord}>RECEIPT </span>
          <span className={styles.InvoiceNum}>#{r.number}</span>
        </div>
        <div className={styles.InvoiceRight}>
          <div><span className={styles.Label}>DATE:</span> {r.date}</div>
          <div><span className={styles.Label}>TOTAL:</span> {rFmt('56200')}</div>
        </div>
      </div>
      <div className={styles.InfoRow}>
        <div>
          <div className={styles.InfoLabel}>PAYMENT:</div>
          <strong>GT BANK</strong><br />
          {b.name}<br />Acct: 0123456789<br />
          <strong style={{ display: 'block', marginTop: 3 }}>TRANSFER</strong>
          {b.email}
        </div>
        <div>
          <div className={styles.InfoLabel}>RECEIVED BY:</div>
          {b.name}<br />{b.address}
        </div>
        <div>
          <div className={styles.InfoLabel}>RECEIVED FROM:</div>
          {c.name}<br />{c.phone}
        </div>
      </div>
      <div className={styles.TableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>PRICE</span><span>QTY</span><span>TOTAL</span>
      </div>
      {TAILOR_ROWS.map(([d, p, q, t]) => (
        <div key={d} className={styles.TableRowSolid}>
          <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.TotalsArea}>
        <div className={styles.TotRow}><span>SUBTOTAL</span><span>₦56,200</span></div>
        <div className={styles.TotRow}><span>TAX</span><span>₦0</span></div>
        <div className={styles.TotTotal}><span>TOTAL RECEIVED</span><span>{rFmt('56200')}</span></div>
      </div>
      <div className={styles.ThankYou}>{b.footer}</div>
    </div>
  )
}

