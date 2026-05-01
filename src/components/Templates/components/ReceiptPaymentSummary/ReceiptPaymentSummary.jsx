import { calcTax } from '../../utils/invoiceUtils'
import { resolveCumulativePaid, buildPaymentRows } from '../../../ReceiptViewer/utils'
import { fmt } from '../../utils/receiptUtils'

import styles from './ReceiptPaymentSummary.module.css'


const METHOD_EMOJI = {
  cash:     '💵',
  transfer: '🏦',
  card:     '💳',
}

function methodEmoji(method) {
  return METHOD_EMOJI[(method || '').toLowerCase()] ?? '🧾'
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—'
}


export function ReceiptPaymentSummary({ receipt, brand, isTemplate5 = false  }) {

  
  const { currency, showTax, taxRate } = brand

  // ── Totals ────────────────────────────────────────────────────────────────
  const orderTotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(receipt.orderPrice) || 0)

  const tax              = calcTax(orderTotal, taxRate, showTax)

  // ── Build payment rows ────────────────────────────────────────────────────
  const paymentRows = buildPaymentRows(receipt)

  // Previously paid = all non-latest rows
  const previouslyPaid = paymentRows
    .filter(p => !p._isCurrent)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  // This payment = sum of latest-date rows only
  const thisPaymentTotal = paymentRows
    .filter(p => p._isCurrent)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const balanceRemaining = parseFloat(receipt.balance) >= 0
    ? parseFloat(receipt.balance)
    : Math.max(0, orderTotal - resolveCumulativePaid(receipt))
  const isFullyPaid      = receipt.isFullPayment ?? (balanceRemaining <= 0)

  // ── "This Receipt" label ─────────────────────────────────────────────────
  const currentRows    = paymentRows.filter(p => p._isCurrent)
  const currentMethods = [...new Set(currentRows.map(p => capitalize(p.method || '')))]
  const methodString   = currentMethods.length <= 1
    ? (currentMethods[0] || 'This')
    : currentMethods.slice(0, -1).join(', ') + ' & ' + currentMethods.at(-1)


  return (
    <div className={styles.container}>

      {/* ── Payment History ──────────────────────────────────────────── */}
      {paymentRows.length > 0 && (
        <div className={styles.historySection}>

          <div className={styles.sectionLabel} 
          style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
            Payment History
          </div>

          {paymentRows.map((payment, index) => {
            const isCurrent = payment._isCurrent
            const method    = payment.method || ''

            return (
              <div key={payment.id ?? index} className={styles.paymentRow}
              style={{ borderBottom : isTemplate5 ? '1px solid rgba(255,255,255,0.35)' : '1px dashed #ebebeb' }}>

                <span className={styles.emoji}>{methodEmoji(method)}</span>

                <div className={styles.paymentMeta}>
                  <div className={styles.paymentMethod} 
                  style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
                    {capitalize(method)}
                    {isCurrent && <span className={styles.latestBadge}>Latest</span>}
                  </div>
                  <div className={styles.paymentDate}>{payment.date}</div>
                </div>

                <span className={`${styles.paymentAmount} ${isCurrent ? styles.amountCurrent : ''}`}
                style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
                  {fmt(currency, payment.amount)}
                </span>

              </div>
            )
          })}

        </div>
      )}

      {/* ── Totals Summary ───────────────────────────────────────────── */}
      <div className={styles.totalsSection}>

        {showTax && taxRate > 0 && (
          <div className={styles.totalsRow}>
            <span className={styles.totalsKey}>Tax ({taxRate}%)</span>
            <span className={styles.totalsVal}>{fmt(currency, tax)}</span>
          </div>
        )}

        {paymentRows.length > 0 && previouslyPaid > 0 && (
          <div className={styles.totalsRow}>
            <span className={styles.totalsKey}
            style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
              Previously Paid
            </span>
            <span className={styles.totalsVal}
            style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
              {fmt(currency, previouslyPaid)}</span>
          </div>
        )}

        {paymentRows.length > 0 && thisPaymentTotal > 0 && (
          <div className={styles.totalsRow}>
            <span className={styles.totalsKey}
            style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
              This Payment
            </span>
            <span className={`${styles.totalsVal} ${styles.amountPaid}`}>
              + {fmt(currency, thisPaymentTotal)}
            </span>
          </div>
        )}

        <div className={styles.totalsDivider} 
        style={{ borderBottom : isTemplate5 ? '1px solid #ebebeb' : '' }}/>

        <div className={styles.totalPaidRow}>
          <span className={styles.totalPaidKey}
          style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}
          >
            Total Paid</span>
          <span className={styles.totalPaidVal} 
          style={{ color : isTemplate5 ? 'var(--brand-on-primary)' : '' }} 
          >
            {fmt(currency, thisPaymentTotal + previouslyPaid)}
          </span>
        </div>

        {/* Status callout */}
        {!isFullyPaid ? (
          <div className={styles.balanceCallout}>
            <div>
              <div className={styles.balanceLabel}>Balance Remaining</div>
              <div className={styles.balanceSubLabel}>Order total · {fmt(currency, orderTotal)}</div>
            </div>
            <span className={styles.balanceAmount}>{fmt(currency, balanceRemaining)}</span>
          </div>
        ) : (
          <div className={styles.paidCallout}>
            <div>
              <div className={styles.paidLabel}>✓ PAID IN FULL</div>
            </div>
            <span className={styles.paidAmount}>{fmt(currency, orderTotal)}</span>
          </div>
        )}

      </div>

    </div>
  )
}