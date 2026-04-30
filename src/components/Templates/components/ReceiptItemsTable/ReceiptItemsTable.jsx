import { calcTax } from "../../utils/receiptUtils"
import styles from "./ReceiptItemsTable.module.css"
import { fmt } from "../../utils/receiptUtils"
import { useBrandTokens } from "../../../../hooks/useBrandTokens"
import { useRef } from "react"

export function ItemsTable({ receipt, brand }) {

  const tableRef = useRef()

  useBrandTokens(brand.colourId, tableRef)

  const { currency, showTax, taxRate } = brand

  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const tax   = calcTax(subtotal, taxRate, showTax)
  const total = subtotal + tax

  return (
    <div className={styles.table} ref={tableRef}>

      {/* Order name + total — sits above the column headers */}
      <div className={styles.orderDescriptionRow}>
        <div className={styles.orderDescLabel}>{receipt.orderDesc || 'Garment Order'}</div>
        <div className={styles.orderDescAmount}>{fmt(currency, subtotal)}</div>
      </div>

      <table className={styles.tableEl}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.colItem}>Item</th>
            <th className={styles.colPrice}>Unit Price</th>
            <th className={styles.colQty}>Qty</th>
            <th className={styles.colAmount}>Amount</th>
          </tr>
        </thead>
        {receipt.items?.length > 0 && (
          <tbody className={styles.itemsBody}>
            {receipt.items.map((item, idx) => {
              const qty        = item.qty ?? 1
              const unitPrice  = parseFloat(item.price) || 0
              const lineAmount = qty * unitPrice
              return (
                <tr key={idx} className={styles.itemRow}>
                  <td className={`${styles.colItem} ${styles.itemName}`}>{item.name}</td>
                  <td className={`${styles.colPrice} ${styles.itemUnitPrice}`}>{fmt(currency, unitPrice)}</td>
                  <td className={`${styles.colQty} ${styles.itemQty}`}>{qty}</td>
                  <td className={`${styles.colAmount} ${styles.itemLineAmount}`}>{fmt(currency, lineAmount)}</td>
                </tr>
              )
            })}
          </tbody>
        )}
      </table>

      {/* Summary block */}
      <div className={styles.summaryBlock}>

        <div className={styles.summaryRow}>
          <span className={styles.summaryKey}>Subtotal</span>
          <span className={styles.summaryVal}>{fmt(currency, subtotal)}</span>
        </div>

        {showTax && taxRate > 0 && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Tax ({taxRate}%)</span>
            <span className={styles.summaryVal}>{fmt(currency, tax)}</span>
          </div>
        )}

        <div className={styles.summaryDivider} />

        <div className={styles.summaryTotalRow}>
          <span className={styles.summaryTotalKey}>Total Due</span>
          <span className={styles.summaryTotalVal}>{fmt(currency, total)}</span>
        </div>

      </div>

    </div>
  )
}