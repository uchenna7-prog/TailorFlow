
import { calcTax } from "../../utils/invoiceUtils"
import styles from "./ItemsTable.module.css"
import { fmt } from "../../utils/invoiceUtils"

export function ItemsTable({ invoice, brand }) {
  const { currency, showTax, taxRate } = brand
  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : 0
  const tax   = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tHead}>
        <span className={styles.tColDesc}>Description</span>
        <span className={styles.tColNum}>Price</span>
      </div>
      <div className={styles.tRowMain}>
        <div className={styles.tColDesc}>{invoice.orderDesc || 'Garment Order'}</div>
        <div className={styles.tColNum}>{fmt(currency, subtotal)}</div>
      </div>
      {invoice.items?.length > 0 && (
        <div className={styles.itemizedSection}>
          <div className={styles.itemizedLabel}>Garments Included:</div>
          {invoice.items.map((item, idx) => (
            <div key={idx} className={styles.tRowSub}>
              <span className={styles.tColDesc}>• {item.name}</span>
              <span className={styles.tColNum}>{fmt(currency, item.price)}</span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.summary}>
        <div className={styles.sumRow}><span>Subtotal</span><span>{fmt(currency, subtotal)}</span></div>
        {showTax && taxRate > 0 && (
          <div className={styles.sumRow}><span>Tax ({taxRate}%)</span><span>{fmt(currency, tax)}</span></div>
        )}
        <div className={`${styles.sumRow} ${styles.sumTotal}`}>
          <span>Total Due</span><span>{fmt(currency, total)}</span>
        </div>
      </div>
    </div>
  )
}
