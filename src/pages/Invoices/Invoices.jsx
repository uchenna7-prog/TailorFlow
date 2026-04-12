// src/pages/Invoices/Invoices.jsx
// ─────────────────────────────────────────────────────────────
// Displays ALL invoices across ALL customers.
// Subscribes to each customer's invoices subcollection live.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useAuth }      from '../../contexts/AuthContext'
import { useCustomers } from '../../contexts/CustomerContext'
import { useSettings }  from '../../contexts/SettingsContext'
import { subscribeToInvoices, updateInvoiceStatus, deleteInvoice } from '../../services/invoiceService'
import InvoiceView from '../CustomerDetail/tabs/InvoiceView'
import Header from '../../components/Header/Header'
import styles from './Invoices.module.css'

// ── Helpers ───────────────────────────────────────────────────

function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function isOverdue(invoice) {
  if (invoice.status === 'paid') return false
  if (!invoice.due) return false
  return new Date(invoice.due + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown Date'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Tabs ──────────────────────────────────────────────────────

const TABS = [
  { id: 'all',     label: 'All'     },
  { id: 'unpaid',  label: 'Unpaid'  },
  { id: 'paid',    label: 'Paid'    },
  { id: 'overdue', label: 'Overdue' },
]

const STATUS_LABELS = { unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue' }

const STATUS_STYLES = {
  paid:    { bg: 'rgba(34,197,94,0.12)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'   },
  unpaid:  { bg: 'rgba(234,179,8,0.12)',   color: '#a16207', border: 'rgba(234,179,8,0.3)'   },
  overdue: { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', border: 'rgba(239,68,68,0.3)'   },
}

// ── Invoice List Item ─────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap, isLast }) {
  const total = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(invoice.price) || 0)
  const overdue = isOverdue(invoice)
  const status  = overdue && invoice.status !== 'paid' ? 'overdue' : invoice.status

  return (
    <div
      className={`${styles.invoiceListItem} ${isLast ? styles.invoiceListItemLast : ''} ${overdue ? styles.invoiceListItemOverdue : ''}`}
      onClick={onTap}
    >
      {/* Left: grey outer box with white inner box */}
      <div className={styles.invoiceListOuter}>
        <div className={styles.invoiceListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: overdue ? '#ef4444' : 'var(--text3)' }}>
            receipt_long
          </span>
        </div>
      </div>

      {/* Info */}
      <div className={styles.invoiceListInfo}>
        <div className={styles.invoiceListDesc}>{invoice.orderDesc || 'Order'}</div>
        <div className={styles.invoiceListOrdRow}>{invoice.number}</div>
        <div className={styles.invoiceListMeta}>
          <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.invoiceListMetaText}>{invoice.customerName || '—'}</span>
        </div>
        <span style={{
          display: 'inline-block',
          marginTop: '4px',
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 600,
          background: (STATUS_STYLES[status] ?? STATUS_STYLES.unpaid).bg,
          color:      (STATUS_STYLES[status] ?? STATUS_STYLES.unpaid).color,
          border:     `1px solid ${(STATUS_STYLES[status] ?? STATUS_STYLES.unpaid).border}`,
        }}>
          {STATUS_LABELS[status] ?? status}
        </span>
        <div className={`${styles.invoiceListAmount}`}>{fmt(currency, total)}</div>
      </div>
    </div>
  )
}

// ── Full Invoice View — delegated to InvoiceView component ───
// InvoiceView reads invoice.template + invoice.brandSnapshot to
// always render with the template active at creation time.

// ── Main Page ─────────────────────────────────────────────────

export default function Invoices({ onMenuClick }) {
  const { user }      = useAuth()
  const { customers } = useCustomers()
  const { settings }  = useSettings()
  const currency      = settings.invoiceCurrency || '₦'

  const [allInvoices, setAllInvoices] = useState([])
  const [activeTab,   setActiveTab]   = useState('all')
  const [viewing,     setViewing]     = useState(null)
  const unsubsRef = useRef({})

  // ── Subscribe to every customer's invoices ────────────────
  useEffect(() => {
    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    if (!user || !customers.length) {
      setAllInvoices([])
      return
    }

    const invoiceMap = {}

    customers.forEach(customer => {
      const unsub = subscribeToInvoices(
        user.uid,
        customer.id,
        (invoices) => {
          invoiceMap[customer.id] = invoices.map(inv => ({
            ...inv,
            customerName: inv.customerName || customer.name,
            customerId:   customer.id,
          }))
          const flat = Object.values(invoiceMap)
            .flat()
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() ?? 0
              const bTime = b.createdAt?.toMillis?.() ?? 0
              return bTime - aTime
            })
          setAllInvoices([...flat])
        },
        (err) => console.error('[Invoices]', customer.id, err)
      )
      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  // ── Filter ───────────────────────────────────────────────
  const filtered = allInvoices.filter(inv => {
    if (activeTab === 'all')     return true
    if (activeTab === 'paid')    return inv.status === 'paid'
    if (activeTab === 'unpaid')  return inv.status !== 'paid' && !isOverdue(inv)
    if (activeTab === 'overdue') return isOverdue(inv)
    return true
  })

  // ── Counts ───────────────────────────────────────────────
  const counts = {
    all:     allInvoices.length,
    unpaid:  allInvoices.filter(i => i.status !== 'paid' && !isOverdue(i)).length,
    paid:    allInvoices.filter(i => i.status === 'paid').length,
    overdue: allInvoices.filter(i => isOverdue(i)).length,
  }

  const EMPTY_TEXT = {
    all:     'No invoices yet.',
    unpaid:  'No unpaid invoices.',
    paid:    'No paid invoices yet.',
    overdue: 'No overdue invoices. All good!',
  }

  // ── Group by date ─────────────────────────────────────────
  const grouped = filtered.reduce((acc, inv) => {
    const key = inv.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(inv)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <Header title="Invoices" onMenuClick={onMenuClick} />

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={(e) => {
              setActiveTab(tab.id)
              e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'overdue' ? styles.badgeOverdue : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* List */}
      <div className={styles.listArea}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>receipt_long</span>
            <p>{EMPTY_TEXT[activeTab]}</p>
            {activeTab === 'all' && (
              <span className={styles.emptyHint}>
                Go to a customer → Orders → Generate Invoice
              </span>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateInvoices]) => (
            <div key={date} className={styles.invoiceGroup}>
              <div className={styles.invoiceGroupDate}>{date}</div>
              <div className={styles.invoiceGroupDivider} />
              {dateInvoices.map((inv, idx) => (
                <InvoiceCard
                  key={`${inv.customerId}-${inv.id}`}
                  invoice={inv}
                  currency={currency}
                  isLast={idx === dateInvoices.length - 1}
                  onTap={() => setViewing(inv)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Full invoice view — uses InvoiceView so template is preserved */}
      {viewing && (
        <InvoiceView
          invoice={viewing}
          customer={{
            name:    viewing.customerName || '—',
            phone:   viewing.customerPhone || '',
            address: viewing.customerAddress || '',
          }}
          onClose={() => setViewing(null)}
          onStatusChange={async (id, newStatus) => {
            try {
              await updateInvoiceStatus(user.uid, viewing.customerId, id, newStatus)
              setViewing(prev => prev ? { ...prev, status: newStatus } : null)
            } catch { /* silent */ }
          }}
          onDelete={async (id) => {
            try {
              await deleteInvoice(user.uid, viewing.customerId, id)
              setViewing(null)
            } catch { /* silent */ }
          }}
          showToast={() => {}}
        />
      )}
    </div>
  )
}