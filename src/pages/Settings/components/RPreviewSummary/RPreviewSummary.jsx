import { rResolvePaid,rFmt } from "../../utils/receiptUtils";
import styles from "./RPreviewSummary.module.css";


export function RPreviewSummary({ receipt }) {
  const orderTotal     = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0);
  const cumulativePaid = rResolvePaid(receipt);
  const thisPaid       = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const balance        = Math.max(0, orderTotal - cumulativePaid);
  const isFull         = balance <= 0;

  return (
    <div className={styles.container}>
      <div className={styles.sectionTitle}>Order Details</div>

      <div className={styles.tableHeader}>
        <span className={styles.descriptionCol}>Description</span>
        <span className={styles.amountCol}>Amount</span>
      </div>

      {receipt.items?.slice(0, 3).map((item, i) => (
        <div key={i} className={styles.itemRow}>
          <span className={styles.descriptionCol}>{item.name}</span>
          <span className={styles.amountCol}>{rFmt(item.price)}</span>
        </div>
      ))}

      <div className={styles.summaryBlock}>
        <div className={styles.summaryRow}>
          <span>Total Paid</span>
          <span className={styles.paidAmount}>{rFmt(thisPaid)}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>{isFull ? "PAID IN FULL" : "RECEIVED"}</span>
          <span className={isFull ? styles.totalAmountPaid : styles.totalAmountPartial}>
            {rFmt(thisPaid)}
          </span>
        </div>
      </div>
    </div>
  );
}