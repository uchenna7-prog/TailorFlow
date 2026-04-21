import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useBrand } from '../../contexts/BrandContext'
import { useBrandTokens } from '../../hooks/useBrandTokens'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ─────────────────────────────────────────────────────────────
// Shared invoice sample data
// ─────────────────────────────────────────────────────────────
const TAILOR_ROWS = [
  ['Custom Agbada Sewing',     '₦8,500',  '1', '₦8,500'],
  ['Senator Suit Stitching',   '₦6,200',  '2', '₦12,400'],
  ['Ankara Dress Alteration',  '₦2,500',  '3', '₦7,500'],
  ['Bridal Gown Fitting',      '₦15,000', '1', '₦15,000'],
  ['Trouser Hemming',          '₦1,200',  '4', '₦4,800'],
  ['Kaftan Embroidery',        '₦4,000',  '2', '₦8,000'],
]

const NUMBERED_ROWS = [
  ['1', 'Custom Agbada Sewing',    '1', '₦8,500',  '₦8,500'],
  ['2', 'Senator Suit Stitching',  '2', '₦6,200',  '₦12,400'],
  ['3', 'Ankara Dress Alteration', '3', '₦2,500',  '₦7,500'],
  ['4', 'Bridal Gown Fitting',     '1', '₦15,000', '₦15,000'],
  ['5', 'Trouser Hemming',         '4', '₦1,200',  '₦4,800'],
]

// ══════════════════════════════════════════════════════════════
// TEMPLATE 1 — Centered Balance
// ══════════════════════════════════════════════════════════════

function EditableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pBrandCenter}>
        <div className={styles.pBrandName}>Adeola Couture House</div>
        <div className={styles.pBrandSub}>14 Bode Thomas St, Surulere, Lagos</div>
      </div>
      <div className={styles.pInvoiceCentred}>
        <div className={styles.pInvoiceLine} />
        <div className={styles.pInvoiceWordCentre}>INVOICE</div>
        <div className={styles.pInvoiceLine} />
      </div>
      <div className={styles.pBody}>
        <div className={styles.pMetaRow}>
          <div>
            <div className={styles.pSmallCap}>BILL TO:</div>
            <strong>Mrs. Chidinma Okafor</strong><br />
            22 Akin Adesola Street<br />Victoria Island, Lagos
          </div>
          <div style={{ textAlign: 'right', fontSize: '7px' }}>
            Invoice #: <strong>0000001</strong><br />
            Issue Date: <strong>12 Apr 2025</strong><br />
            Due Date: <strong>19 Apr 2025</strong>
          </div>
        </div>
        <div className={styles.pTHead2}>
          <span style={{ flex: 3 }}>Description</span><span>Price</span><span>Qty</span><span>Total</span>
        </div>
        {TAILOR_ROWS.map(([d, p, q, t]) => (
          <div key={d} className={styles.pTRow2}>
            <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
          </div>
        ))}
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>₦56,200</span></div>
          <div className={styles.pSumRow}><span>Tax</span><span>₦0</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>₦56,200</span></div>
        </div>
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}>
          <strong>Payment Terms:</strong><br />
          GT Bank — Adeola Couture House<br />
          Account: 0123456789
        </div>
        <div className={styles.pFootSection}>
          <strong>Notes:</strong><br />
          Kindly make payment within 7 days.
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 2 — Triple-Box Info Bar
// ══════════════════════════════════════════════════════════════

function FreeTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pHeaderFree}>
        <div className={styles.pTitleBlock}>
          <div className={styles.pLargeTitle}>INVOICE</div>
          <div className={styles.pSubNo}>0000002</div>
        </div>
        <div className={styles.pLogoPlaceholderBig}>ADD YOUR LOGO</div>
      </div>
      <div className={styles.pFreeGrid}>
        <div className={styles.pFreeBox}>
          <div className={styles.pSmallCap}>BILL FROM:</div>
          <strong>Adeola Couture House</strong><br />14 Bode Thomas St, Lagos<br />+234 801 234 5678
        </div>
        <div className={styles.pFreeBox}>
          <div className={styles.pSmallCap}>BILL TO:</div>
          <strong>Mr. Emeka Nwosu</strong><br />5 Ogui Road, Enugu
        </div>
        <div className={styles.pFreeBox}>
          <div className={styles.pSmallCap}>ISSUE DATE:</div><strong>10 Apr 2025</strong><br />
          <div className={styles.pSmallCap} style={{ marginTop: 3 }}>DUE DATE:</div><strong>17 Apr 2025</strong>
        </div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pTHead2}>
          <span style={{ flex: 3 }}>Description</span><span>Price</span><span>Qty</span><span>Total</span>
        </div>
        {TAILOR_ROWS.map(([d, p, q, t]) => (
          <div key={d} className={styles.pTRow2}>
            <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
          </div>
        ))}
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>₦56,200</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>₦56,200</span></div>
        </div>
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}>
          <strong>Payment Information:</strong><br />
          GT Bank — Adeola Couture House, Account: 0123456789
        </div>
      </div>
      <div className={styles.pFooterGray}>Thank you for your business!</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 3 — Full-Bleed Banner
// ══════════════════════════════════════════════════════════════

function CustomTemplate() {
  return (
    <div className={styles.pBase} style={{ padding: 0 }}>
      <div className={styles.pPurpleBanner}>
        <div className={styles.pLogoBoxWhite}>Place logo here</div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.pLargeTitleWhite}>INVOICE</div>
          <div className={styles.pWhiteNo}>0000003</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px 6px', fontSize: '7px' }}>
        <div style={{ flex: 1 }}>
          <div className={styles.pSmallCap}>BILL FROM:</div>
          <strong>Adeola Couture House</strong><br />14 Bode Thomas St<br />Surulere, Lagos<br />+234 801 234 5678
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.pSmallCap}>BILL TO:</div>
          <strong>Miss Fatima Bello</strong><br />9 Marina Road<br />Lagos Island, Lagos
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.pSmallCap}>ISSUE DATE:</div>
          <strong>08 Apr 2025</strong>
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.pSmallCap}>DUE DATE:</div>
          <strong>15 Apr 2025</strong>
        </div>
      </div>
      <div style={{ padding: '0 14px', flex: 1 }}>
        <div className={styles.pTHead2}>
          <span style={{ flex: 3 }}>Description</span><span>Price</span><span>Qty</span><span>Total</span>
        </div>
        {TAILOR_ROWS.map(([d, p, q, t]) => (
          <div key={d} className={styles.pTRow2}>
            <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
          </div>
        ))}
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>₦56,200</span></div>
          <div className={styles.pSumRow}><span>Tax</span><span>₦0</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>₦56,200</span></div>
        </div>
      </div>
      <div className={styles.pPurpleBottom}>
        <div className={styles.pPurpleFootRow}>
          <div className={styles.pFootSectionWhite}>
            <strong>Payment Terms:</strong><br />GT Bank — Account: 0123456789
          </div>
          <div className={styles.pFootSectionWhite}>
            <strong>Notes:</strong><br />Payment due within 7 days
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 4 — Dual-Column Compact
// ══════════════════════════════════════════════════════════════

function PrintableTemplate() {
  const items = [
    { desc: 'Custom Agbada Sewing',    price: '₦8,500',  qty: 1, total: '₦8,500'  },
    { desc: 'Senator Suit Stitching',  price: '₦6,200',  qty: 2, total: '₦12,400' },
    { desc: 'Ankara Dress Alteration', price: '₦2,500',  qty: 3, total: '₦7,500'  },
    { desc: 'Bridal Gown Fitting',     price: '₦15,000', qty: 1, total: '₦15,000' },
    { desc: 'Trouser Hemming',         price: '₦1,200',  qty: 4, total: '₦4,800'  },
    { desc: 'Kaftan Embroidery',       price: '₦4,000',  qty: 2, total: '₦8,000'  },
  ]
  return (
    <div className={styles.p4Base}>
      <div className={styles.p4GoldBar} />
      <div className={styles.p4Header}>
        <div className={styles.p4InvoiceWord}>INVOICE</div>
        <div className={styles.p4HeaderRight}>
          <div className={styles.p4MetaRow}>
            <span className={styles.p4MetaKey}>ISSUE DATE</span>
            <span className={styles.p4MetaVal}>Date Field</span>
          </div>
          <div className={styles.p4MetaRow}>
            <span className={styles.p4MetaKey}>DUE DATE</span>
            <span className={styles.p4MetaVal}>Date Field</span>
          </div>
          <div className={styles.p4MetaRow}>
            <span className={styles.p4MetaKey}>INVOICE #</span>
            <span className={styles.p4MetaVal}>0000004</span>
          </div>
        </div>
      </div>
      <div className={styles.p4BillRow}>
        <div className={styles.p4BillBlock}>
          <div className={styles.p4BillLabel}>BILL FROM</div>
          <div className={styles.p4BillName}>Adeola Couture House</div>
          <div className={styles.p4BillInfo}>14 Bode Thomas Street</div>
          <div className={styles.p4BillInfo}>Surulere, Lagos</div>
          <div className={styles.p4BillInfo}>+234 801 234 5678</div>
        </div>
        <div className={styles.p4BillBlock} style={{ textAlign: 'right' }}>
          <div className={styles.p4BillLabel}>BILL TO</div>
          <div className={styles.p4BillName}>Dr. Tunde Adeleke</div>
          <div className={styles.p4BillInfo}>Block 7, GRA Phase 2</div>
          <div className={styles.p4BillInfo}>Port Harcourt, Rivers</div>
        </div>
      </div>
      <div className={styles.p4Divider} />
      <div className={styles.p4TableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>Price</span><span>QTY</span><span>Total</span>
      </div>
      {items.map((it, i) => (
        <div key={i} className={styles.p4TableRow}>
          <span style={{ flex: 3 }}>{it.desc}</span>
          <span>{it.price}</span><span>{it.qty}</span><span>{it.total}</span>
        </div>
      ))}
      <div className={styles.p4TotalsArea}>
        <div className={styles.p4TotRow}><span>Subtotal</span><span>₦56,200</span></div>
        <div className={styles.p4TotRow}><span>Tax</span><span>₦0.00</span></div>
        <div className={styles.p4TotDivider} />
        <div className={styles.p4TotBold}><span>Total Due</span><span>₦56,200</span></div>
      </div>
      <div className={styles.p4Footer}>
        <div className={styles.p4FootBlock}>
          <div className={styles.p4FootLabel}>Payment Terms:</div>
          <div className={styles.p4FootInfo}>GT Bank — Adeola Couture House</div>
          <div className={styles.p4FootInfo}>Account No: 0123456789</div>
          <div className={styles.p4FootInfo}>Routing #: 058152522</div>
        </div>
        <div className={styles.p4FootBlock}>
          <div className={styles.p4FootLabel}>Notes:</div>
          <div className={styles.p4FootInfo}>Add any additional notes here.</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 5 — Solid Header and Base
// ══════════════════════════════════════════════════════════════

function CanvaTemplate() {
  return (
    <div className={styles.t5Base}>
      <div className={styles.t5Top}>
        <div className={styles.t5Title}>Invoice</div>
        <div className={styles.t5TopRight}>
          <div>08 April 2025</div>
          <div><strong>Invoice No. 0000005</strong></div>
        </div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5BilledTo}>
        <div className={styles.t5BilledLabel}>Billed to:</div>
        <div><strong>Mrs. Ngozi Eze</strong></div>
        <div>+234 807 654 3210</div>
        <div>12 Awolowo Road, Ikoyi, Lagos</div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5TableHead}>
        <span style={{ flex: 3 }}>Description</span><span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {TAILOR_ROWS.map(([d, p, q, t]) => (
        <div key={d} className={styles.t5TableRow}>
          <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t5Divider} />
      <div className={styles.t5Totals}>
        <div className={styles.t5TotRow}><span>Subtotal</span><span>₦56,200</span></div>
        <div className={styles.t5TotRow}><span>Tax (0%)</span><span>₦0</span></div>
        <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}><span>Total</span><span>₦56,200</span></div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5Footer}>
        <div>
          <div className={styles.t5FootLabel}>Payment Information</div>
          <div>Adeola Couture House</div>
          <div>Bank: GT Bank Nigeria</div>
          <div>Account No: 0123 4567 89</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>Adeola Fashola</strong></div>
          <div>14 Bode Thomas St, Surulere, Lagos</div>
          <div>+234 801 234 5678</div>
          <div>info@adeolacouture.ng</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 6 — Three-Column Grid
// ══════════════════════════════════════════════════════════════

function DarkHeaderTemplate() {
  return (
    <div className={styles.t6Base}>
      <div className={styles.t6Header}>
        <div className={styles.t6LogoArea}>
          <div className={styles.t6LogoCircle}>
            <span className="mi" style={{ fontSize: 13, color: '#1a1a1a' }}>checkroom</span>
          </div>
          <div>
            <div className={styles.t6CompanyName}>ADEOLA COUTURE</div>
            <div className={styles.t6CompanySub}>PREMIUM TAILORING STUDIO</div>
          </div>
        </div>
        <div className={styles.t6HeaderRight}>
          <div>Adeola Couture House</div>
          <div>14 Bode Thomas Street</div>
          <div>Surulere, Lagos</div>
        </div>
        <div className={styles.t6HeaderRight}>
          <div>+234 801 234 5678</div>
          <div>+234 803 987 6543</div>
          <div>info@adeolacouture.ng</div>
        </div>
      </div>
      <div className={styles.t6InvoiceRow}>
        <div className={styles.t6InvoiceLeft}>
          <span className={styles.t6InvoiceWord}>INVOICE </span>
          <span className={styles.t6InvoiceNum}>#0000006</span>
        </div>
        <div className={styles.t6InvoiceRight}>
          <div><span className={styles.t6Label}>DATE:</span> 08/04/2025</div>
          <div><span className={styles.t6Label}>TOTAL:</span> ₦56,200</div>
        </div>
      </div>
      <div className={styles.t6InfoRow}>
        <div>
          <div className={styles.t6InfoLabel}>PAYMENT:</div>
          <strong>GT BANK</strong><br />
          Adeola Couture House<br />Acct: 0123456789<br />
          <strong style={{ display: 'block', marginTop: 3 }}>TRANSFER</strong>
          adeola@couture.ng
        </div>
        <div>
          <div className={styles.t6InfoLabel}>SHIP TO:</div>
          Mr. Babatunde Salami<br />Plot 3, Allen Avenue<br />Ikeja, Lagos
        </div>
        <div>
          <div className={styles.t6InfoLabel}>BILL TO:</div>
          Mr. Babatunde Salami<br />Plot 3, Allen Avenue<br />Ikeja, Lagos
        </div>
      </div>
      <div className={styles.t6TableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>PRICE</span><span>QTY</span><span>TOTAL</span>
      </div>
      {TAILOR_ROWS.map(([d, p, q, t]) => (
        <div key={d} className={styles.t6TableRowSolid}>
          <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t6TotalsArea}>
        <div className={styles.t6TotRow}><span>SUBTOTAL</span><span>₦56,200</span></div>
        <div className={styles.t6TotRow}><span>TAX</span><span>₦0</span></div>
        <div className={styles.t6TotTotal}><span>TOTAL</span><span>₦56,200</span></div>
      </div>
      <div className={styles.t6ThankYou}>THANK YOU FOR YOUR BUSINESS</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 7 — Formal Field-Labelled
// ══════════════════════════════════════════════════════════════

function RedBoldTemplate() {
  return (
    <div className={styles.t7Base}>
      <div className={styles.t7Header}>
        <div className={styles.t7LogoCircle}>
          <span className="mi" style={{ fontSize: 13, color: 'var(--brand-primary)' }}>checkroom</span>
        </div>
        <div className={styles.t7TitleGroup}>
          <span className={styles.t7InvoiceWord}>INVOICE</span>
          <span className={styles.t7InvoiceNum}>#0000007</span>
        </div>
        <div className={styles.t7DateBlock}>
          <div className={styles.t7DateLabel}>DATE:</div>
          <div className={styles.t7DateVal}>APRIL 08, 2025</div>
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7FromTo}>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7FromLabel}>FROM:</div>
          <div className={styles.t7FromDivider} />
          {[['NAME:','ADEOLA FASHOLA'],['COMPANY:','ADEOLA COUTURE HOUSE'],['ADDRESS:','14 BODE THOMAS ST'],['CITY:','SURULERE, LAGOS'],['PHONE:','+234 801 234 5678']].map(([l,v])=>(
            <div key={l} className={styles.t7InfoRow}><span className={styles.t7InfoKey}>{l}</span><span className={styles.t7InfoVal}>{v}</span></div>
          ))}
        </div>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7ToLabel}>TO:</div>
          <div className={styles.t7FromDivider} />
          {[['NAME:','CHUKWUEMEKA OBI'],['COMPANY:','OKONKWO HOLDINGS'],['ADDRESS:','7 INDEPENDENCE LAYOUT'],['CITY:','ENUGU STATE'],['PHONE:','+234 905 678 1234']].map(([l,v])=>(
            <div key={l} className={styles.t7InfoRow}><span className={styles.t7InfoKey}>{l}</span><span className={styles.t7InfoVal}>{v}</span></div>
          ))}
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7ForLabel}>FOR:</div>
      <div className={styles.t7TableHead}>
        <span className={styles.t7NumCol}>No.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span style={{ flex:1,textAlign:'right' }}>Qty</span>
        <span style={{ flex:1,textAlign:'right' }}>Price</span>
        <span style={{ flex:1,textAlign:'right' }}>Total</span>
      </div>
      {NUMBERED_ROWS.map(([n,d,q,p,t])=>(
        <div key={n} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{n}</span>
          <span style={{ flex:3 }}>{d}</span>
          <span style={{ flex:1,textAlign:'right' }}>{q}</span>
          <span style={{ flex:1,textAlign:'right' }}>{p}</span>
          <span className={styles.t7RedPrice}>{t}</span>
        </div>
      ))}
      <div className={styles.t7TotalBar}>
        <span>TOTAL:</span>
        <span className={styles.t7TotalAmt}>₦48,200</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 8 — Integrated Summary Box
// ══════════════════════════════════════════════════════════════

function GreenAccentTemplate() {
  return (
    <div className={styles.t8Base}>
      <div className={styles.t8Header}>
        <div className={styles.t8LogoArea}>
          <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          <div>
            <div className={styles.t8BrandName}>Adeola Couture</div>
            <div className={styles.t8BrandSub}>PREMIUM TAILORING STUDIO</div>
          </div>
        </div>
        <div className={styles.t8InvoiceBox}>
          <div className={styles.t8InvoiceTitle}>INVOICE</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Invoice#</span><span>0000008</span>
            <span>Date</span><span>08/04/2025</span>
          </div>
        </div>
      </div>
      <div className={styles.t8TableHead}>
        <span>SL.</span>
        <span style={{ flex:3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {TAILOR_ROWS.map(([d,p,q,t],i)=>(
        <div key={d} className={styles.t8TableRow}>
          <span>{i+1}</span>
          <span style={{ flex:3 }}>{d}</span>
          <span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t8Divider} />
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox}>
          <div className={styles.t8GreenBoxTitle}>Invoice to:</div>
          <div className={styles.t8GreenBoxName}>Mrs. Ngozi Eze</div>
          <div className={styles.t8GreenBoxAddr}>12 Awolowo Rd,<br />Ikoyi, Lagos.</div>
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Terms &amp; Conditions</div>
          <div className={styles.t8GreenBoxAddr}>All garments collected within 30 days of completion.</div>
        </div>
        <div className={styles.t8PaymentInfo}>
          <div className={styles.t8PayLabel}>Payment Info:</div>
          <div>Account #: 0123 4567 89</div>
          <div>A/C Name: Adeola Couture</div>
          <div>Bank: GT Bank Nigeria</div>
          <div className={styles.t8ThankYou}>Thank you for your business</div>
        </div>
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Sub Total:</span><span>₦56,200</span></div>
          <div className={styles.t8TotRow}><span>Tax:</span><span>0.00%</span></div>
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}><span>Total:</span><span>₦56,200</span></div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 9 — Accent Strip and Signature
// ══════════════════════════════════════════════════════════════

function TealGeometricTemplate() {
  return (
    <div className={styles.t9Base}>
      <div className={styles.t9Header}>
        <div>
          <div className={styles.t9LogoRow}>
            <span className="mi" style={{ fontSize:14,color:'#333' }}>checkroom</span>
            <span className={styles.t9CompanyName}>ADEOLA COUTURE</span>
          </div>
          <div className={styles.t9CompanySub}>PREMIUM TAILORING STUDIO</div>
          <div className={styles.t9CompanyAddr}>14 Bode Thomas St,<br />Surulere, Lagos</div>
        </div>
        <div className={styles.t9InvoiceTitle}>INVOICE</div>
      </div>
      <div className={styles.t9NumBar}>
        <span>INVOICE # 0000009</span><span>|</span><span>DATE: 08 / 04 / 2025</span>
      </div>
      <div className={styles.t9BillShip}>
        <div>
          <span className={styles.t9BillLabel}>Bill to:</span>
          <div><strong>Mr. Yusuf Abubakar</strong></div>
          <div>15 Kaduna Road, GRA</div><div>Kaduna State</div>
        </div>
        <div>
          <span className={styles.t9BillLabel}>Ship to:</span>
          <div><strong>Mr. Yusuf Abubakar</strong></div>
          <div>15 Kaduna Road, GRA</div><div>Kaduna State</div>
        </div>
      </div>
      <div className={styles.t9TableHead}>
        <span>QTY</span>
        <span style={{ flex:3 }}>DESCRIPTION</span>
        <span>PRICE</span><span>TOTAL</span>
      </div>
      {[['1','Custom Agbada Sewing','₦8,500','₦8,500'],['2','Senator Suit Stitching','₦6,200','₦12,400'],['3','Ankara Dress Alteration','₦2,500','₦7,500'],['1','Bridal Gown Fitting','₦15,000','₦15,000']].map(([q,d,p,t])=>(
        <div key={d} className={styles.t9TableRow}>
          <span>{q}</span><span style={{ flex:3 }}>{d}</span><span>{p}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t9SubArea}>
        <div className={styles.t9SubRow}><span>Subtotal</span><span>₦43,400</span></div>
        <div className={styles.t9SubRow}><span>Tax</span><span>0.00%</span></div>
      </div>
      <div className={styles.t9TotalBar}><span>TOTAL</span><span>₦43,400</span></div>
      <div className={styles.t9Footer}>
        <div>
          <div className={styles.t9ThankYou}>THANK YOU FOR YOUR BUSINESS</div>
          <div className={styles.t9PayNote}>Payment due max 7 days after invoice.</div>
        </div>
        <div className={styles.t9SignArea}>
          <div className={styles.t9SignLine} />
          <div className={styles.t9SignLabel}>Signature</div>
        </div>
      </div>
      <div className={styles.t9CornerDeco} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 10 — Slanted Geometric
// ══════════════════════════════════════════════════════════════

function PinkDiagonalTemplate() {
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
        <span>SL.</span>
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
            A/C Name: Adeola Couture House<br />
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

// ══════════════════════════════════════════════════════════════
// TEMPLATE 11 — Multi-Tile Payment Grid
// ══════════════════════════════════════════════════════════════

function BlueCleanTemplate() {
  return (
    <div className={styles.t11Base}>
      <div className={styles.t11TopBar}>
        <div className={styles.t11LogoArea}>
          <div className={styles.t11LogoHex}>
            <span className="mi" style={{ fontSize:11,color:'#fff' }}>checkroom</span>
          </div>
          <div>
            <div className={styles.t11CompanyName}>ADEOLA COUTURE</div>
            <div className={styles.t11CompanySub}>Premium Tailoring Studio</div>
          </div>
        </div>
        <div className={styles.t11CompanyInfo}>
          <div>Adeola Couture House</div>
          <div>14 Bode Thomas Street</div>
          <div>Surulere, Lagos</div>
        </div>
        <div className={styles.t11CompanyInfo} style={{ textAlign:'right' }}>
          <div>www.adeolacouture.ng</div>
          <div>info@adeolacouture.ng</div>
          <div>+234 801 234 5678</div>
        </div>
      </div>
      <div className={styles.t11InvoiceTitle}>Invoice</div>
      <div className={styles.t11BlueBar}>
        <span>INVOICE: #0000011</span>
        <span>DATE ISSUED: 08.04.2025</span>
        <span>DUE DATE: 15.04.2025</span>
      </div>
      <div className={styles.t11IssuedRow}>
        <div>
          <div className={styles.t11IssuedLabel}>ISSUED TO</div>
          <div>Mrs. Adaeze Obi</div>
          <div>27 Trans-Ekulu Avenue</div>
          <div>Enugu, Enugu State</div>
          <div>+234 812 345 6789</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className={styles.t11AmountLabel}>AMOUNT</div>
          <div className={styles.t11AmountVal}>₦56,200</div>
        </div>
      </div>
      <div className={styles.t11ProjectName}>Tailoring Order — Spring Collection 2025</div>
      <div className={styles.t11TableHead}>
        <span style={{ flex:3 }}>Description</span>
        <span>Qty</span><span>Price</span><span>Subtotal</span>
      </div>
      {TAILOR_ROWS.map(([d,p,q,t])=>(
        <div key={d} className={styles.t11TableRow}>
          <span style={{ flex:3 }}>• {d}</span>
          <span>{q}</span><span>{p}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t11TotArea}>
        <div className={styles.t11TotRow}><span>Subtotal</span><span>₦56,200</span></div>
        <div className={styles.t11TotRow}><span>Tax 0.00%</span><span>₦0</span></div>
        <div className={styles.t11TotBold}><span>TOTAL</span><span>₦56,200</span></div>
      </div>
      <div className={styles.t11PayTitle}>Payment Information</div>
      <div className={styles.t11PayBoxRow}>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Bank Transfer</div>
          <div>GT Bank Nigeria<br />Adeola Couture House<br />Acct: 0123456789</div>
        </div>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Mobile Money</div>
          <div>OPay: 0801 234 5678<br />Palmpay: 0803 987 6543<br />Adeola Fashola</div>
        </div>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Cash / Other</div>
          <div>Visit our studio at<br />14 Bode Thomas St<br />Surulere, Lagos</div>
        </div>
      </div>
      <div className={styles.t11ThankYou}>THANK YOU!</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared UI Primitives
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, premium = false }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize:'1.1rem',color:'var(--accent)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
      {premium && (
        <span className={styles.premiumBadge}>
          <span className="mi" style={{ fontSize:'0.7rem' }}>workspace_premium</span>PRO
        </span>
      )}
    </div>
  )
}

function SettingRow({ icon, label, sub, value, children, onClick, chevron, divider=true, locked=false, danger=false }) {
  return (
    <div
      className={`${styles.row} ${onClick&&!locked?styles.rowTappable:''} ${locked?styles.rowLocked:''} ${!divider?styles.noDivider:''}`}
      onClick={locked?undefined:onClick}
    >
      <div className={styles.rowIcon}><span className="mi" style={{ fontSize:'1.15rem', color: danger ? '#ef4444' : undefined }}>{icon}</span></div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel} style={{ color: danger ? '#ef4444' : undefined }}>{label}</div>
        {sub&&<div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {locked
          ?<span className="mi" style={{ fontSize:'1.1rem',color:'var(--accent)',opacity:0.7 }}>lock</span>
          :<>{value&&<span className={styles.rowValue}>{value}</span>}{children}{chevron&&<span className="mi" style={{ fontSize:'1rem',color:'var(--text3)',marginLeft:6 }}>chevron_right</span>}</>
        }
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button className={`${styles.toggle} ${value?styles.toggleOn:''}`} onClick={e=>{e.stopPropagation();onChange(!value);}} role="switch" aria-checked={value}>
      <span className={styles.toggleThumb} />
    </button>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt=>(
        <button key={opt.value} className={`${styles.segBtn} ${value===opt.value?styles.segActive:''}`} onClick={()=>onChange(opt.value)}>{opt.label}</button>
      ))}
    </div>
  )
}

function FieldGroup({ children }) { return <div className={styles.fieldGroup}>{children}</div> }
function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint&&<p className={styles.fieldHint}>{hint}</p>}
      {children}
    </div>
  )
}
function TextInput({ value, onChange, placeholder, type='text' }) {
  return <input className={styles.textInput} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} />
}
function Textarea({ value, onChange, placeholder, rows=3 }) {
  return <textarea className={styles.textarea} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} />
}

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={styles.fullOverlay}>
      <Header type="back" title={title} onBackClick={onBack} customActions={onSave?[{label:'Save',onClick:onSave}]:[]} />
      <div className={styles.fullContent}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Invoice Template Groups
// ─────────────────────────────────────────────────────────────

const TEMPLATE_GROUPS = [
  {
    groupLabel: 'Simple and Clean',
    groupDesc: 'Light, open layouts that are easy to read',
    groupIcon: 'article',
    templates: [
      { id:'editable',  label:'1. Centered Balance',    desc:'Business name in the middle with a line on each side',  Component:EditableTemplate },
      { id:'free',      label:'2. Triple-Box Info Bar', desc:'Three side-by-side boxes showing contact details',       Component:FreeTemplate },
      { id:'printable', label:'4. Dual-Column Compact', desc:'From and To details placed side by side',                Component:PrintableTemplate },
    ],
  },
  {
    groupLabel: 'Bold Blocks',
    groupDesc: 'Strong designs that use solid colour sections',
    groupIcon: 'widgets',
    templates: [
      { id:'custom',       label:'3. Full-Bleed Banner',    desc:'Big colour header at the top with a logo space',     Component:CustomTemplate },
      { id:'canva',        label:'5. Solid Top and Bottom', desc:'Colour fills both the top header and the base',      Component:CanvaTemplate },
      { id:'pinkdiagonal', label:'10. Slanted Header',      desc:'Header cuts diagonally with a matching corner fill', Component:PinkDiagonalTemplate },
    ],
  },
  {
    groupLabel: 'Clear Labels',
    groupDesc: 'Every section has a bold label so nothing is confusing',
    groupIcon: 'format_list_bulleted',
    templates: [
      { id:'redbold',     label:'7. Full Field Labels',     desc:'Sender and receiver details listed with bold labels',  Component:RedBoldTemplate },
      { id:'greenaccent', label:'8. Side Summary Box',      desc:'A dedicated box on the side holds totals and client details', Component:GreenAccentTemplate },
    ],
  },
  {
    groupLabel: 'Info Strip',
    groupDesc: 'Packs in your business details without clutter',
    groupIcon: 'table_rows',
    templates: [
      { id:'darkheader',    label:'6. Three-Column Details', desc:'Payment, delivery, and billing info in one row',      Component:DarkHeaderTemplate },
      { id:'tealgeometric', label:'9. Strip and Signature',  desc:'Slim info bar at the top with a sign line at the base', Component:TealGeometricTemplate },
    ],
  },
  {
    groupLabel: 'Payment Options',
    groupDesc: 'Shows all the ways your customer can pay you',
    groupIcon: 'payments',
    templates: [
      { id:'blueclean', label:'11. Payment Tiles', desc:'Separate boxes for bank transfer, mobile money, and cash', Component:BlueCleanTemplate },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Receipt sample data
// ─────────────────────────────────────────────────────────────

const RECEIPT_SAMPLE = {
  number: 'RCP-0001',
  date: '12 Apr 2025',
  orderDesc: 'Custom Agbada Sewing',
  orderPrice: '56200',
  items: [
    { name: 'Custom Agbada Sewing', price: '8500' },
    { name: 'Senator Suit Stitching', price: '6200' },
    { name: 'Ankara Dress Alteration', price: '2500' },
    { name: 'Bridal Gown Fitting', price: '15000' },
    { name: 'Trouser Hemming', price: '1200' },
  ],
  payments: [
    { date: '10 Apr 2025', amount: '28100', method: 'transfer' },
    { date: '12 Apr 2025', amount: '28100', method: 'cash' },
  ],
  cumulativePaid: '56200',
}

const RECEIPT_SAMPLE_CUSTOMER = {
  name: 'Mrs. Chidinma Okafor',
  phone: '+234 801 234 5678',
  address: '22 Akin Adesola St, Victoria Island',
}

const RECEIPT_BRAND_SAMPLE = {
  name: 'Adeola Couture House',
  ownerName: 'Adeola Fashola',
  tagline: 'Crafted with love, fitted for you',
  address: '14 Bode Thomas St, Surulere, Lagos',
  phone: '+234 801 234 5678',
  email: 'info@adeolacouture.ng',
  website: 'adeolacouture.ng',
  currency: '₦',
  footer: 'Thank you for your payment!',
  showTax: false,
  taxRate: 0,
}

// Receipt helpers
function rFmt(amount) {
  const n = parseFloat(amount) || 0
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function rResolvePaid(receipt) {
  if (receipt.cumulativePaid != null) return parseFloat(receipt.cumulativePaid)
  return (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
}

// Shared receipt item + payment summary block
function RPreviewSummary({ receipt }) {
  const orderTotal     = receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? (parseFloat(receipt.orderPrice) || 0)
  const cumulativePaid = rResolvePaid(receipt)
  const thisPaid       = (receipt.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balance        = Math.max(0, orderTotal - cumulativePaid)
  const isFull         = balance <= 0

  return (
    <div style={{ marginTop: 8, fontSize: 7 }}>
      <div style={{ fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, color: '#444' }}>Order Details</div>
      <div style={{ display: 'flex', fontWeight: 800, borderBottom: '1.5px solid #1a1a1a', paddingBottom: 3, marginBottom: 5, fontSize: 7 }}>
        <span style={{ flex: 3 }}>Description</span><span style={{ textAlign: 'right' }}>Amount</span>
      </div>
      {receipt.items?.slice(0,3).map((item, i) => (
        <div key={i} style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '3px 0', fontSize: 7 }}>
          <span style={{ flex: 3 }}>{item.name}</span>
          <span style={{ textAlign: 'right' }}>{rFmt(item.price)}</span>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', width: '55%', marginTop: 6, fontSize: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Total Paid</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{rFmt(thisPaid)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, borderTop: '1px solid #1a1a1a', paddingTop: 2, marginTop: 2 }}>
          <span>{isFull ? 'PAID IN FULL' : 'RECEIVED'}</span>
          <span style={{ color: isFull ? '#16a34a' : '#1a1a1a' }}>{rFmt(thisPaid)}</span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// RECEIPT PREVIEWS — exact same structure as invoice counterparts,
// only document type (RECEIPT), labels, and content differ.
// ══════════════════════════════════════════════════════════════

// Receipt 1 — Centered Balance
function REditablePreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.pBase}>
      <div className={styles.pBrandCenter}>
        <div className={styles.pBrandName}>{b.name}</div>
        <div className={styles.pBrandSub}>{b.address}</div>
      </div>
      <div className={styles.pInvoiceCentred}>
        <div className={styles.pInvoiceLine} />
        <div className={styles.pInvoiceWordCentre}>RECEIPT</div>
        <div className={styles.pInvoiceLine} />
      </div>
      <div className={styles.pBody}>
        <div className={styles.pMetaRow}>
          <div>
            <div className={styles.pSmallCap}>RECEIVED FROM:</div>
            <strong>{c.name}</strong><br />{c.phone}
          </div>
          <div style={{ textAlign: 'right', fontSize: '7px' }}>
            Receipt #: <strong>{r.number}</strong><br />
            Date: <strong>{r.date}</strong>
          </div>
        </div>
        <RPreviewSummary receipt={r} />
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}>
          <strong>Payment Received via:</strong><br />
          GT Bank — {b.name}<br />
          Account: 0123456789
        </div>
        <div className={styles.pFootSection}>
          <strong>Notes:</strong><br />
          {b.footer}
        </div>
      </div>
    </div>
  )
}

// Receipt 2 — Triple-Box Info Bar
function RFreePreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.pBase}>
      <div className={styles.pHeaderFree}>
        <div className={styles.pTitleBlock}>
          <div className={styles.pLargeTitle}>RECEIPT</div>
          <div className={styles.pSubNo}>{r.number}</div>
        </div>
        <div className={styles.pLogoPlaceholderBig}>{b.name}</div>
      </div>
      <div className={styles.pFreeGrid}>
        <div className={styles.pFreeBox}>
          <div className={styles.pSmallCap}>FROM:</div>
          <strong>{b.name}</strong><br />{b.address}<br />{b.phone}
        </div>
        <div className={styles.pFreeBox}>
          <div className={styles.pSmallCap}>RECEIVED FROM:</div>
          <strong>{c.name}</strong><br />{c.phone}
        </div>
        <div className={styles.pFreeBox}>
          <div className={styles.pSmallCap}>DATE:</div><strong>{r.date}</strong>
        </div>
      </div>
      <div className={styles.pBody}>
        <RPreviewSummary receipt={r} />
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}>
          <strong>Payment Received via:</strong><br />
          GT Bank — {b.name}, Account: 0123456789
        </div>
      </div>
      <div className={styles.pFooterGray}>{b.footer}</div>
    </div>
  )
}

// Receipt 3 — Full-Bleed Banner
function RCustomPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.pBase} style={{ padding: 0 }}>
      <div className={styles.pPurpleBanner}>
        <div className={styles.pLogoBoxWhite}>{b.name}</div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.pLargeTitleWhite}>RECEIPT</div>
          <div className={styles.pWhiteNo}>{r.number}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 6px', fontSize: '7px' }}>
          <div style={{ flex: 1 }}>
            <div className={styles.pSmallCap}>FROM:</div>
            <strong>{b.name}</strong><br />{b.address}<br />{b.phone}
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.pSmallCap}>RECEIVED FROM:</div>
            <strong>{c.name}</strong><br />{c.phone}
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.pSmallCap}>DATE:</div>
            <strong>{r.date}</strong>
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.pSmallCap}>RECEIPT #:</div>
            <strong>{r.number}</strong>
          </div>
        </div>
        <div style={{ padding: '0 14px', flex: 1 }}>
          <RPreviewSummary receipt={r} />
        </div>
      </div>
      <div className={styles.pPurpleBottom}>
        <div className={styles.pPurpleFootRow}>
          <div className={styles.pFootSectionWhite}>
            <strong>Payment Received via:</strong><br />GT Bank — Account: 0123456789
          </div>
          <div className={styles.pFootSectionWhite}>
            <strong>Notes:</strong><br />{b.footer}
          </div>
        </div>
      </div>
    </div>
  )
}

// Receipt 4 — Dual-Column Compact
function RPrintablePreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.p4Base}>
      <div className={styles.p4GoldBar} />
      <div className={styles.p4Header}>
        <div className={styles.p4InvoiceWord}>RECEIPT</div>
        <div className={styles.p4HeaderRight}>
          <div className={styles.p4MetaRow}>
            <span className={styles.p4MetaKey}>DATE</span>
            <span className={styles.p4MetaVal}>{r.date}</span>
          </div>
          <div className={styles.p4MetaRow}>
            <span className={styles.p4MetaKey}>RECEIPT #</span>
            <span className={styles.p4MetaVal}>{r.number}</span>
          </div>
        </div>
      </div>
      <div className={styles.p4BillRow}>
        <div className={styles.p4BillBlock}>
          <div className={styles.p4BillLabel}>FROM</div>
          <div className={styles.p4BillName}>{b.name}</div>
          <div className={styles.p4BillInfo}>{b.address}</div>
          <div className={styles.p4BillInfo}>{b.phone}</div>
        </div>
        <div className={styles.p4BillBlock} style={{ textAlign: 'right' }}>
          <div className={styles.p4BillLabel}>RECEIVED FROM</div>
          <div className={styles.p4BillName}>{c.name}</div>
          <div className={styles.p4BillInfo}>{c.phone}</div>
        </div>
      </div>
      <div className={styles.p4Divider} />
      <div style={{ padding: '0 16px' }}>
        <RPreviewSummary receipt={r} />
      </div>
      <div className={styles.p4Footer}>
        <div className={styles.p4FootBlock}>
          <div className={styles.p4FootLabel}>Payment Received via:</div>
          <div className={styles.p4FootInfo}>GT Bank — {b.name}</div>
          <div className={styles.p4FootInfo}>Account No: 0123456789</div>
        </div>
        <div className={styles.p4FootBlock}>
          <div className={styles.p4FootLabel}>Notes:</div>
          <div className={styles.p4FootInfo}>{b.footer}</div>
        </div>
      </div>
    </div>
  )
}

// Receipt 5 — Solid Header and Base
function RCanvaPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t5Base}>
      <div className={styles.t5Top}>
        <div className={styles.t5Title}>Receipt</div>
        <div className={styles.t5TopRight}>
          <div>{r.date}</div>
          <div><strong>Receipt No. {r.number}</strong></div>
        </div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5BilledTo}>
        <div className={styles.t5BilledLabel}>Received from:</div>
        <div><strong>{c.name}</strong></div>
        <div>{c.phone}</div>
      </div>
      <div className={styles.t5Divider} />
      <RPreviewSummary receipt={r} />
      <div className={styles.t5Divider} />
      <div className={styles.t5Footer}>
        <div>
          <div className={styles.t5FootLabel}>Payment Received via</div>
          <div>{b.name}</div>
          <div>Bank: GT Bank Nigeria</div>
          <div>Account No: 0123 4567 89</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>{b.ownerName}</strong></div>
          <div>{b.address}</div>
          <div>{b.phone}</div>
          <div>{b.email}</div>
        </div>
      </div>
    </div>
  )
}

// Receipt 6 — Three-Column Grid
// Uses solid border-bottom on table rows (matching invoice design)
function RDarkHeaderPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t6Base}>
      <div className={styles.t6Header}>
        <div className={styles.t6LogoArea}>
          <div className={styles.t6LogoCircle}>
            <span className="mi" style={{ fontSize: 13, color: '#1a1a1a' }}>checkroom</span>
          </div>
          <div>
            <div className={styles.t6CompanyName}>{b.name.toUpperCase()}</div>
            <div className={styles.t6CompanySub}>TAILORING STUDIO</div>
          </div>
        </div>
        <div className={styles.t6HeaderRight}><div>{b.address}</div></div>
        <div className={styles.t6HeaderRight}><div>{b.phone}</div><div>{b.email}</div></div>
      </div>
      <div className={styles.t6InvoiceRow}>
        <div className={styles.t6InvoiceLeft}>
          <span className={styles.t6InvoiceWord}>RECEIPT </span>
          <span className={styles.t6InvoiceNum}>#{r.number}</span>
        </div>
        <div className={styles.t6InvoiceRight}>
          <div><span className={styles.t6Label}>DATE:</span> {r.date}</div>
          <div><span className={styles.t6Label}>TOTAL:</span> {rFmt('56200')}</div>
        </div>
      </div>
      <div className={styles.t6InfoRow}>
        <div>
          <div className={styles.t6InfoLabel}>PAYMENT:</div>
          <strong>GT BANK</strong><br />
          {b.name}<br />Acct: 0123456789<br />
          <strong style={{ display: 'block', marginTop: 3 }}>TRANSFER</strong>
          {b.email}
        </div>
        <div>
          <div className={styles.t6InfoLabel}>RECEIVED BY:</div>
          {b.name}<br />{b.address}
        </div>
        <div>
          <div className={styles.t6InfoLabel}>RECEIVED FROM:</div>
          {c.name}<br />{c.phone}
        </div>
      </div>
      <div className={styles.t6TableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span><span>PRICE</span><span>QTY</span><span>TOTAL</span>
      </div>
      {TAILOR_ROWS.map(([d, p, q, t]) => (
        // solid border matches invoice design — t6TableRowSolid defined in CSS
        <div key={d} className={styles.t6TableRowSolid}>
          <span style={{ flex: 3 }}>{d}</span><span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t6TotalsArea}>
        <div className={styles.t6TotRow}><span>SUBTOTAL</span><span>₦56,200</span></div>
        <div className={styles.t6TotRow}><span>TAX</span><span>₦0</span></div>
        <div className={styles.t6TotTotal}><span>TOTAL RECEIVED</span><span>{rFmt('56200')}</span></div>
      </div>
      <div className={styles.t6ThankYou}>{b.footer}</div>
    </div>
  )
}

// Receipt 7 — Formal Field-Labelled (numbered rows, same as invoice)
function RRedBoldPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t7Base}>
      <div className={styles.t7Header}>
        <div className={styles.t7LogoCircle}>
          <span className="mi" style={{ fontSize: 13, color: 'var(--brand-primary)' }}>checkroom</span>
        </div>
        <div className={styles.t7TitleGroup}>
          <span className={styles.t7InvoiceWord}>RECEIPT</span>
          <span className={styles.t7InvoiceNum}>#{r.number}</span>
        </div>
        <div className={styles.t7DateBlock}>
          <div className={styles.t7DateLabel}>DATE:</div>
          <div className={styles.t7DateVal}>{r.date.toUpperCase()}</div>
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7FromTo}>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7FromLabel}>FROM:</div>
          <div className={styles.t7FromDivider} />
          {[['NAME:',b.ownerName],['COMPANY:',b.name.toUpperCase()],['ADDRESS:',b.address.split(',')[0]],['CITY:','SURULERE, LAGOS'],['PHONE:',b.phone]].map(([l,v])=>(
            <div key={l} className={styles.t7InfoRow}><span className={styles.t7InfoKey}>{l}</span><span className={styles.t7InfoVal}>{v}</span></div>
          ))}
        </div>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7ToLabel}>TO:</div>
          <div className={styles.t7FromDivider} />
          {[['NAME:',c.name.toUpperCase()],['PHONE:',c.phone],['ADDRESS:',c.address?.split(',')[0] || '22 AKIN ADESOLA ST'],['CITY:','VICTORIA ISLAND']].map(([l,v])=>(
            <div key={l} className={styles.t7InfoRow}><span className={styles.t7InfoKey}>{l}</span><span className={styles.t7InfoVal}>{v}</span></div>
          ))}
        </div>
      </div>
      <div className={styles.t7Divider} />
      <div className={styles.t7ForLabel}>FOR:</div>
      <div className={styles.t7TableHead}>
        <span className={styles.t7NumCol}>No.</span>
        <span style={{ flex: 3 }}>Description</span>
        <span style={{ flex:1,textAlign:'right' }}>Qty</span>
        <span style={{ flex:1,textAlign:'right' }}>Price</span>
        <span style={{ flex:1,textAlign:'right' }}>Total</span>
      </div>
      {NUMBERED_ROWS.map(([n,d,q,p,t])=>(
        <div key={n} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{n}</span>
          <span style={{ flex:3 }}>{d}</span>
          <span style={{ flex:1,textAlign:'right' }}>{q}</span>
          <span style={{ flex:1,textAlign:'right' }}>{p}</span>
          <span className={styles.t7RedPrice}>{t}</span>
        </div>
      ))}
      <div className={styles.t7TotalBar}>
        <span>RECEIVED:</span>
        <span className={styles.t7TotalAmt}>{rFmt('56200')}</span>
      </div>
    </div>
  )
}

// Receipt 8 — Integrated Summary Box (full bottom: client box + payment + totals + sign)
function RGreenAccentPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t8Base}>
      <div className={styles.t8Header}>
        <div className={styles.t8LogoArea}>
          <span className="mi" style={{ fontSize: 20, color: '#333' }}>checkroom</span>
          <div>
            <div className={styles.t8BrandName}>{b.name}</div>
            <div className={styles.t8BrandSub}>TAILORING STUDIO</div>
          </div>
        </div>
        <div className={styles.t8InvoiceBox}>
          <div className={styles.t8InvoiceTitle}>RECEIPT</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Receipt#</span><span>{r.number}</span>
            <span>Date</span><span>{r.date}</span>
          </div>
        </div>
      </div>
      <div className={styles.t8TableHead}>
        <span>SL.</span>
        <span style={{ flex:3 }}>Description</span>
        <span>Price</span><span>Qty</span><span>Total</span>
      </div>
      {TAILOR_ROWS.map(([d,p,q,t],i)=>(
        <div key={d} className={styles.t8TableRow}>
          <span>{i+1}</span>
          <span style={{ flex:3 }}>{d}</span>
          <span>{p}</span><span>{q}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t8Divider} />
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox}>
          <div className={styles.t8GreenBoxTitle}>Received from:</div>
          <div className={styles.t8GreenBoxName}>{c.name}</div>
          <div className={styles.t8GreenBoxAddr}>{c.phone}<br />{c.address}</div>
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Terms &amp; Conditions</div>
          <div className={styles.t8GreenBoxAddr}>All garments collected within 30 days of completion.</div>
        </div>
        <div className={styles.t8PaymentInfo}>
          <div className={styles.t8PayLabel}>Payment Received via:</div>
          <div>Account #: 0123 4567 89</div>
          <div>A/C Name: {b.name}</div>
          <div>Bank: GT Bank Nigeria</div>
          <div className={styles.t8ThankYou}>{b.footer}</div>
        </div>
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Sub Total:</span><span>₦56,200</span></div>
          <div className={styles.t8TotRow}><span>Tax:</span><span>0.00%</span></div>
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}><span>Received:</span><span>{rFmt('56200')}</span></div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}

// Receipt 9 — Accent Strip and Signature (footer with thank you + signature, same as invoice)
function RTealGeometricPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t9Base}>
      <div className={styles.t9Header}>
        <div>
          <div className={styles.t9LogoRow}>
            <span className="mi" style={{ fontSize:14,color:'#333' }}>checkroom</span>
            <span className={styles.t9CompanyName}>{b.name.toUpperCase()}</span>
          </div>
          <div className={styles.t9CompanySub}>TAILORING STUDIO</div>
          <div className={styles.t9CompanyAddr}>{b.address}</div>
        </div>
        <div className={styles.t9InvoiceTitle}>RECEIPT</div>
      </div>
      <div className={styles.t9NumBar}>
        <span>RECEIPT # {r.number}</span><span>|</span><span>DATE: {r.date}</span>
      </div>
      <div className={styles.t9BillShip}>
        <div>
          <span className={styles.t9BillLabel}>Received from:</span>
          <div><strong>{c.name}</strong></div>
          <div>{c.phone}</div>
        </div>
        <div>
          <span className={styles.t9BillLabel}>Received by:</span>
          <div><strong>{b.name}</strong></div>
          <div>{b.phone}</div>
        </div>
      </div>
      <div className={styles.t9TableHead}>
        <span>QTY</span>
        <span style={{ flex:3 }}>DESCRIPTION</span>
        <span>PRICE</span><span>TOTAL</span>
      </div>
      {[['1','Custom Agbada Sewing','₦8,500','₦8,500'],['2','Senator Suit Stitching','₦6,200','₦12,400'],['3','Ankara Dress Alteration','₦2,500','₦7,500'],['1','Bridal Gown Fitting','₦15,000','₦15,000']].map(([q,d,p,t])=>(
        <div key={d} className={styles.t9TableRow}>
          <span>{q}</span><span style={{ flex:3 }}>{d}</span><span>{p}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t9SubArea}>
        <div className={styles.t9SubRow}><span>Subtotal</span><span>₦43,400</span></div>
        <div className={styles.t9SubRow}><span>Tax</span><span>0.00%</span></div>
      </div>
      <div className={styles.t9TotalBar}><span>AMOUNT RECEIVED</span><span>{rFmt('56200')}</span></div>
      <div className={styles.t9Footer}>
        <div>
          <div className={styles.t9ThankYou}>{b.footer.toUpperCase()}</div>
          <div className={styles.t9PayNote}>Payment received on {r.date}.</div>
        </div>
        <div className={styles.t9SignArea}>
          <div className={styles.t9SignLine} />
          <div className={styles.t9SignLabel}>Signature</div>
        </div>
      </div>
      <div className={styles.t9CornerDeco} />
    </div>
  )
}

// Receipt 10 — Slanted Geometric (full bottom: payment info + totals + sign block + corner)
function RPinkDiagonalPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t10Base}>
      <div className={styles.t10HeaderZone}>
        <div className={styles.t10FullBanner}>
          <span className={styles.t10BannerTitle}>RECEIPT</span>
        </div>
        <div className={styles.t10BrandInBanner}>
          <span className="mi" style={{ fontSize:14,color:'#333' }}>checkroom</span>
          <div>
            <div className={styles.t10BrandName}>{b.name}</div>
            <div className={styles.t10BrandSub}>TAILORING STUDIO</div>
          </div>
        </div>
      </div>
      <div className={styles.t10MetaRow}>
        <div>
          <div className={styles.t10MetaLabel}>Received from:</div>
          <div className={styles.t10MetaName}>{c.name}</div>
          <div className={styles.t10MetaAddr}>{c.phone}<br />{c.address}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div><span className={styles.t10MetaKey}>Receipt#</span> <strong>{r.number}</strong></div>
          <div><span className={styles.t10MetaKey}>Date</span> <strong>{r.date}</strong></div>
        </div>
      </div>
      <div className={styles.t10TableHead}>
        <span>SL.</span>
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
          <div className={styles.t10ThankYou}>{b.footer}</div>
          <div className={styles.t10PayLabel}>Payment Received via:</div>
          <div className={styles.t10PayInfo}>
            Account #: 0123 4567 89<br />
            A/C Name: {b.name}<br />
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
            <div className={styles.t10TotTotal}><span>Received:</span><span>{rFmt('56200')}</span></div>
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

// Receipt 11 — Multi-Tile Payment Grid (full payment tiles + thank you, same as invoice)
function RBlueCleanPreview() {
  const r = RECEIPT_SAMPLE; const c = RECEIPT_SAMPLE_CUSTOMER; const b = RECEIPT_BRAND_SAMPLE
  return (
    <div className={styles.t11Base}>
      <div className={styles.t11TopBar}>
        <div className={styles.t11LogoArea}>
          <div className={styles.t11LogoHex}>
            <span className="mi" style={{ fontSize:11,color:'#fff' }}>checkroom</span>
          </div>
          <div>
            <div className={styles.t11CompanyName}>{b.name.toUpperCase()}</div>
            <div className={styles.t11CompanySub}>Tailoring Studio</div>
          </div>
        </div>
        <div className={styles.t11CompanyInfo}>
          <div>{b.address}</div>
        </div>
        <div className={styles.t11CompanyInfo} style={{ textAlign:'right' }}>
          <div>{b.website}</div>
          <div>{b.email}</div>
          <div>{b.phone}</div>
        </div>
      </div>
      <div className={styles.t11InvoiceTitle}>Receipt</div>
      <div className={styles.t11BlueBar}>
        <span>RECEIPT: #{r.number}</span>
        <span>DATE: {r.date}</span>
        <span>AMOUNT: {rFmt('56200')}</span>
      </div>
      <div className={styles.t11IssuedRow}>
        <div>
          <div className={styles.t11IssuedLabel}>RECEIVED FROM</div>
          <div>{c.name}</div>
          <div>{c.phone}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className={styles.t11AmountLabel}>AMOUNT PAID</div>
          <div className={styles.t11AmountVal}>{rFmt('56200')}</div>
        </div>
      </div>
      <div className={styles.t11ProjectName}>Payment for Tailoring Services</div>
      <div className={styles.t11TableHead}>
        <span style={{ flex:3 }}>Description</span>
        <span>Qty</span><span>Price</span><span>Subtotal</span>
      </div>
      {TAILOR_ROWS.map(([d,p,q,t])=>(
        <div key={d} className={styles.t11TableRow}>
          <span style={{ flex:3 }}>• {d}</span>
          <span>{q}</span><span>{p}</span><span>{t}</span>
        </div>
      ))}
      <div className={styles.t11TotArea}>
        <div className={styles.t11TotRow}><span>Subtotal</span><span>₦56,200</span></div>
        <div className={styles.t11TotRow}><span>Tax 0.00%</span><span>₦0</span></div>
        <div className={styles.t11TotBold}><span>TOTAL RECEIVED</span><span>{rFmt('56200')}</span></div>
      </div>
      <div className={styles.t11PayTitle}>Payment Received via</div>
      <div className={styles.t11PayBoxRow}>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Bank Transfer</div>
          <div>GT Bank Nigeria<br />{b.name}<br />Acct: 0123456789</div>
        </div>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Mobile Money</div>
          <div>OPay: 0801 234 5678<br />Palmpay: 0803 987 6543<br />{b.ownerName}</div>
        </div>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Cash / Other</div>
          <div>Collected at studio<br />14 Bode Thomas St<br />Surulere, Lagos</div>
        </div>
      </div>
      <div className={styles.t11ThankYou}>THANK YOU!</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Receipt Template Groups (same order and grouping as invoice)
// ─────────────────────────────────────────────────────────────

const RECEIPT_TEMPLATE_GROUPS = [
  {
    groupLabel: 'Simple and Clean',
    groupDesc: 'Light, open layouts that are easy to read',
    templates: [
      { id:'editable',  label:'1. Centered Balance',    desc:'Business name in the middle with a line on each side',  Component: REditablePreview },
      { id:'free',      label:'2. Triple-Box Info Bar', desc:'Three side-by-side boxes showing contact details',       Component: RFreePreview },
      { id:'printable', label:'4. Dual-Column Compact', desc:'From and To details placed side by side',                Component: RPrintablePreview },
    ],
  },
  {
    groupLabel: 'Bold Blocks',
    groupDesc: 'Strong designs that use solid colour sections',
    templates: [
      { id:'custom',       label:'3. Full-Bleed Banner',    desc:'Big colour header at the top with a logo space',     Component: RCustomPreview },
      { id:'canva',        label:'5. Solid Top and Bottom', desc:'Colour fills both the top header and the base',      Component: RCanvaPreview },
      { id:'pinkdiagonal', label:'10. Slanted Header',      desc:'Header cuts diagonally with a matching corner fill', Component: RPinkDiagonalPreview },
    ],
  },
  {
    groupLabel: 'Clear Labels',
    groupDesc: 'Every section has a bold label so nothing is confusing',
    templates: [
      { id:'redbold',     label:'7. Full Field Labels',    desc:'Sender and receiver details listed with bold labels',       Component: RRedBoldPreview },
      { id:'greenaccent', label:'8. Side Summary Box',     desc:'A dedicated box on the side holds totals and client details', Component: RGreenAccentPreview },
    ],
  },
  {
    groupLabel: 'Info Strip',
    groupDesc: 'Packs in your business details without clutter',
    templates: [
      { id:'darkheader',    label:'6. Three-Column Details', desc:'Payment, delivery, and billing info in one row',       Component: RDarkHeaderPreview },
      { id:'tealgeometric', label:'9. Strip and Signature',  desc:'Slim info bar at the top with a sign line at the base', Component: RTealGeometricPreview },
    ],
  },
  {
    groupLabel: 'Payment Options',
    groupDesc: 'Shows all the ways your customer can pay you',
    templates: [
      { id:'blueclean', label:'11. Payment Tiles', desc:'Separate boxes for bank transfer, mobile money, and cash', Component: RBlueCleanPreview },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Template Modal
// ─────────────────────────────────────────────────────────────

function TemplateModal({ isOpen, currentTemplate, colourId, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'editable')
  const [activeTab, setActiveTab] = useState('invoice')
  const modalRef = useRef(null)
  useBrandTokens(colourId, modalRef)

  if (!isOpen) return null

  const groups = activeTab === 'invoice' ? TEMPLATE_GROUPS : RECEIPT_TEMPLATE_GROUPS

  return (
    <div className={styles.fullOverlay} ref={modalRef}>
      <Header type="back" title="Templates" onBackClick={onClose} customActions={[{label:'Select',onClick:()=>{onSelect(selected);onClose()}}]} />
      <div className={styles.tabBar}>
        <button className={`${styles.tabBtn} ${activeTab==='invoice'?styles.tabBtnActive:''}`} onClick={()=>setActiveTab('invoice')}>
          <span className="mi" style={{ fontSize:'1rem' }}>receipt_long</span>
          Invoice
        </button>
        <button className={`${styles.tabBtn} ${activeTab==='receipt'?styles.tabBtnActive:''}`} onClick={()=>setActiveTab('receipt')}>
          <span className="mi" style={{ fontSize:'1rem' }}>payments</span>
          Receipt
        </button>
      </div>
      <div className={styles.fullContent}>
        {groups.map((group, groupIndex) => (
          <div key={group.groupLabel}>
            <div className={`${styles.groupHeader} ${groupIndex === 0 ? styles.groupHeaderFirst : ''}`}>
              <div className={styles.groupHeaderInner}>
                <span className={styles.groupLabel}>{group.groupLabel}</span>
                {group.groupDesc && <span className={styles.groupDesc}>{group.groupDesc}</span>}
              </div>
            </div>
            {group.templates.map(t=>(
              <div key={t.id} className={styles.templateWrapper} onClick={()=>setSelected(t.id)}>
                <div className={`${styles.fullPreviewContainer} ${selected===t.id?styles.fullPreviewActive:''}`}>
                  <t.Component />
                </div>
                <div className={styles.templateInfo}>
                  <div className={`${styles.radio} ${selected===t.id?styles.radioActive:''}`} />
                  <div className={styles.templateLabelGroup}>
                    <span className={styles.templateLabel}>{t.label}</span>
                    {t.desc && <span className={styles.templateDesc}>{t.desc}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Receipt Settings Modal
// ─────────────────────────────────────────────────────────────

function ReceiptSettingsModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    receiptPrefix:  settings.receiptPrefix  ?? 'RCP',
    receiptFooter:  settings.receiptFooter  ?? '',
    receiptShowTax: settings.receiptShowTax ?? false,
    receiptTaxRate: settings.receiptTaxRate ?? 0,
  })
  const set = key => val => setLocal(p=>({...p,[key]:val}))
  const save = () => { updateMany(local); showToast('Receipt settings saved'); onBack() }
  return (
    <FullModal title="Receipt Settings" onBack={onBack} onSave={save}>
      <div>
        <FieldGroup>
          <Field label="Receipt Number Prefix" hint="Shown before the number, e.g. RCP-0001.">
            <TextInput value={local.receiptPrefix} onChange={set('receiptPrefix')} placeholder="RCP" />
          </Field>
        </FieldGroup>
        <div style={{ height:12 }} />
        <FieldGroup>
          <div className={styles.row} style={{ borderBottom: local.receiptShowTax?'1px solid var(--border)':'none' }}>
            <div className={styles.rowIcon}><span className="mi" style={{ fontSize:'1.15rem' }}>percent</span></div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Show Tax Line</div>
              <div className={styles.rowSub}>Add a VAT / tax row to receipt totals</div>
            </div>
            <div className={styles.rowRight}><Toggle value={local.receiptShowTax} onChange={v=>set('receiptShowTax')(v)} /></div>
          </div>
          {local.receiptShowTax && (
            <Field label="Tax Rate (%)" hint="e.g. 7.5 for 7.5% VAT">
              <TextInput type="number" value={String(local.receiptTaxRate)} onChange={v=>set('receiptTaxRate')(parseFloat(v)||0)} placeholder="7.5" />
            </Field>
          )}
        </FieldGroup>
        <div style={{ height:12 }} />
        <FieldGroup>
          <Field label="Receipt Footer Text" hint="Printed at the bottom of every receipt.">
            <Textarea value={local.receiptFooter} onChange={set('receiptFooter')} placeholder="Thank you for your payment 🙏" rows={3} />
          </Field>
        </FieldGroup>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Invoice Settings Modal
// ─────────────────────────────────────────────────────────────

function InvoiceSettingsModal({ onBack, showToast }) {
  const { settings, updateMany } = useSettings()
  const [local, setLocal] = useState({
    invoicePrefix:   settings.invoicePrefix,
    invoiceCurrency: settings.invoiceCurrency,
    invoiceDueDays:  settings.invoiceDueDays,
    invoiceShowTax:  settings.invoiceShowTax,
    invoiceTaxRate:  settings.invoiceTaxRate,
    invoiceFooter:   settings.invoiceFooter,
  })
  const set = key => val => setLocal(p=>({...p,[key]:val}))
  const save = () => { updateMany(local); showToast('Invoice settings saved'); onBack() }
  return (
    <FullModal title="Invoice Settings" onBack={onBack} onSave={save}>
      <div>
        <FieldGroup>
          <Field label="Invoice Number Prefix" hint="Shown before the number, e.g. INV-0042.">
            <TextInput value={local.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" />
          </Field>
          <Field label="Currency">
            <SegmentControl options={[{label:'₦ Naira',value:'₦'},{label:'$ Dollar',value:'$'},{label:'£ Pound',value:'£'},{label:'€ Euro',value:'€'}]} value={local.invoiceCurrency} onChange={set('invoiceCurrency')} />
          </Field>
          <Field label="Default Due Period" hint="Days after issue date the invoice is due.">
            <SegmentControl options={[{label:'3 days',value:3},{label:'7 days',value:7},{label:'14 days',value:14},{label:'30 days',value:30}]} value={local.invoiceDueDays} onChange={set('invoiceDueDays')} />
          </Field>
        </FieldGroup>
        <div style={{ height:12 }} />
        <FieldGroup>
          <div className={styles.row} style={{ borderBottom: local.invoiceShowTax?'1px solid var(--border)':'none' }}>
            <div className={styles.rowIcon}><span className="mi" style={{ fontSize:'1.15rem' }}>percent</span></div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Show Tax Line</div>
              <div className={styles.rowSub}>Add a VAT / tax row to invoice totals</div>
            </div>
            <div className={styles.rowRight}><Toggle value={local.invoiceShowTax} onChange={v=>set('invoiceShowTax')(v)} /></div>
          </div>
          {local.invoiceShowTax && (
            <Field label="Tax Rate (%)" hint="e.g. 7.5 for 7.5% VAT">
              <TextInput type="number" value={String(local.invoiceTaxRate)} onChange={v=>set('invoiceTaxRate')(parseFloat(v)||0)} placeholder="7.5" />
            </Field>
          )}
        </FieldGroup>
        <div style={{ height:12 }} />
        <FieldGroup>
          <Field label="Invoice Footer Text" hint="Printed at the bottom of every invoice.">
            <Textarea value={local.invoiceFooter} onChange={set('invoiceFooter')} placeholder="Thank you for your patronage 🙏" rows={3} />
          </Field>
        </FieldGroup>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Settings Page
// ─────────────────────────────────────────────────────────────

export default function Settings({ onMenuClick, isPremium=false, onUpgrade=()=>{} }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const { brand } = useBrand()
  const [toastMsg,setToastMsg]=useState('')
  const [templateModal,setTemplateModal]=useState(false)
  const [invoiceModal,setInvoiceModal]=useState(false)
  const [receiptModal,setReceiptModal]=useState(false)
  const [clearConfirm,setClearConfirm]=useState(false)
  const [resetConfirm,setResetConfirm]=useState(false)
  const toastTimer=useRef(null)
  const showToast=useCallback(msg=>{setToastMsg(msg);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToastMsg(''),2400)},[])
  const isDark=settings.theme==='dark'

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />
      <div className={styles.scrollArea}>
        <SectionHeader icon="palette" label="Appearance" />
        <SettingRow icon="dark_mode" label="Dark Mode" sub={isDark?'Dark theme active':'Light theme active'}>
          <Toggle value={isDark} onChange={v=>updateSetting('theme',v?'dark':'light')} />
        </SettingRow>

        <SectionHeader icon="receipt_long" label="Invoice / Receipt" />
        <SettingRow icon="tune" label="Invoice Settings" sub={`${settings.invoiceCurrency} · ${settings.invoicePrefix} · Due ${settings.invoiceDueDays}d`} onClick={()=>setInvoiceModal(true)} chevron />
        <SettingRow icon="request_quote" label="Receipt Settings" sub="Prefix, footer text and receipt defaults" onClick={()=>setReceiptModal(true)} chevron />
        <SettingRow icon="description" label="Templates" sub="Choose your preferred invoice and receipt designs" value={settings.invoiceTemplate} onClick={()=>setTemplateModal(true)} chevron />

        <SectionHeader icon="notifications" label="Notifications" />
        <SettingRow icon="alarm" label="Overdue Tasks" sub="Alert when tasks pass their due date">
          <Toggle value={settings.notifyOverdueTasks} onChange={v=>updateSetting('notifyOverdueTasks',v)} />
        </SettingRow>
        <SettingRow icon="cake" label="Customer Birthdays" sub="Remind you a day before">
          <Toggle value={settings.notifyUpcomingBirthdays} onChange={v=>updateSetting('notifyUpcomingBirthdays',v)} />
        </SettingRow>
        <SettingRow icon="money_off" label="Unpaid Invoices" sub="Alert for invoices past due date">
          <Toggle value={settings.notifyUnpaidInvoices} onChange={v=>updateSetting('notifyUnpaidInvoices',v)} />
        </SettingRow>

        <SectionHeader icon="storage" label="Data" />
        <SettingRow icon="restart_alt" label="Reset All Settings" sub="Restore defaults. Your customers and orders are safe." onClick={()=>setResetConfirm(true)} chevron danger />
        <SettingRow icon="delete_forever" label="Clear All Data" sub="Permanently delete everything" onClick={()=>setClearConfirm(true)} chevron divider={false} danger />
        <div style={{ height:32 }} />
      </div>

      <TemplateModal
        isOpen={templateModal}
        currentTemplate={settings.invoiceTemplate}
        colourId={brand.colourId}
        onClose={()=>setTemplateModal(false)}
        onSelect={v=>{updateSetting('invoiceTemplate',v);showToast('Template selected')}}
      />
      {invoiceModal&&<InvoiceSettingsModal onBack={()=>setInvoiceModal(false)} showToast={showToast} />}
      {receiptModal&&<ReceiptSettingsModal onBack={()=>setReceiptModal(false)} showToast={showToast} />}
      <ConfirmSheet open={clearConfirm} title="Delete All Data?" onConfirm={()=>{localStorage.clear();setClearConfirm(false);showToast('Cleared')}} onCancel={()=>setClearConfirm(false)} />
      <ConfirmSheet open={resetConfirm} title="Reset All Settings?" onConfirm={()=>{resetSettings();setResetConfirm(false);showToast('Settings reset')}} onCancel={()=>setResetConfirm(false)} />
      <Toast message={toastMsg} />
    </div>
  )
}
