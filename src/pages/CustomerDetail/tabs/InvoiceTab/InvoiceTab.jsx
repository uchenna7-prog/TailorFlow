// src/pages/CustomerDetail/tabs/InvoiceTab/InvoiceTab.jsx

import { useState, useEffect, useRef } from 'react'
import InvoiceViewer from '../../../../components/InvoiceViewer/InvoiceViewer'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
import styles from './InvoiceTab.module.css'


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  unpaid:    'Unpaid',
  part_paid: 'Part Payment',
  paid:      'Full Payment',
  overdue:   'Overdue',
}

const STATUS_STYLES = {
  paid:      { background: 'rgba(34,197,94,0.12)',  color: '#15803d', borderColor: 'rgba(34,197,94,0.3)'  },
  part_paid: { background: 'rgba(251,146,60,0.12)', color: '#c2410c', borderColor: 'rgba(251,146,60,0.3)' },
  unpaid:    { background: 'rgba(234,179,8,0.12)',  color: '#a16207', borderColor: 'rgba(234,179,8,0.3)'  },
  overdue:   { background: 'rgba(239,68,68,0.12)',  color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)'  },
}

const ORDER_STATUS_LABELS = {
  pending:     'Pending',
  'in-progress': 'In Progress',
  completed:   'Completed',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
}

const ORDER_STATUS_STYLES = {
  pending:       { background: 'rgba(234,179,8,0.12)',   color: '#a16207', borderColor: 'rgba(234,179,8,0.3)'   },
  'in-progress': { background: 'rgba(59,130,246,0.12)',  color: '#2563eb', borderColor: 'rgba(59,130,246,0.3)'  },
  completed:     { background: 'rgba(34,197,94,0.12)',   color: '#15803d', borderColor: 'rgba(34,197,94,0.3)'   },
  delivered:     { background: 'rgba(129,140,248,0.12)', color: '#4f46e5', borderColor: 'rgba(129,140,248,0.3)' },
  cancelled:     { background: 'rgba(239,68,68,0.12)',   color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)'   },
}

const STAGE_LABELS = {
  measurement_taken: 'Measurement Taken',
  fabric_ready:      'Fabric Ready',
  cutting:           'Cutting',
  weaving:           'Weaving',
  sewing:            'Sewing',
  embroidery:        'Embroidery',
  fitting:           'Fitting',
  adjustments:       'Adjustments',
  finishing:         'Finishing',
  quality_check:     'Quality Check',
  ready:             'Ready',
}

const STAGE_ICONS = {
  measurement_taken: 'straighten',
  fabric_ready:      'checkroom',
  cutting:           'content_cut',
  weaving:           'texture',
  sewing:            'construction',
  embroidery:        'auto_awesome',
  fitting:           'accessibility',
  adjustments:       'tune',
  finishing:         'dry_cleaning',
  quality_check:     'fact_check',
  ready:             'check_circle',
}


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatMoney(currency = '₦', amount) {
  const number = parseFloat(amount) || 0
  return `${currency}${number.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function getCurrency() {
  try {
    const settings = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}')
    return settings.invoiceCurrency || '₦'
  } catch {
    return '₦'
  }
}

function groupInvoicesByDate(invoices) {
  return invoices.reduce((groups, invoice) => {
    const date = invoice.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(invoice)
    return groups
  }, {})
}

function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of orders) {
    if (order.id && order.items?.length > 0) {
      map[order.id] = order.items
    }
  }
  return map
}

function getInvoiceTotal(invoice) {
  if (invoice.items?.length > 0) {
    return invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  }
  return parseFloat(invoice.price) || 0
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL  (shared between list + picker modal)
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ orderItems, fallbackIcon, size = 68 }) {
  const images     = (orderItems || []).map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = (orderItems || []).length
  const innerSize  = Math.round(size * 0.74)
  const radius     = Math.round(size * 0.176)
  const innerRadius = Math.round(innerSize * 0.18)

  const outerStyle = {
    width: size, height: size, borderRadius: radius,
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  const innerStyle = {
    width: innerSize, height: innerSize, borderRadius: innerRadius,
    background: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  }

  if (images.length === 0) {
    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text3)' }}>
            {fallbackIcon || 'receipt_long'}
          </span>
        </div>
      </div>
    )
  }

  if (totalItems === 1) {
    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
    )
  }

  const extraCount = totalItems > 3 ? totalItems - 3 : 0
  const splitStyle = { ...innerStyle, padding: 0, flexDirection: 'row', alignItems: 'stretch' }

  if (totalItems === 2) {
    return (
      <div style={outerStyle}>
        <div style={splitStyle}>
          <div style={{ flex: '0 0 60%', overflow: 'hidden' }}>
            <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ width: 1.5, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {images[1]
              ? <img src={images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={outerStyle}>
      <div style={splitStyle}>
        <div style={{ flex: '0 0 60%', overflow: 'hidden' }}>
          {images[0]
            ? <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div style={{ width: 1.5, background: 'var(--border)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {images[1]
              ? <img src={images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div style={{ height: 1.5, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {images[2]
              ? <img src={images[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.6rem', fontWeight: 800,
              }}>
                +{extraCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ORDER PICKER MODAL
// Slides up from the bottom — shows all orders with full detail
// Invoiced orders show an "Invoiced" tag + tapping opens existing invoice
// ─────────────────────────────────────────────────────────────

function OrderPickerModal({ isOpen, onClose, orders, invoices, onSelectOrder }) {
  const [search, setSearch]       = useState('')
  const searchRef                 = useRef(null)
  const currency                  = getCurrency()

  // Focus search when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 350)
    } else {
      setSearch('')
    }
  }, [isOpen])

  const filtered = orders.filter(order => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (order.desc  || '').toLowerCase().includes(q) ||
      (order.status || '').toLowerCase().includes(q) ||
      (order.stage  || '').toLowerCase().replace(/_/g, ' ').includes(q) ||
      (order.due    || '').toLowerCase().includes(q) ||
      (order.takenAt || '').toLowerCase().includes(q) ||
      (order.items || []).some(i => (i.name || '').toLowerCase().includes(q))
    )
  })

  // Build invoiced order id set for quick lookup
  const invoicedOrderIds = new Set(invoices.map(inv => String(inv.orderId)))

  return (
    <div className={`${styles.pickerOverlay} ${isOpen ? styles.pickerOverlay_open : ''}`}>

      {/* Header */}
      <div className={styles.pickerHeader}>
        <button className={styles.pickerCloseBtn} onClick={onClose}>
          <span className="mi">keyboard_arrow_down</span>
        </button>
        <div className={styles.pickerHeaderText}>
          <span className={styles.pickerTitle}>Select Order</span>
          <span className={styles.pickerSubtitle}>Choose an order to create or view an invoice</span>
        </div>
      </div>

      {/* Search bar */}
      <div className={styles.pickerSearchWrap}>
        <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
        <input
          ref={searchRef}
          type="text"
          className={styles.pickerSearchInput}
          placeholder="Search by garment, status, stage, date..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search.length > 0 && (
          <button className={styles.pickerSearchClear} onClick={() => setSearch('')}>
            <span className="mi" style={{ fontSize: '1rem' }}>close</span>
          </button>
        )}
      </div>

      {/* Count line */}
      <div className={styles.pickerCountLine}>
        {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}
        {search.trim() ? ` matching "${search}"` : ' total'}
      </div>

      {/* Orders list */}
      <div className={styles.pickerList}>

        {filtered.length === 0 && (
          <div className={styles.pickerEmpty}>
            <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
            <p>No orders match your search</p>
          </div>
        )}

        {filtered.map((order, index) => {
          const isInvoiced    = invoicedOrderIds.has(String(order.id))
          const existingInv   = isInvoiced ? invoices.find(inv => String(inv.orderId) === String(order.id)) : null
          const items         = order.items || []
          const itemCount     = items.length
          const price         = parseFloat(order.price) || 0
          const statusStyle   = ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending
          const statusLabel   = ORDER_STATUS_LABELS[order.status] || 'Pending'
          const stageLabel    = order.stage ? STAGE_LABELS[order.stage] : null
          const stageIcon     = order.stage ? STAGE_ICONS[order.stage]  : null
          const isLast        = index === filtered.length - 1

          return (
            <div
              key={order.id}
              className={`${styles.pickerOrderCard} ${isInvoiced ? styles.pickerOrderCard_invoiced : ''} ${isLast ? styles.pickerOrderCard_last : ''}`}
              onClick={() => onSelectOrder(order, existingInv)}
            >
              {/* Thumbnail */}
              <OrderMosaic orderItems={items} fallbackIcon="receipt_long" size={62} />

              {/* Main info */}
              <div className={styles.pickerOrderInfo}>

                {/* Row 1: title + price */}
                <div className={styles.pickerOrderTop}>
                  <span className={styles.pickerOrderTitle}>{order.desc || 'Untitled Order'}</span>
                  <span className={styles.pickerOrderPrice}>{formatMoney(currency, price)}</span>
                </div>

                {/* Row 2: item count + date taken */}
                <div className={styles.pickerOrderMeta}>
                  {itemCount > 0 && (
                    <span className={styles.pickerMetaChip}>
                      <span className="mi" style={{ fontSize: '0.72rem' }}>checkroom</span>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                  {order.takenAt && (
                    <span className={styles.pickerMetaDate}>
                      <span className="mi" style={{ fontSize: '0.72rem' }}>event</span>
                      {order.takenAt}
                    </span>
                  )}
                </div>

                {/* Row 3: stage + status + due */}
                <div className={styles.pickerOrderBadges}>
                  {stageLabel && (
                    <span className={styles.pickerStageBadge}>
                      <span className="mi" style={{ fontSize: '0.7rem' }}>{stageIcon}</span>
                      {stageLabel}
                    </span>
                  )}
                  <span className={styles.pickerStatusBadge} style={statusStyle}>
                    {statusLabel}
                  </span>
                  {order.due && (
                    <span className={styles.pickerDueBadge}>
                      <span className="mi" style={{ fontSize: '0.68rem' }}>schedule</span>
                      Due {order.due}
                    </span>
                  )}
                </div>

                {/* Row 4: garment names if available */}
                {items.length > 0 && (
                  <div className={styles.pickerGarmentNames}>
                    {items.map(i => i.name).filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>

              {/* Right indicator */}
              <div className={styles.pickerOrderAction}>
                {isInvoiced ? (
                  <div className={styles.pickerInvoicedTag}>
                    <span className="mi" style={{ fontSize: '0.8rem' }}>receipt_long</span>
                    <span>Invoiced</span>
                  </div>
                ) : (
                  <div className={styles.pickerGenerateTag}>
                    <span className="mi" style={{ fontSize: '0.8rem' }}>add_circle</span>
                    <span>Create</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Bottom padding for safe area */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// INVOICE CARD — one row in the list
// ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap, isLast, orderItems }) {
  const total      = getInvoiceTotal(invoice)
  const statusKey  = invoice.status || 'unpaid'
  const badgeLabel = STATUS_LABELS[statusKey] || invoice.status
  const badgeStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.unpaid
  const itemCount = invoice.items?.length > 0 ? invoice.items.length : (invoice.qty || null)

  return (
    <div
      className={`${styles.invoiceRow} ${isLast ? styles.invoiceRowLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic orderItems={orderItems} fallbackIcon="receipt_long" size={68} />

      <div className={styles.invoiceRowInfo}>
        <div className={styles.invoiceRowTitle}>{invoice.orderDesc || 'Order'}</div>
  
        {itemCount && (
          <div className={styles.invoiceRowItemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      <div className={styles.invoiceRowRight}>
        <span className={styles.invoiceStatusBadge} style={badgeStyle}>
          {badgeLabel}
        </span>
        <div className={styles.invoiceRowAmount}>
          {formatMoney(currency, total)}
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt_long</span>
      <p className={styles.emptyStateTitle}>No invoices yet</p>
      <p className={styles.emptyStateSubtitle}>
        Tap the <strong>+</strong> button to create your first invoice from an existing order.
      </p>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// INVOICE TAB — main export
// ─────────────────────────────────────────────────────────────

export default function InvoiceTab({
  invoices = [],
  orders   = [],
  customer,
  onStatusChange,
  onDelete,
  onGenerateInvoice,
  showToast,
}) {
  const [viewingInvoice,  setViewingInvoice]  = useState(null)
  const [deleteTarget,    setDeleteTarget]    = useState(null)
  const [pickerOpen,      setPickerOpen]      = useState(false)
  const [generating,      setGenerating]      = useState(null) // orderId being generated

  const currency      = getCurrency()
  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupInvoicesByDate(invoices)

  // Listen for FAB click dispatched from CustomerDetail
  useEffect(() => {
    const openPicker = () => setPickerOpen(true)
    document.addEventListener('openInvoiceModal', openPicker)
    return () => document.removeEventListener('openInvoiceModal', openPicker)
  }, [])

  async function handleSelectOrder(order, existingInvoice) {
    // If already invoiced — open the existing invoice directly
    if (existingInvoice) {
      setPickerOpen(false)
      setTimeout(() => setViewingInvoice(existingInvoice), 300)
      return
    }

    // Otherwise generate immediately
    setGenerating(order.id)
    try {
      await onGenerateInvoice(order.id)
      setPickerOpen(false)
      // onGenerateInvoice in CustomerDetail already switches to invoice tab
      // and the new invoice will appear via the invoices prop update
    } catch {
      showToast('Failed to generate invoice. Try again.')
    } finally {
      setGenerating(null)
    }
  }

  function handleConfirmDelete() {
    onDelete(deleteTarget)
    showToast('Invoice deleted')
    setDeleteTarget(null)
    if (viewingInvoice?.id === deleteTarget) setViewingInvoice(null)
  }

  function handleStatusChange(id, newStatus) {
    onStatusChange(id, newStatus)
    showToast(`Marked as ${STATUS_LABELS[newStatus] || newStatus}`)
    if (viewingInvoice?.id === id) {
      setViewingInvoice(prev => ({ ...prev, status: newStatus }))
    }
  }

  // Keep viewingInvoice in sync when invoices prop updates
  // (e.g. status change from PaymentsTab)
  useEffect(() => {
    if (!viewingInvoice) return
    const updated = invoices.find(inv => inv.id === viewingInvoice.id)
    if (updated && updated.status !== viewingInvoice.status) {
      setViewingInvoice(updated)
    }
  }, [invoices])

  return (
    <>
      {/* Empty state */}
      {invoices.length === 0 && (
        <EmptyState />
      )}

      {/* Invoice list grouped by date */}
      {invoices.length > 0 && Object.entries(groupedByDate).map(([date, dateInvoices]) => (
        <div key={date} className={styles.dateGroup}>
          <div className={styles.dateGroupLabel}>{date}</div>
          <div className={styles.dateGroupDivider} />

          {dateInvoices.map((invoice, index) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              currency={currency}
              isLast={index === dateInvoices.length - 1}
              onTap={() => setViewingInvoice(invoice)}
              orderItems={orderItemsMap[invoice.orderId] ?? []}
            />
          ))}
        </div>
      ))}

      {/* Order picker modal */}
      <OrderPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        orders={orders}
        invoices={invoices}
        onSelectOrder={handleSelectOrder}
        generating={generating}
      />

      {/* Invoice viewer */}
      {viewingInvoice && (
        <div className={styles.modalOverlay}>
          <Header
            type="back"
            title="Invoice Details"
            onBackClick={() => setViewingInvoice(null)}
            customActions={[
              {
                icon:    'delete_outline',
                label:   'Delete',
                onClick: () => setDeleteTarget(viewingInvoice.id),
                color:   'var(--danger)',
              },
            ]}
          />
          <InvoiceViewer
            invoice={viewingInvoice}
            customer={customer}
            onClose={() => setViewingInvoice(null)}
            onStatusChange={handleStatusChange}
            onDelete={(id) => setDeleteTarget(id)}
            showToast={showToast}
          />
        </div>
      )}

      {/* Delete confirm sheet */}
      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this invoice?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}