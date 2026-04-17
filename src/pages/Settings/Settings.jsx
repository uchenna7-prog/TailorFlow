import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

// ─────────────────────────────────────────────────────────────
// Invoice template previews — ORIGINAL 4
// ─────────────────────────────────────────────────────────────

function EditableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pHeader}>
        <div className={styles.pBrandCenter}>
          <div className={styles.pBrandName}>Your Company Name</div>
          <div className={styles.pBrandSub}>123 Street Address, City, State, Zip Code</div>
        </div>
        <div className={styles.pLargeTitleCenter}>INVOICE</div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pMetaRow}>
          <div><strong>BILL TO:</strong><br />Customer Name<br />Street Address<br />City, State, Zip</div>
          <div style={{ textAlign: 'right' }}>
            Invoice #: <strong>0000001</strong><br />
            Issue Date: <strong>Date Field</strong><br />
            Due Date: <strong>Date Field</strong>
          </div>
        </div>
        <div className={styles.pTableModern}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={styles.pSumRow}><span>Tax</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}><strong>Payment Terms:</strong><br />Add your payment terms such as bank details.</div>
        <div className={styles.pFootSection}><strong>Notes:</strong><br />Add any additional notes.</div>
      </div>
    </div>
  )
}

function PrintableTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pGoldBarFull} />
      <div className={styles.pHeaderSplit}>
        <div className={styles.pLargeTitle}>INVOICE</div>
        <div className={styles.pMetaRight}>
          <div>ISSUE DATE: <strong>Date Field</strong></div>
          <div>DUE DATE: <strong>Date Field</strong></div>
          <div>INVOICE #: <strong>0000001</strong></div>
        </div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pMetaRow} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <div><strong>BILL FROM:</strong><br />Your Company Name<br />Street Address<br />Phone Number</div>
          <div style={{ textAlign: 'right' }}><strong>BILL TO:</strong><br />Customer Name<br />Street Address<br />City, State, Zip</div>
        </div>
        <div className={styles.pTableModern} style={{ marginTop: '20px' }}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummarySide}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={styles.pSumRow}><span>Tax</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pTotalBox}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pFooter}>
        <div className={styles.pFootSection}><strong>Payment Terms:</strong><br />Bank Name, Account #</div>
      </div>
    </div>
  )
}

function CustomTemplate() {
  return (
    <div className={styles.pBase} style={{ padding: 0 }}>
      <div className={styles.pPurpleBanner}>
        <div className={styles.pLogoBoxWhite}>Place logo here</div>
        <div className={styles.pLargeTitleWhite}>INVOICE</div>
        <div className={styles.pWhiteNo}>0000001</div>
      </div>
      <div className={styles.pBody} style={{ padding: '20px' }}>
        <div className={styles.pMetaRow}>
          <div><strong>BILL FROM:</strong><br />Your Company Name</div>
          <div><strong>BILL TO:</strong><br />Customer Name</div>
          <div style={{ textAlign: 'right' }}><strong>DATE:</strong><br />Date Field</div>
        </div>
        <div className={styles.pTableModern} style={{ marginTop: '20px' }}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pPurpleBottom}>
        <div className={styles.pFootSectionWhite}><strong>Payment Terms:</strong> Add details here</div>
      </div>
    </div>
  )
}

function FreeTemplate() {
  return (
    <div className={styles.pBase}>
      <div className={styles.pHeaderFree}>
        <div className={styles.pTitleBlock}>
          <div className={styles.pLargeTitle}>INVOICE</div>
          <div className={styles.pSubNo}>0000001</div>
        </div>
        <div className={styles.pLogoPlaceholderBig}>ADD YOUR LOGO</div>
      </div>
      <div className={styles.pFreeGrid}>
        <div className={styles.pFreeBox}><strong>BILL FROM:</strong><br />Your Company Name<br />Address<br />Phone</div>
        <div className={styles.pFreeBox}><strong>BILL TO:</strong><br />Customer Name<br />Address</div>
        <div className={styles.pFreeBox}><strong>DETAILS:</strong><br />Issue: Date<br />Due: Date</div>
      </div>
      <div className={styles.pBody}>
        <div className={styles.pTableModern}>
          <div className={styles.pTHead}><span>Description</span><span>Price</span><span>QTY</span><span>Total</span></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.pTRow}><span>Line Item & Description</span><span>$0.00</span><span>1</span><span>$0.00</span></div>
          ))}
        </div>
        <div className={styles.pSummary}>
          <div className={styles.pSumRow}><span>Subtotal</span><span>$0.00</span></div>
          <div className={`${styles.pSumRow} ${styles.pBold}`}><span>Total Due</span><span>$0.00</span></div>
        </div>
      </div>
      <div className={styles.pFooterGray}>Thank you for your business!</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 5 — Canva-style minimal warm beige (Image 1)
// Large bold "Invoice" top-left, billed-to info, rate/hours/amount table
// ─────────────────────────────────────────────────────────────

function CanvaTemplate() {
  return (
    <div className={styles.t5Base}>
      <div className={styles.t5Top}>
        <div className={styles.t5Title}>Invoice</div>
        <div className={styles.t5TopRight}>
          <div>16 June 2025</div>
          <div><strong>Invoice No. 12345</strong></div>
        </div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5BilledTo}>
        <div className={styles.t5BilledLabel}>Billed to:</div>
        <div>Customer Name</div>
        <div>+123-456-7890</div>
        <div>63 Ivy Road, Hawkville, GA, USA</div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5TableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>Rate</span>
        <span>Hours</span>
        <span>Amount</span>
      </div>
      {[
        ['Copy Writing', '$50/hr', '5', '$250'],
        ['Website Design', '$100/hr', '15', '$1500'],
        ['Website Development', '$100/hr', '10', '$1000'],
      ].map(([desc, rate, hrs, amt]) => (
        <div key={desc} className={styles.t5TableRow}>
          <span style={{ flex: 3 }}>{desc}</span>
          <span>{rate}</span>
          <span>{hrs}</span>
          <span>{amt}</span>
        </div>
      ))}
      <div className={styles.t5Divider} />
      <div className={styles.t5Totals}>
        <div className={styles.t5TotRow}><span>Subtotal</span><span>$2750</span></div>
        <div className={styles.t5TotRow}><span>Tax (0%)</span><span>$0</span></div>
        <div className={`${styles.t5TotRow} ${styles.t5TotBold}`}><span>Total</span><span>$2750</span></div>
      </div>
      <div className={styles.t5Divider} />
      <div className={styles.t5Footer}>
        <div>
          <div className={styles.t5FootLabel}>Payment Information</div>
          <div>Studio Shodwe</div>
          <div>Bank: Really Great Bank</div>
          <div>Account No: 0123 4567 8901</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>Samira Hadid</strong></div>
          <div>123 Anywhere St, Any City, ST 12345</div>
          <div>+123-456-7890</div>
          <div>hello@reallygreatsite.com</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 6 — Dark header corporate (Image 2)
// Black top bar with logo+company info, bold invoice # left, date/total right
// Payment (bank + PayPal), Ship To, Bill To columns, dark table header, totals
// ─────────────────────────────────────────────────────────────

function DarkHeaderTemplate() {
  return (
    <div className={styles.t6Base}>
      {/* Dark top bar */}
      <div className={styles.t6Header}>
        <div className={styles.t6LogoArea}>
          <div className={styles.t6LogoCircle}>LOGO</div>
          <div>
            <div className={styles.t6CompanyName}>COMPANY NAME</div>
            <div className={styles.t6CompanySub}>SOME SUBTITLE HERE</div>
          </div>
        </div>
        <div className={styles.t6HeaderRight}>
          <div>Company Name</div>
          <div>Street Address and num</div>
          <div>City Name</div>
          <div>ZIP Code</div>
        </div>
        <div className={styles.t6HeaderRight}>
          <div>+450 560 15 02 23</div>
          <div>+450 560 22 84 31</div>
          <div>www.domain.xxx</div>
          <div>info@domain.xxx</div>
        </div>
      </div>
      {/* Invoice number row */}
      <div className={styles.t6InvoiceRow}>
        <div className={styles.t6InvoiceLeft}>
          <span className={styles.t6InvoiceWord}>INVOICE </span>
          <span className={styles.t6InvoiceNum}>#156879</span>
        </div>
        <div className={styles.t6InvoiceRight}>
          <div><span className={styles.t6Label}>DATE:</span> 01/01/2017</div>
          <div><span className={styles.t6Label}>TOTAL:</span> $114.56</div>
        </div>
      </div>
      {/* Three-column info */}
      <div className={styles.t6InfoRow}>
        <div>
          <div className={styles.t6InfoLabel}>PAYMENT:</div>
          <div><strong>BANK ACCOUNT</strong></div>
          <div>Bank full name</div>
          <div>Bank code</div>
          <div>SWIFT / IBAN</div>
          <div style={{ marginTop: 4 }}><strong>PAYPAL</strong></div>
          <div>email@domain.xxx</div>
        </div>
        <div>
          <div className={styles.t6InfoLabel}>SHIP TO:</div>
          <div>Company Name</div>
          <div>Street address</div>
          <div>City, ZIP code</div>
        </div>
        <div>
          <div className={styles.t6InfoLabel}>BILL TO:</div>
          <div>Company Name</div>
          <div>Street address</div>
          <div>City, ZIP code</div>
        </div>
      </div>
      {/* Table */}
      <div className={styles.t6TableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span>
        <span>QTY</span>
        <span>PRICE</span>
        <span>ITEM TOTAL</span>
      </div>
      {[
        ['Lorem ipsum dolor', '2', '$20.00', '$40.00'],
        ['Candus et spiritus et amor', '1', '$15.00', '$15.00'],
        ['Doromites etume tuna tautka', '6', '$7.00', '$42.00'],
      ].map(([d, q, p, t]) => (
        <div key={d} className={styles.t6TableRow}>
          <span style={{ flex: 3 }}>{d}</span>
          <span>{q}</span>
          <span>{p}</span>
          <span>{t}</span>
        </div>
      ))}
      {/* Totals */}
      <div className={styles.t6TotalsArea}>
        <div className={styles.t6TotRow}><span>SUBTOTAL</span><span>$97.00</span></div>
        <div className={styles.t6TotRow}><span>SHIPPING</span><span>$12.00</span></div>
        <div className={styles.t6TotRow}><span>TAX RATE</span><span>$5.56</span></div>
        <div className={styles.t6TotTotal}><span>TOTAL</span><span>$114.56</span></div>
      </div>
      <div className={styles.t6ThankYou}>THANK YOU FOR YOUR BUSINESS</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 7 — Red wrench logo bold (Image 3)
// Bold "INVOICE #0079" header, large FROM/TO grids, numbered line items
// ─────────────────────────────────────────────────────────────

function RedBoldTemplate() {
  return (
    <div className={styles.t7Base}>
      {/* Header */}
      <div className={styles.t7Header}>
        <div className={styles.t7LogoCircle}>⚙</div>
        <div className={styles.t7TitleGroup}>
          <span className={styles.t7InvoiceWord}>INVOICE</span>
          <span className={styles.t7InvoiceNum}>#0079</span>
        </div>
        <div className={styles.t7DateBlock}>
          <div className={styles.t7DateLabel}>DATE:</div>
          <div className={styles.t7DateVal}>NOVEMBER 24, 2024</div>
        </div>
      </div>
      <div className={styles.t7Divider} />
      {/* FROM / TO */}
      <div className={styles.t7FromTo}>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7FromLabel}>FROM:</div>
          <div className={styles.t7FromDivider} />
          {[['NAME:', 'YOUR NAME'], ['COMPANY:', 'YOURCOMPANY'], ['ADDRESS:', '1234 STREETNAME'], ['CITY, STATE:', 'BIGCITY, STATE'], ['ZIP, COUNTRY:', '1234567, USA'], ['PHONE:', '(123) 123-4567']].map(([l, v]) => (
            <div key={l} className={styles.t7InfoRow}><span className={styles.t7InfoKey}>{l}</span><span className={styles.t7InfoVal}>{v}</span></div>
          ))}
        </div>
        <div className={styles.t7FromToBlock}>
          <div className={styles.t7ToLabel}>TO:</div>
          <div className={styles.t7FromDivider} />
          {[['NAME:', 'CLIENT NAME'], ['COMPANY:', 'CLIENTCOMPANY'], ['ADDRESS:', '9876 STREETNAME'], ['CITY, STATE:', 'BIGGERCITY, STATE'], ['ZIP, COUNTRY:', '768912, USA'], ['PHONE:', '(321) 6754-123']].map(([l, v]) => (
            <div key={l} className={styles.t7InfoRow}><span className={styles.t7InfoKey}>{l}</span><span className={styles.t7InfoVal}>{v}</span></div>
          ))}
        </div>
      </div>
      <div className={styles.t7Divider} />
      {/* For: table */}
      <div className={styles.t7ForLabel}>FOR:</div>
      <div className={styles.t7TableHead}>
        <span className={styles.t7NumCol}>Num.</span>
        <span style={{ flex: 3 }}>Goods, Services</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span>Price</span>
      </div>
      {[
        ['1', 'SOME SERVICE', '1', '29.99', '29.99'],
        ['2', 'ITEM SOLD', '1', '45.00', '45.00'],
        ['3', 'ANOTHER SERVICE', '1', '55.00', '55.00'],
      ].map(([n, d, q, u, p]) => (
        <div key={n} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{n}</span>
          <span style={{ flex: 3 }}>{d}</span>
          <span>{q}</span>
          <span>{u}</span>
          <span className={styles.t7RedPrice}>{p}</span>
        </div>
      ))}
      {/* Empty rows */}
      {[4,5,6].map(n => (
        <div key={n} className={styles.t7TableRow}>
          <span className={styles.t7NumCol}>{n}</span>
          <span style={{ flex: 3 }}></span><span></span><span></span><span></span>
        </div>
      ))}
      {/* Total */}
      <div className={styles.t7TotalBar}>
        <span>TOTAL:</span>
        <span className={styles.t7TotalAmt}>$129<sup>.99</sup></span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 8 — Green accent brand (Image 4)
// Logo top-left, green INVOICE box top-right, line items table,
// green "Invoice to" box bottom-left, payment info, totals
// ─────────────────────────────────────────────────────────────

function GreenAccentTemplate() {
  return (
    <div className={styles.t8Base}>
      {/* Header */}
      <div className={styles.t8Header}>
        <div className={styles.t8LogoArea}>
          <div className={styles.t8LogoIcon}>◇</div>
          <div>
            <div className={styles.t8BrandName}>Brand Name</div>
            <div className={styles.t8BrandSub}>TAGLINE SPACE HERE</div>
          </div>
        </div>
        <div className={styles.t8InvoiceBox}>
          <div className={styles.t8InvoiceTitle}>INVOICE</div>
          <div className={styles.t8InvoiceMeta}>
            <span>Invoice#</span><span>52148</span>
            <span>Date</span><span>01 / 02 / 2020</span>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className={styles.t8TableHead}>
        <span>SL.</span>
        <span style={{ flex: 3 }}>Item Description</span>
        <span>Price</span>
        <span>Qty.</span>
        <span>Total</span>
      </div>
      {[
        ['1', 'Item Description Here', '$50.00', '1', '$50.00'],
        ['2', 'Item Description Here', '$20.00', '3', '$60.00'],
        ['3', 'Item Description Here', '$10.00', '2', '$20.00'],
        ['4', 'Item Description Here', '$90.00', '1', '$90.00'],
      ].map(([n, d, p, q, t]) => (
        <div key={n} className={styles.t8TableRow}>
          <span>{n}</span>
          <span style={{ flex: 3 }}>{d}</span>
          <span>{p}</span>
          <span>{q}</span>
          <span>{t}</span>
        </div>
      ))}
      <div className={styles.t8Divider} />
      {/* Bottom section */}
      <div className={styles.t8Bottom}>
        <div className={styles.t8GreenBox}>
          <div className={styles.t8GreenBoxTitle}>Invoice to:</div>
          <div className={styles.t8GreenBoxName}>Customer Name</div>
          <div className={styles.t8GreenBoxAddr}>24 Dummy Street Area,<br />Location, Lorem Ipsum.</div>
          <div className={styles.t8GreenDivider} />
          <div className={styles.t8GreenBoxTitle}>Terms &amp; Conditions</div>
          <div className={styles.t8GreenBoxAddr}>Lorem ipsum dolor sit amet, consectetur adipiscing.</div>
        </div>
        <div className={styles.t8PaymentInfo}>
          <div className={styles.t8PayLabel}>Payment Info:</div>
          <div>Account #: 1234 5678 9012</div>
          <div>A/C Name: Lorem Ipsum</div>
          <div>Bank Details: Add your details</div>
          <div className={styles.t8ThankYou}>Thank you for your business</div>
        </div>
        <div className={styles.t8Totals}>
          <div className={styles.t8TotRow}><span>Sub Total:</span><span>$220.00</span></div>
          <div className={styles.t8TotRow}><span>Tax:</span><span>0.00%</span></div>
          <div className={styles.t8TotDivider} />
          <div className={styles.t8TotTotal}><span>Total:</span><span>$220.00</span></div>
          <div className={styles.t8SignLine}>Authorised Sign</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 9 — Teal geometric (Image 5)
// Logo + big "INVOICE" top, teal invoice # bar, bill-to/ship-to,
// teal table header, items, dark TOTAL bar, signature, teal corner graphic
// ─────────────────────────────────────────────────────────────

function TealGeometricTemplate() {
  return (
    <div className={styles.t9Base}>
      {/* Header */}
      <div className={styles.t9Header}>
        <div>
          <div className={styles.t9LogoRow}>
            <span className={styles.t9LogoIcon}>◇</span>
            <span className={styles.t9CompanyName}>CREATIVE MEDIA</span>
          </div>
          <div className={styles.t9CompanySub}>YOUR COMPANY TAGLINE HERE</div>
          <div className={styles.t9CompanyAddr}>A- Unknown Area,<br />Lorem, Ipsum Dolor,<br />845xx145</div>
        </div>
        <div className={styles.t9InvoiceTitle}>INVOICE</div>
      </div>
      <div className={styles.t9NumBar}>
        <span>INVOICE # 24856</span>
        <span>|</span>
        <span>DATE: 01 / 02 / 2020</span>
      </div>
      {/* Bill to / Ship to */}
      <div className={styles.t9BillShip}>
        <div>
          <span className={styles.t9BillLabel}>Bill to:</span>
          <div><strong>Customer Name</strong></div>
          <div>24 Dummy Street Area,</div>
          <div>Location, Lorem Ipsum, 570xx59x</div>
        </div>
        <div>
          <span className={styles.t9BillLabel}>Ship to:</span>
          <div><strong>Customer Name</strong></div>
          <div>24 Dummy Street Area,</div>
          <div>Location, Lorem Ipsum, 570xx59x</div>
        </div>
      </div>
      {/* Table */}
      <div className={styles.t9TableHead}>
        <span>QTY</span>
        <span style={{ flex: 3 }}>PRODUCT DESCRIPTION</span>
        <span>PRICE</span>
        <span>TOTAL</span>
      </div>
      {[
        ['5', 'Item Description', '$50.00', '$250.00'],
        ['1', 'Item Description', '$10.00', '$10.00'],
        ['3', 'Item Description', '$25.00', '$75.00'],
        ['2', 'Item Description', '$40.00', '$80.00'],
      ].map(([q, d, p, t]) => (
        <div key={d + q} className={styles.t9TableRow}>
          <span>{q}</span>
          <span style={{ flex: 3 }}>{d}</span>
          <span>{p}</span>
          <span>{t}</span>
        </div>
      ))}
      {/* Subtotals */}
      <div className={styles.t9SubArea}>
        <div className={styles.t9SubRow}><span>Subtotal</span><span>$415.00</span></div>
        <div className={styles.t9SubRow}><span>Tax Rate</span><span>0.00%</span></div>
      </div>
      <div className={styles.t9TotalBar}>
        <span>TOTAL</span><span>$415.00</span>
      </div>
      {/* Footer */}
      <div className={styles.t9Footer}>
        <div>
          <div className={styles.t9ThankYou}>THANK YOU FOR YOUR BUSINESS</div>
          <div className={styles.t9PayNote}>Payment is due max 7 days after invoice without deduction.</div>
        </div>
        <div className={styles.t9SignArea}>
          <div className={styles.t9SignLine} />
          <div className={styles.t9SignLabel}>Signature</div>
        </div>
      </div>
      {/* Teal corner decoration */}
      <div className={styles.t9CornerDeco} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 10 — Pink diagonal (Image 6)
// Bold pink diagonal banner top-left "INVOICE", brand name/logo top-right,
// invoice-to section, item table with bordered header,
// payment info, T&C, totals, pink corner bottom-right
// ─────────────────────────────────────────────────────────────

function PinkDiagonalTemplate() {
  return (
    <div className={styles.t10Base}>
      {/* Pink diagonal banner */}
      <div className={styles.t10BannerWrap}>
        <div className={styles.t10PinkBanner}>
          <span className={styles.t10BannerTitle}>INVOICE</span>
        </div>
        <div className={styles.t10BrandArea}>
          <div className={styles.t10BrandIcon}>◇</div>
          <div>
            <div className={styles.t10BrandName}>Brand Name</div>
            <div className={styles.t10BrandSub}>TAGLINE SPACE HERE</div>
          </div>
        </div>
      </div>
      {/* Invoice to + meta */}
      <div className={styles.t10MetaRow}>
        <div>
          <div className={styles.t10MetaLabel}>Invoice to:</div>
          <div className={styles.t10MetaName}>Customer Name</div>
          <div className={styles.t10MetaAddr}>24 Dummy Street Area,<br />Location, Lorem Ipsum,<br />570xx59x</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span className={styles.t10MetaKey}>Invoice#</span> <strong>52148</strong></div>
          <div><span className={styles.t10MetaKey}>Date</span> <strong>01 / 02 / 2020</strong></div>
        </div>
      </div>
      {/* Table */}
      <div className={styles.t10TableHead}>
        <span>SL.</span>
        <span style={{ flex: 3 }}>Item Description</span>
        <span>Price</span>
        <span>Qty.</span>
        <span>Total</span>
      </div>
      {[
        ['1', 'Item Description Here', '$50.00', '1', '$50.00'],
        ['2', 'Item Description Here', '$20.00', '3', '$60.00'],
        ['3', 'Item Description Here', '$10.00', '2', '$20.00'],
        ['4', 'Item Description Here', '$90.00', '1', '$90.00'],
      ].map(([n, d, p, q, t]) => (
        <div key={n} className={styles.t10TableRow}>
          <span>{n}</span>
          <span style={{ flex: 3 }}>{d}</span>
          <span>{p}</span>
          <span>{q}</span>
          <span>{t}</span>
        </div>
      ))}
      <div className={styles.t10Divider} />
      {/* Bottom */}
      <div className={styles.t10Bottom}>
        <div>
          <div className={styles.t10ThankYou}>Thank you for your business</div>
          <div className={styles.t10PayLabel}>Payment Info:</div>
          <div className={styles.t10PayInfo}>Account #: 1234 5678 9012<br />A/C Name: Lorem Ipsum<br />Bank Details: Add your bank details</div>
          <div className={styles.t10TCLabel}>Terms &amp; Conditions</div>
          <div className={styles.t10TCText}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
        </div>
        <div className={styles.t10TotalsWrap}>
          <div className={styles.t10TotRow}><span>Sub Total:</span><span>$220.00</span></div>
          <div className={styles.t10TotRow}><span>Tax:</span><span>0.00%</span></div>
          <div className={styles.t10TotDivider} />
          <div className={styles.t10TotTotal}><span>Total:</span><span>$220.00</span></div>
          <div className={styles.t10SignLine} />
          <div className={styles.t10SignLabel}>Authorised Sign</div>
        </div>
      </div>
      {/* Pink bottom-right corner */}
      <div className={styles.t10CornerPink} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 11 — Blue clean corporate (Image 7)
// Logo/company top, "Invoice" title, blue info bar (invoice#/date/due),
// issued-to with large blue amount, project table, payment boxes
// ─────────────────────────────────────────────────────────────

function BlueCleanTemplate() {
  return (
    <div className={styles.t11Base}>
      {/* Top company bar */}
      <div className={styles.t11TopBar}>
        <div className={styles.t11LogoArea}>
          <div className={styles.t11LogoHex}>LOGO</div>
          <div>
            <div className={styles.t11CompanyName}>COMPANY</div>
            <div className={styles.t11CompanySub}>Your Company Slogan</div>
          </div>
        </div>
        <div className={styles.t11CompanyInfo}>
          <div>Your Company Name</div>
          <div>123 Your Street Address</div>
          <div>City, CA 000000</div>
        </div>
        <div className={styles.t11CompanyInfo} style={{ textAlign: 'right' }}>
          <div>your company website</div>
          <div>your company email</div>
          <div>+ 000.000.0000</div>
        </div>
      </div>
      {/* Invoice title */}
      <div className={styles.t11InvoiceTitle}>Invoice</div>
      {/* Blue info bar */}
      <div className={styles.t11BlueBar}>
        <span>INVOICE: #100123</span>
        <span>DATE ISSUED: 11.12.2024</span>
        <span>DUE DATE: 11.12.2025</span>
      </div>
      {/* Issued to + amount */}
      <div className={styles.t11IssuedRow}>
        <div>
          <div className={styles.t11IssuedLabel}>ISSUED TO</div>
          <div>Some Company</div>
          <div>123 Client's Street</div>
          <div>Somewhere, CA 000000</div>
          <div>+ 000.000.0000</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.t11AmountLabel}>AMOUNT</div>
          <div className={styles.t11AmountVal}>$450.00</div>
        </div>
      </div>
      {/* Project section */}
      <div className={styles.t11ProjectName}>Project Name</div>
      <div className={styles.t11TableHead}>
        <span style={{ flex: 3 }}>Description</span>
        <span>Qty</span>
        <span>Rate</span>
        <span>Subtotal</span>
      </div>
      {[
        ['Service description here', '2', '$75', '$150.00'],
        ['Service description here', '1', '$75', '$75.00'],
        ['Service description here', '3', '$75', '$225.00'],
      ].map(([d, q, r, s]) => (
        <div key={d + q} className={styles.t11TableRow}>
          <span style={{ flex: 3 }}>• {d}</span>
          <span>{q}</span>
          <span>{r}</span>
          <span>{s}</span>
        </div>
      ))}
      <div className={styles.t11TotArea}>
        <div className={styles.t11TotRow}><span>Subtotal</span><span>$450.00</span></div>
        <div className={styles.t11TotRow}><span>Tax 0.00%</span><span>$0.00</span></div>
        <div className={styles.t11TotBold}><span>TOTAL</span><span>$450.00</span></div>
      </div>
      {/* Payment info boxes */}
      <div className={styles.t11PayTitle}>Payment Information</div>
      <div className={styles.t11PayBoxRow}>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Cheque</div>
          <div>Lorem ipsum dolor sit<br />Amet consectetur<br />Elit, sed do eiusmod</div>
        </div>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>PayPal</div>
          <div>Lorem ipsum dolor sit amet<br />Amet consectetur<br />Lorem ipsum dolor</div>
        </div>
        <div className={styles.t11PayBox}>
          <div className={styles.t11PayBoxTitle}>Other</div>
          <div>Lorem ipsum dolor sit<br />Amet consectetur<br />Elit, sed do eiusmod</div>
        </div>
      </div>
      <div className={styles.t11ThankYou}>THANK YOU!</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TEMPLATE 12 — Black geometric bold (Image 8)
// Black angular header with LOGO, centered INVOICE title,
// client + balance due, dark table header with description+rate+unit+subtotal,
// payment method, terms, authorised sign, black corner shapes
// ─────────────────────────────────────────────────────────────

function BlackGeometricTemplate() {
  return (
    <div className={styles.t12Base}>
      {/* Black angular header */}
      <div className={styles.t12Header}>
        <div className={styles.t12HeaderLeft}>
          <div className={styles.t12LogoBox}>LOGO</div>
        </div>
        <div className={styles.t12HeaderRight}>
          <div className={styles.t12HeaderContact}>📞 000 123-456-789</div>
          <div className={styles.t12HeaderContact}>✉ email@email.com</div>
          <div className={styles.t12HeaderContact}>📍 address.naem here, city name here.</div>
        </div>
      </div>
      {/* Title */}
      <div className={styles.t12TitleRow}>
        <div className={styles.t12InvoiceTitle}>INVOICE</div>
      </div>
      {/* Client + Balance */}
      <div className={styles.t12ClientRow}>
        <div>
          <div className={styles.t12ClientName}>Client Name Here</div>
          <div className={styles.t12ClientInfo}>P. 000-000-0000</div>
          <div className={styles.t12ClientInfo}>E. email@gmail.com</div>
          <div className={styles.t12ClientInfo}>A. address naem here, city name here.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.t12BalLabel}>Balance Due</div>
          <div className={styles.t12BalAmt}>$1,750.00/-</div>
          <div className={styles.t12BalDate}>TUESDAY 7th June, 2024</div>
        </div>
      </div>
      {/* Table */}
      <div className={styles.t12TableHead}>
        <span style={{ flex: 3 }}>DESCRIPTION</span>
        <span>RATE</span>
        <span>UNIT</span>
        <span>SUBTOTAL</span>
      </div>
      {[
        ['Website Design', '$10.00', 'Hour', '$150.00'],
        ['Graphic Design', '$50.00', 'Pcs', '$1,450.00'],
        ['Branding Identity', '$10.00', 'Hour', '$3500.00'],
        ['Magazine Design', '$50.00', 'Pcs', '$585.00'],
        ['Flyer Design', '$20.00', 'Hour', '$1,450.00'],
      ].map(([d, r, u, s]) => (
        <div key={d} className={styles.t12TableRow}>
          <span style={{ flex: 3 }}>
            <div className={styles.t12ItemName}>{d}</div>
            <div className={styles.t12ItemDesc}>Lorem ipsum description text</div>
          </span>
          <span>{r}</span>
          <span>{u}</span>
          <span>{s}</span>
        </div>
      ))}
      {/* Due + total bar */}
      <div className={styles.t12DueBar}>
        <span>DUE BY 20th June, 2024</span>
        <span>TOTAL: $1,675.00/-</span>
      </div>
      {/* Payment + terms */}
      <div className={styles.t12FootRow}>
        <div>
          <div className={styles.t12FootLabel}>PAYMENT / METHOD</div>
          <div className={styles.t12FootInfo}>Bank Name: Your Bank Name</div>
          <div className={styles.t12FootInfo}>Account No: 00 000 000 000 000</div>
          <div className={styles.t12FootInfo}>Swift Code: 000000000</div>
          <div style={{ marginTop: 8 }}>
            <div className={styles.t12FootLabel}>TERMS &amp; CONDITIONS</div>
            <div className={styles.t12FootInfo}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh.</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.t12SignScribble}>~ Authorised ~</div>
          <div className={styles.t12SignLine} />
          <div className={styles.t12SignLabel}>Authorised Sign</div>
        </div>
      </div>
      {/* Bottom corner decorations */}
      <div className={styles.t12BottomDeco} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, premium = false }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
      {premium && (
        <span className={styles.premiumBadge}>
          <span className="mi" style={{ fontSize: '0.7rem' }}>workspace_premium</span>
          PRO
        </span>
      )}
    </div>
  )
}

function SettingRow({ icon, label, sub, value, children, onClick, chevron, divider = true, locked = false }) {
  return (
    <div
      className={`${styles.row} ${onClick && !locked ? styles.rowTappable : ''} ${locked ? styles.rowLocked : ''} ${!divider ? styles.noDivider : ''}`}
      onClick={locked ? undefined : onClick}
    >
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.15rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {locked
          ? <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)', opacity: 0.7 }}>lock</span>
          : <>
              {value && <span className={styles.rowValue}>{value}</span>}
              {children}
              {chevron && <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 6 }}>chevron_right</span>}
            </>
        }
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!value); }}
      role="switch"
      aria-checked={value}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.segBtn} ${value === opt.value ? styles.segActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function FieldGroup({ children }) {
  return <div className={styles.fieldGroup}>{children}</div>
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      className={styles.textInput}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className={styles.textarea}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// Full-screen modal shell
// ─────────────────────────────────────────────────────────────

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={styles.fullOverlay}>
      <Header 
        type="back" 
        title={title} 
        onBackClick={onBack} 
        customActions={onSave ? [{ label: 'Save', onClick: onSave }] : []}
      />
      <div className={styles.fullContent}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Invoice Template Picker
// ─────────────────────────────────────────────────────────────

function TemplateModal({ isOpen, currentTemplate, onClose, onSelect }) {
  const [selected, setSelected] = useState(currentTemplate || 'editable')

  const TEMPLATES = [
    { id: 'editable',        label: 'Template #1 — Classic',         Component: EditableTemplate },
    { id: 'printable',       label: 'Template #2 — Gold Bar',         Component: PrintableTemplate },
    { id: 'custom',          label: 'Template #3 — Purple',           Component: CustomTemplate },
    { id: 'free',            label: 'Template #4 — Free',             Component: FreeTemplate },
    { id: 'canva',           label: 'Template #5 — Minimal Warm',     Component: CanvaTemplate },
    { id: 'darkheader',      label: 'Template #6 — Dark Corporate',   Component: DarkHeaderTemplate },
    { id: 'redbold',         label: 'Template #7 — Red Bold',         Component: RedBoldTemplate },
    { id: 'greenaccent',     label: 'Template #8 — Green Accent',     Component: GreenAccentTemplate },
    { id: 'tealgeometric',   label: 'Template #9 — Teal Geometric',   Component: TealGeometricTemplate },
    { id: 'pinkdiagonal',    label: 'Template #10 — Pink Diagonal',   Component: PinkDiagonalTemplate },
    { id: 'blueclean',       label: 'Template #11 — Blue Clean',      Component: BlueCleanTemplate },
    { id: 'blackgeometric',  label: 'Template #12 — Black Geometric', Component: BlackGeometricTemplate },
  ]

  if (!isOpen) return null

  return (
    <div className={styles.fullOverlay}>
      <Header 
        type="back" 
        title="Invoice Templates" 
        onBackClick={onClose} 
        customActions={[{ label: 'Select', onClick: () => { onSelect(selected); onClose() } }]}
      />
      <div className={styles.fullContent}>
        {TEMPLATES.map(t => (
          <div key={t.id} className={styles.templateWrapper} onClick={() => setSelected(t.id)}>
            <div className={`${styles.fullPreviewContainer} ${selected === t.id ? styles.fullPreviewActive : ''}`}>
              <t.Component />
            </div>
            <div className={styles.templateInfo}>
              <div className={`${styles.radio} ${selected === t.id ? styles.radioActive : ''}`} />
              <span className={styles.templateLabel}>{t.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Invoice Settings
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

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    updateMany(local)
    showToast('Invoice settings saved')
    onBack()
  }

  return (
    <FullModal title="Invoice Settings" onBack={onBack} onSave={save}>
      <div>
        <FieldGroup>
          <Field label="Invoice Number Prefix" hint="Shown before the number, e.g. INV-0042.">
            <TextInput value={local.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" />
          </Field>
          <Field label="Currency">
            <SegmentControl
              options={[
                { label: '₦ Naira',  value: '₦' },
                { label: '$ Dollar', value: '$' },
                { label: '£ Pound',  value: '£' },
                { label: '€ Euro',   value: '€' },
              ]}
              value={local.invoiceCurrency}
              onChange={set('invoiceCurrency')}
            />
          </Field>
          <Field label="Default Due Period" hint="Days after issue date the invoice is due.">
            <SegmentControl
              options={[
                { label: '3 days',  value: 3 },
                { label: '7 days',  value: 7 },
                { label: '14 days', value: 14 },
                { label: '30 days', value: 30 },
              ]}
              value={local.invoiceDueDays}
              onChange={set('invoiceDueDays')}
            />
          </Field>
        </FieldGroup>

        <div style={{ height: 12 }} />

        <FieldGroup>
          <div className={styles.row} style={{ borderBottom: local.invoiceShowTax ? '1px solid var(--border)' : 'none' }}>
            <div className={styles.rowIcon}>
              <span className="mi" style={{ fontSize: '1.15rem' }}>percent</span>
            </div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Show Tax Line</div>
              <div className={styles.rowSub}>Add a VAT / tax row to invoice totals</div>
            </div>
            <div className={styles.rowRight}>
              <Toggle value={local.invoiceShowTax} onChange={v => set('invoiceShowTax')(v)} />
            </div>
          </div>
          {local.invoiceShowTax && (
            <Field label="Tax Rate (%)" hint="e.g. 7.5 for 7.5% VAT">
              <TextInput
                type="number"
                value={String(local.invoiceTaxRate)}
                onChange={v => set('invoiceTaxRate')(parseFloat(v) || 0)}
                placeholder="7.5"
              />
            </Field>
          )}
        </FieldGroup>

        <div style={{ height: 12 }} />

        <FieldGroup>
          <Field label="Invoice Footer Text" hint="Printed at the bottom of every invoice.">
            <Textarea
              value={local.invoiceFooter}
              onChange={set('invoiceFooter')}
              placeholder="Thank you for your patronage 🙏"
              rows={3}
            />
          </Field>
        </FieldGroup>
      </div>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Settings page
// ─────────────────────────────────────────────────────────────

export default function Settings({ onMenuClick, isPremium = false, onUpgrade = () => {} }) {
  const { settings, updateSetting, resetSettings } = useSettings()

  const [toastMsg,      setToastMsg]      = useState('')
  const [templateModal, setTemplateModal] = useState(false)
  const [invoiceModal,  setInvoiceModal]  = useState(false)
  const [clearConfirm,  setClearConfirm]  = useState(false)
  const [resetConfirm,  setResetConfirm]  = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback(msg => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const isDark = settings.theme === 'dark'

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.scrollArea}>

        {/* ── APPEARANCE ── */}
        <SectionHeader icon="palette" label="Appearance" />
        <SettingRow
          icon="dark_mode"
          label="Dark Mode"
          sub={isDark ? 'Dark theme active' : 'Light theme active'}
        >
          <Toggle
            value={isDark}
            onChange={v => updateSetting('theme', v ? 'dark' : 'light')}
          />
        </SettingRow>

        {/* ── INVOICE ── */}
        <SectionHeader icon="receipt_long" label="Invoice" />
        <SettingRow
          icon="tune"
          label="Invoice Settings"
          sub={`${settings.invoiceCurrency} · ${settings.invoicePrefix} · Due ${settings.invoiceDueDays}d`}
          onClick={() => setInvoiceModal(true)}
          chevron
        />
        <SettingRow
          icon="description"
          label="Invoice Template"
          sub="Choose your preferred invoice design"
          value={settings.invoiceTemplate}
          onClick={() => setTemplateModal(true)}
          chevron
        />

        {/* ── NOTIFICATIONS ── */}
        <SectionHeader icon="notifications" label="Notifications" />
        <SettingRow icon="alarm" label="Overdue Tasks" sub="Alert when tasks pass their due date">
          <Toggle
            value={settings.notifyOverdueTasks}
            onChange={v => updateSetting('notifyOverdueTasks', v)}
          />
        </SettingRow>
        <SettingRow icon="cake" label="Customer Birthdays" sub="Remind you a day before">
          <Toggle
            value={settings.notifyUpcomingBirthdays}
            onChange={v => updateSetting('notifyUpcomingBirthdays', v)}
          />
        </SettingRow>
        <SettingRow icon="money_off" label="Unpaid Invoices" sub="Alert for invoices past due date">
          <Toggle
            value={settings.notifyUnpaidInvoices}
            onChange={v => updateSetting('notifyUnpaidInvoices', v)}
          />
        </SettingRow>

        {/* ── DATA ── */}
        <SectionHeader icon="storage" label="Data" />
        <SettingRow
          icon="restart_alt"
          label="Reset All Settings"
          sub="Restore defaults. Your customers and orders are safe."
          onClick={() => setResetConfirm(true)}
          chevron
        />
        <SettingRow
          icon="delete_forever"
          label="Clear All Data"
          sub="Permanently delete everything"
          onClick={() => setClearConfirm(true)}
          chevron
          divider={false}
        />

        <div style={{ height: 32 }} />
      </div>

      <TemplateModal
        isOpen={templateModal}
        currentTemplate={settings.invoiceTemplate}
        onClose={() => setTemplateModal(false)}
        onSelect={v => { updateSetting('invoiceTemplate', v); showToast('Template selected') }}
      />

      {invoiceModal && (
        <InvoiceSettingsModal
          onBack={() => setInvoiceModal(false)}
          showToast={showToast}
        />
      )}

      <ConfirmSheet
        open={clearConfirm}
        title="Delete All Data?"
        onConfirm={() => { localStorage.clear(); setClearConfirm(false); showToast('Cleared') }}
        onCancel={() => setClearConfirm(false)}
      />
      <ConfirmSheet
        open={resetConfirm}
        title="Reset All Settings?"
        onConfirm={() => { resetSettings(); setResetConfirm(false); showToast('Settings reset') }}
        onCancel={() => setResetConfirm(false)}
      />

      <Toast message={toastMsg} />
    </div>
  )
}
