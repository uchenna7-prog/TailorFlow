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
  pending:       'Pending',
  'in-progress': 'In Progress',
  completed:     'Completed',
  delivered:     'Delivered',
  cancelled:     'Cancelled',
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
// ORDER MOSAIC THUMBNAIL
// CSS-module version matching OrdersTab card mosaics exactly.
// size="sm" → 38px picker thumb   size="md" → 68px list row
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ items = [], size = 'md' }) {
  const images     = items.map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = items.length
  const isSm      = size === 'sm'

  const outerCls = isSm ? styles.mosaicOuter_sm : styles.mosaicOuter
  const innerCls = isSm ? styles.mosaicInner_sm : styles.mosaicInner

  if (images.length === 0) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <span className="mi" style={{ fontSize: isSm ? '1rem' : '1.4rem', color: 'var(--text3)' }}>
            receipt_long
          </span>
        </div>
      </div>
    )
  }

  if (totalItems === 1) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <img src={images[0]} alt="" className={styles.mosaicSingleImage} />
        </div>
      </div>
    )
  }

  if (totalItems === 2) {
    return (
      <div className={outerCls}>
        <div className={`${innerCls} ${styles.mosaicSplit}`}>
          <div className={styles.mosaicLeft}>
            <img src={images[0]} alt="" className={styles.mosaicPanelImg} />
          </div>
          <div className={styles.mosaicDividerV} />
          <div className={styles.mosaicRight}>
            <div className={styles.mosaicCell}>
              {images[1]
                ? <img src={images[1]} alt="" className={styles.mosaicPanelImg} />
                : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const extraCount = totalItems > 3 ? totalItems - 3 : 0
  return (
    <div className={outerCls}>
      <div className={`${innerCls} ${styles.mosaicSplit}`}>
        <div className={styles.mosaicLeft}>
          {images[0]
            ? <img src={images[0]} alt="" className={styles.mosaicPanelImg} />
            : <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDividerV} />
        <div className={styles.mosaicRight}>
          <div className={styles.mosaicCell}>
            {images[1]
              ? <img src={images[1]} alt="" className={styles.mosaicPanelImg} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDividerH} />
          <div className={`${styles.mosaicCell} ${extraCount > 0 ? styles.mosaicCell_overlay : ''}`}>
            {images[2]
              ? <img src={images[2]} alt="" className={styles.mosaicPanelImg} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && (
              <div className={styles.mosaicOverlay}>+{extraCount}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ORDER PICKER MODAL
// Full-screen, single scrollable screen.
// Multi-select: tap orders to toggle. Step 2 appears once at
// least one order is selected, showing all chosen orders and
// a single "Generate Invoice(s)" button.
// No generate action in the header.
// ─────────────────────────────────────────────────────────────

function OrderPickerModal({ isOpen, onClose, orders, invoices, onGenerateSelected, generatingIds }) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [search,      setSearch]      = useState('')
  const step2Ref                      = useRef(null)
  const showSearch                    = orders.length > 5
  const currency                      = getCurrency()

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearch('')
    }
  }, [isOpen])

  // Scroll step 2 card into view when first order is selected
  useEffect(() => {
    if (selectedIds.size === 1 && step2Ref.current) {
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
    }
  }, [selectedIds.size])

  // Only non-invoiced orders
  const invoicedOrderIds  = new Set(invoices.map(inv => String(inv.orderId)))
  const nonInvoicedOrders = orders.filter(order => !invoicedOrderIds.has(String(order.id)))

  const filtered = nonInvoicedOrders.filter(order => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (order.desc    || '').toLowerCase().includes(q) ||
      (order.status  || '').toLowerCase().includes(q) ||
      (order.due     || '').toLowerCase().includes(q) ||
      (order.takenAt || '').toLowerCase().includes(q) ||
      (order.items   || []).some(i => (i.name || '').toLowerCase().includes(q))
    )
  })

  function toggleOrder(order) {
    if (generatingIds.size > 0) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(order.id) ? next.delete(order.id) : next.add(order.id)
      return next
    })
  }

  const selectedOrders  = nonInvoicedOrders.filter(o => selectedIds.has(o.id))
  const isAnyGenerating = generatingIds.size > 0

  return (
    <div className={`${styles.pickerOverlay} ${isOpen ? styles.pickerOverlay_open : ''}`}>

      {/* Header — no action button */}
      <Header
        type="back"
        title="New Invoice"
        onBackClick={isAnyGenerating ? undefined : onClose}
      />

      <div className={styles.pickerScrollBody}>
        <div style={{ padding: '20px' }}>

          {/* ── Step 1: Select Orders ── */}
          <p className={styles.stepHeading}>1. Select Orders</p>

          {/* Search bar */}
          {showSearch && (
            <div className={styles.clothSearchBar}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
              <input
                type="text"
                placeholder="Search orders…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.clothSearchInput}
              />
              {search.length > 0 && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 0 }}
                  onClick={() => setSearch('')}
                >
                  <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                </button>
              )}
            </div>
          )}

          {/* Empty — all invoiced */}
          {nonInvoicedOrders.length === 0 && (
            <div className={styles.pickerEmpty}>
              <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>receipt_long</span>
              <p>All orders already have invoices.</p>
            </div>
          )}

          {/* Empty search result */}
          {nonInvoicedOrders.length > 0 && filtered.length === 0 && (
            <div className={styles.pickerEmpty}>
              <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
              <p>No orders match your search</p>
            </div>
          )}

          {/* Multi-select order list */}
          <div className={styles.clothPickerList}>
            {filtered.map(order => {
              const isSelected   = selectedIds.has(order.id)
              const isGenerating = generatingIds.has(order.id)

              return (
                <div
                  key={order.id}
                  className={`
                    ${styles.clothPickerItem}
                    ${isSelected   ? styles.clothPickerItem_selected   : ''}
                    ${isGenerating ? styles.clothPickerItem_generating : ''}
                  `}
                  onClick={() => toggleOrder(order)}
                >
                  {/* Full mosaic thumbnail */}
                  <OrderMosaic items={order.items || []} size="sm" />

                  {/* Order name + due date */}
                  <div className={styles.clothInfo}>
                    <h5>{order.desc || 'Untitled Order'}</h5>
                    {order.due
                      ? <span style={{ color: '#ef4444' }}>Due {order.due}</span>
                      : <span>No due date</span>
                    }
                  </div>

                  {/* Check circle or per-order spinner */}
                  <div className={`${styles.clothCheckCircle} ${isSelected ? styles.clothCheckCircle_checked : ''}`}>
                    {isGenerating
                      ? <div className={styles.pickerSpinner} />
                      : isSelected
                        ? <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>
                        : null
                    }
                  </div>
                </div>
              )
            })}
          </div>


          {/* ── Step 2: Generate Invoices ── */}
          {selectedOrders.length > 0 && (
            <div ref={step2Ref}>
              <p className={styles.stepHeading} style={{ marginTop: 24 }}>
                {`2. Generate Invoice${selectedOrders.length > 1 ? 's' : ''}`}
              </p>

              <div className={styles.generateCard}>

                {/* One row per selected order */}
                {selectedOrders.map((order, idx) => {
                  const isGenerating = generatingIds.has(order.id)
                  const isLast       = idx === selectedOrders.length - 1

                  return (
                    <div
                      key={order.id}
                      className={`${styles.generateOrderRow} ${isLast ? styles.generateOrderRow_last : ''}`}
                    >
                      <OrderMosaic items={order.items || []} size="sm" />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.generateOrderName}>
                          {order.desc || 'Untitled Order'}
                        </div>
                        {order.price != null && (
                          <div className={styles.generateOrderPrice}>
                            {formatMoney(currency, order.price)}
                          </div>
                        )}
                      </div>

                      {isGenerating && (
                        <div className={styles.generateRowSpinnerWrap}>
                          <div className={styles.pickerSpinner} />
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Dashed divider — matches orderTotalRow in OrderModal */}
                <div className={styles.generateDivider} />

                {/* Generate button — ONLY here, not in header */}
                <button
                  className={styles.generateInlineButton}
                  onClick={() => onGenerateSelected(selectedOrders)}
                  disabled={isAnyGenerating}
                >
                  {isAnyGenerating
                    ? (
                      <>
                        <div className={styles.pickerSpinnerWhite} />
                        Generating…
                      </>
                    )
                    : (
                      <>
                        <span className="mi" style={{ fontSize: '1.1rem' }}>receipt_long</span>
                        {selectedOrders.length > 1
                          ? `Generate ${selectedOrders.length} Invoices`
                          : 'Generate Invoice'
                        }
                      </>
                    )
                  }
                </button>
              </div>
            </div>
          )}

        </div>
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
  const itemCount  = invoice.items?.length > 0 ? invoice.items.length : (invoice.qty || null)

  return (
    <div
      className={`${styles.invoiceRow} ${isLast ? styles.invoiceRowLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic items={orderItems} size="md" />

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
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [pickerOpen,     setPickerOpen]     = useState(false)
  const [generatingIds,  setGeneratingIds]  = useState(new Set())

  const currency      = getCurrency()
  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupInvoicesByDate(invoices)

  // Listen for FAB click dispatched from CustomerDetail
  useEffect(() => {
    const openPicker = () => setPickerOpen(true)
    document.addEventListener('openInvoiceModal', openPicker)
    return () => document.removeEventListener('openInvoiceModal', openPicker)
  }, [])

  // Generate invoices for all selected orders sequentially,
  // lighting up per-order spinners as each one resolves.
  async function handleGenerateSelected(selectedOrders) {
    if (generatingIds.size > 0) return

    setGeneratingIds(new Set(selectedOrders.map(o => o.id)))
    let anyFailed = false

    for (const order of selectedOrders) {
      try {
        await onGenerateInvoice(order.id)
      } catch {
        anyFailed = true
        showToast(`Failed to generate invoice for "${order.desc || 'order'}".`)
      }
      setGeneratingIds(prev => {
        const next = new Set(prev)
        next.delete(order.id)
        return next
      })
    }

    if (!anyFailed) {
      showToast(selectedOrders.length > 1
        ? `${selectedOrders.length} invoices generated`
        : 'Invoice generated'
      )
    }

    setTimeout(() => setPickerOpen(false), 300)
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
  useEffect(() => {
    if (!viewingInvoice) return
    const updated = invoices.find(inv => inv.id === viewingInvoice.id)
    if (updated && updated.status !== viewingInvoice.status) {
      setViewingInvoice(updated)
    }
  }, [invoices])

  return (
    <>
      {invoices.length === 0 && <EmptyState />}

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
        onClose={() => {
          if (generatingIds.size > 0) return
          setPickerOpen(false)
        }}
        orders={orders}
        invoices={invoices}
        onGenerateSelected={handleGenerateSelected}
        generatingIds={generatingIds}
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
