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

    <div className={styles.orderDescriptionRow}>
      <div className={styles.orderText}>ORDER:</div>
      <div className={styles.orderDescLabel}>{receipt.orderDesc || 'Garment Order'}</div>

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

      {/* Order Total — full width section divider */}
      <div className={styles.orderTotalWrap}>
      
       
        <div className={styles.orderTotalLabel}>Order Total</div>
       
        <div className={styles.orderTotalValue}>{fmt(currency, total)}</div>
      </div>

    </div>
  )
}