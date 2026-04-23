// src/pages/Inventory/Inventory.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  subscribeToInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryQty,
  deleteInventoryItem,
} from '../../services/inventoryService'
import Header       from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast        from '../../components/Toast/Toast'
import styles from './Inventory.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── Constants ─────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'fabric',    label: 'Fabric',    icon: 'layers'         },
  { id: 'thread',    label: 'Thread',    icon: 'linear_scale'   },
  { id: 'button',    label: 'Buttons',   icon: 'radio_button_unchecked' },
  { id: 'zip',       label: 'Zips',      icon: 'compare_arrows' },
  { id: 'lining',    label: 'Lining',    icon: 'texture'        },
  { id: 'padding',   label: 'Padding',   icon: 'select_all'     },
  { id: 'elastic',   label: 'Elastic',   icon: 'expand'         },
  { id: 'supplies',  label: 'Supplies',  icon: 'handyman'       },
  { id: 'other',     label: 'Other',     icon: 'category'       },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

const UNITS = ['yards', 'metres', 'pcs', 'rolls', 'kg', 'g', 'packets', 'boxes', 'pairs']

const TABS = [
  { id: 'all',       label: 'All'        },
  { id: 'low',       label: 'Low Stock'  },
  { id: 'ok',        label: 'In Stock' },
  { id: 'out',       label: 'Out'        },
]

function stockStatus(item) {
  const qty = parseFloat(item.quantity) || 0
  if (qty <= 0) return 'out'
  if (qty <= (parseFloat(item.lowStockAt) || 5)) return 'low'
  return 'ok'
}

const STATUS_CONFIG = {
  ok:  { label: 'In Stock',  color: '#15803d', bg: 'rgba(21,128,61,0.12)',  border: 'rgba(21,128,61,0.3)'  },
  low: { label: 'Low Stock', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)' },
  out: { label: 'Out',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
}

// ── Add / Edit Item Modal ─────────────────────────────────────

function ItemModal({ isOpen, editItem, onClose, onSave }) {
  const [name,       setName]       = useState('')
  const [category,   setCategory]   = useState('fabric')
  const [quantity,   setQuantity]   = useState('')
  const [unit,       setUnit]       = useState('yards')
  const [lowStockAt, setLowStockAt] = useState('5')
  const [notes,      setNotes]      = useState('')
  const [colour,     setColour]     = useState('')

  // Populate when editing
  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '')
      setCategory(editItem.category || 'fabric')
      setQuantity(String(editItem.quantity ?? ''))
      setUnit(editItem.unit || 'yards')
      setLowStockAt(String(editItem.lowStockAt ?? '5'))
      setNotes(editItem.notes || '')
      setColour(editItem.colour || '')
    } else {
      setName(''); setCategory('fabric'); setQuantity('')
      setUnit('yards'); setLowStockAt('5'); setNotes(''); setColour('')
    }
  }, [editItem, isOpen])

  const reset = () => {
    setName(''); setCategory('fabric'); setQuantity('')
    setUnit('yards'); setLowStockAt('5'); setNotes(''); setColour('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name:       name.trim(),
      category,
      quantity:   parseFloat(quantity) || 0,
      unit,
      lowStockAt: parseFloat(lowStockAt) || 5,
      notes:      notes.trim(),
      colour:     colour.trim(),
    })
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalHeader}>
        <div className={styles.modalHeaderLeft}>
          <button className={styles.modalBack} onClick={handleClose}>
            <span className="mi" style={{ fontSize: '1.6rem' }}>arrow_back</span>
          </button>
          <span className={styles.modalTitle}>
            {editItem ? 'Edit Item' : 'New Item'}
          </span>
        </div>
        <button
          className={styles.modalSaveBtn}
          onClick={handleSave}
          disabled={!name.trim()}
        >
          {editItem ? 'Update' : 'Add'}
        </button>
      </div>

      <div className={styles.modalBody}>

        {/* Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Item Name *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Navy Blue Ankara, White Thread…"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Category</label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`${styles.catChip} ${category === cat.id ? styles.catChipActive : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="mi" style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colour (optional, great for fabrics/threads) */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Colour / Variant <span className={styles.optional}>(optional)</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Royal Blue, #D4AF37…"
            value={colour}
            onChange={e => setColour(e.target.value)}
          />
        </div>

        {/* Quantity + Unit */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Quantity</label>
            <input
              type="number"
              inputMode="decimal"
              className={styles.input}
              placeholder="0"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Unit</label>
            <select
              className={styles.input}
              value={unit}
              onChange={e => setUnit(e.target.value)}
            >
              {UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Low stock threshold */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Low Stock Alert Threshold</label>
          <input
            type="number"
            inputMode="decimal"
            className={styles.input}
            placeholder="5"
            value={lowStockAt}
            onChange={e => setLowStockAt(e.target.value)}
          />
          <div className={styles.fieldHint}>
            You'll see a warning when quantity falls to or below this number
          </div>
        </div>

        {/* Notes */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Notes <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            className={styles.textarea}
            placeholder="Supplier, brand, where you buy it…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>

      </div>
    </div>
  )
}

// ── Adjust Quantity Sheet ─────────────────────────────────────

function AdjustSheet({ item, onClose, onAdjust }) {
  const [delta,  setDelta]  = useState('')
  const [mode,   setMode]   = useState('use')   // 'use' | 'restock'

  if (!item) return null

  const handleConfirm = () => {
    const val = parseFloat(delta)
    if (!val || val <= 0) return
    onAdjust(item.id, mode === 'use' ? -val : val)
    setDelta('')
    onClose()
  }

  const qty        = parseFloat(item.quantity) || 0
  const previewQty = mode === 'use'
    ? Math.max(0, qty - (parseFloat(delta) || 0))
    : qty + (parseFloat(delta) || 0)

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />

        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>Adjust Stock</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', display: 'flex', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.adjustItemName}>{item.name}</div>
          <div className={styles.adjustCurrent}>
            Current: <strong>{item.quantity} {item.unit}</strong>
          </div>

          {/* Mode toggle */}
          <div className={styles.adjustModeRow}>
            <button
              className={`${styles.modeBtn} ${mode === 'use' ? styles.modeBtnUse : ''}`}
              onClick={() => setMode('use')}
            >
              <span className="mi" style={{ fontSize: '1rem' }}>remove_circle_outline</span>
              Used / Remove
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'restock' ? styles.modeBtnRestock : ''}`}
              onClick={() => setMode('restock')}
            >
              <span className="mi" style={{ fontSize: '1rem' }}>add_circle_outline</span>
              Restock / Add
            </button>
          </div>

          <div className={styles.fieldGroup} style={{ marginTop: 18 }}>
            <label className={styles.fieldLabel}>
              {mode === 'use' ? 'Amount Used' : 'Amount Added'} ({item.unit})
            </label>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              className={styles.input}
              placeholder="0"
              value={delta}
              onChange={e => setDelta(e.target.value)}
            />
          </div>

          {delta && parseFloat(delta) > 0 && (
            <div className={styles.adjustPreview}>
              New quantity: <strong style={{ color: previewQty <= 0 ? '#ef4444' : previewQty <= (item.lowStockAt || 5) ? '#fb923c' : '#15803d' }}>
                {previewQty} {item.unit}
              </strong>
            </div>
          )}

          <button
            className={styles.adjustConfirmBtn}
            onClick={handleConfirm}
            disabled={!delta || parseFloat(delta) <= 0}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Item Detail Sheet ─────────────────────────────────────────

function ItemDetail({ item, onClose, onEdit, onDelete, onAdjust }) {
  if (!item) return null
  const cat    = CAT_MAP[item.category] ?? CAT_MAP.other
  const status = stockStatus(item)
  const sc     = STATUS_CONFIG[status]
  const [adjustOpen, setAdjustOpen] = useState(false)

  return (
    <>
      <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={styles.sheet} style={{ maxHeight: '88dvh' }}>
          <div className={styles.sheetHandle} />

          <div className={styles.sheetHeader}>
            <div className={styles.sheetTitle}>Item Details</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', display: 'flex', cursor: 'pointer' }}>
              <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
            </button>
          </div>

          <div className={styles.sheetBody}>

            {/* Hero row */}
            <div className={styles.detailHero}>
              <div className={styles.detailIconWrap}>
                <span className="mi" style={{ fontSize: '1.8rem', color: sc.color }}>{cat.icon}</span>
              </div>
              <div className={styles.detailHeroInfo}>
                <div className={styles.detailName}>{item.name}</div>
                {item.colour && <div className={styles.detailColour}>{item.colour}</div>}
                <span
                  className={styles.statusPill}
                  style={{ background: sc.bg, color: sc.color, borderColor: sc.border, borderRadius: '6px' }}
                >
                  {sc.label}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className={styles.detailGrid}>
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Quantity</div>
                <div className={styles.detailCellVal} style={{ color: sc.color, fontSize: '1.3rem' }}>
                  {item.quantity}
                </div>
                <div className={styles.detailCellSub}>{item.unit}</div>
              </div>
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Category</div>
                <div className={styles.detailCellVal}>{cat.label}</div>
              </div>
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Low Stock At</div>
                <div className={styles.detailCellVal}>{item.lowStockAt ?? 5} {item.unit}</div>
              </div>
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Status</div>
                <div className={styles.detailCellVal} style={{ color: sc.color }}>{sc.label}</div>
              </div>
            </div>

            {/* Stock progress bar */}
            {parseFloat(item.lowStockAt) > 0 && (
              <div className={styles.stockBarWrap}>
                <div className={styles.stockBarLabelRow}>
                  <span className={styles.stockBarLabel}>Stock Level</span>
                  <span className={styles.stockBarFigure}>{item.quantity} / {item.lowStockAt} threshold</span>
                </div>
                <div className={styles.stockBarTrack}>
                  <div
                    className={styles.stockBarFill}
                    style={{
                      width: `${Math.min(100, (parseFloat(item.quantity) / Math.max(parseFloat(item.lowStockAt) * 2, 1)) * 100)}%`,
                      background: sc.color,
                    }}
                  />
                </div>
              </div>
            )}

            {item.notes && (
              <div className={styles.detailNotes}>
                <div className={styles.detailNotesLabel}>Notes</div>
                <p>{item.notes}</p>
              </div>
            )}

            {/* Actions */}
            <button className={styles.adjustBtn} onClick={() => setAdjustOpen(true)}>
              <span className="mi" style={{ fontSize: '1rem' }}>tune</span>
              Adjust Stock
            </button>

            <div className={styles.detailActionRow}>
              <button className={styles.editBtn} onClick={onEdit}>
                <span className="mi" style={{ fontSize: '1rem' }}>edit</span>
                Edit Item
              </button>
              <button className={styles.deleteBtn} onClick={onDelete}>
                <span className="mi" style={{ fontSize: '1rem' }}>delete_outline</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {adjustOpen && (
        <AdjustSheet
          item={item}
          onClose={() => setAdjustOpen(false)}
          onAdjust={(id, delta) => { onAdjust(id, delta); setAdjustOpen(false) }}
        />
      )}
    </>
  )
}

// ── Inventory Card ────────────────────────────────────────────

function InventoryCard({ item, isLast, onTap }) {
  const cat    = CAT_MAP[item.category] ?? CAT_MAP.other
  const status = stockStatus(item)
  const sc     = STATUS_CONFIG[status]

  return (
    <div
      className={`${styles.card} ${isLast ? styles.cardLast : ''}`}
      onClick={onTap}
    >
      <div
        className={styles.cardOuter}
        style={{
          borderColor: status !== 'ok' ? sc.border : undefined,
          background:  status !== 'ok' ? sc.bg      : undefined,
        }}
      >
        <div className={styles.cardInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: sc.color }}>{cat.icon}</span>
        </div>
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.cardName}>{item.name}</div>
        {item.colour && (
          <div className={styles.cardColour}>
            <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>circle</span>
            <span>{item.colour}</span>
          </div>
        )}
        <span
          className={styles.statusPill}
          style={{ background: sc.bg, color: sc.color, borderColor: sc.border, borderRadius: '6px' }}
        >
          {sc.label}
        </span>
        <div className={styles.cardMeta} style={{ marginTop: 4 }}>
          <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>category</span>
          <span>{cat.label}</span>
        </div>
      </div>

      <div className={styles.cardRight}>
        <div className={styles.cardQty} style={{ color: sc.color }}>
          {item.quantity}
          <span className={styles.cardUnit}>{item.unit}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Inventory({ onMenuClick }) {
  const { user } = useAuth()

  const [items,       setItems]       = useState([])
  const [activeTab,   setActiveTab]   = useState('all')
  const [search,      setSearch]      = useState('')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [detailItem,  setDetailItem]  = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [toastMsg,    setToastMsg]    = useState('')
  const [filterCat,   setFilterCat]   = useState('all')
  const [catDropOpen, setCatDropOpen] = useState(false)
  const toastTimer = useRef(null)

  // Subscribe to Firestore
  useEffect(() => {
    if (!user) return
    const unsub = subscribeToInventory(
      user.uid,
      (data) => {
        setItems(data)
        // Keep detail in sync
        setDetailItem(prev => prev ? data.find(i => i.id === prev.id) ?? null : null)
      },
      (err) => console.error('[Inventory]', err)
    )
    return unsub
  }, [user])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── CRUD ─────────────────────────────────────────────────────

  const handleSave = async (data) => {
    if (!user) return
    try {
      if (editItem) {
        await updateInventoryItem(user.uid, editItem.id, data)
        showToast('Item updated ✓')
      } else {
        await createInventoryItem(user.uid, data)
        showToast(`${data.name} added ✓`)
      }
    } catch {
      showToast('Failed to save item.')
    }
    setEditItem(null)
  }

  const handleAdjust = async (itemId, delta) => {
    if (!user) return
    try {
      await adjustInventoryQty(user.uid, itemId, delta)
      showToast(delta > 0 ? `+${delta} restocked ✓` : `${Math.abs(delta)} used ✓`)
    } catch {
      showToast('Failed to adjust quantity.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel || !user) return
    try {
      await deleteInventoryItem(user.uid, confirmDel.id)
      showToast('Item deleted')
      setDetailItem(null)
    } catch {
      showToast('Failed to delete item.')
    }
    setConfirmDel(null)
  }

  // ── Filter pipeline ──────────────────────────────────────────

  const filtered = items.filter(item => {
    // Tab filter
    if (activeTab !== 'all' && stockStatus(item) !== activeTab) return false
    // Category filter
    if (filterCat !== 'all' && item.category !== filterCat) return false
    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        (item.colour && item.colour.toLowerCase().includes(q)) ||
        (item.notes  && item.notes.toLowerCase().includes(q))
      )
    }
    return true
  })

  const counts = {
    all: items.length,
    ok:  items.filter(i => stockStatus(i) === 'ok').length,
    low: items.filter(i => stockStatus(i) === 'low').length,
    out: items.filter(i => stockStatus(i) === 'out').length,
  }

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    const cat = CAT_MAP[item.category]?.label ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const lowStockCount = counts.low + counts.out

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="Inventory" />

      {/* ── Search + category filter ── */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer', padding: 0 }}
                onClick={() => setSearch('')}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
          <button
            className={`${styles.filterBtn} ${filterCat !== 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setCatDropOpen(p => !p)}
          >
            <span className="mi" style={{ fontSize: '1.2rem' }}>tune</span>
          </button>
        </div>

        {catDropOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Filter by Category</div>
            <button
              className={`${styles.filterOption} ${filterCat === 'all' ? styles.filterOptionActive : ''}`}
              onClick={() => { setFilterCat('all'); setCatDropOpen(false) }}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>apps</span>
              All Categories
              {filterCat === 'all' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`${styles.filterOption} ${filterCat === cat.id ? styles.filterOptionActive : ''}`}
                onClick={() => { setFilterCat(cat.id); setCatDropOpen(false) }}
              >
                <span className="mi" style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                {cat.label}
                {filterCat === cat.id && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs} onClick={() => catDropOpen && setCatDropOpen(false)}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'low' ? styles.badgeLow : tab.id === 'out' ? styles.badgeOut : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── List ── */}
      <div className={styles.listArea} onClick={() => catDropOpen && setCatDropOpen(false)}>

        {items.length === 0 && (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '3rem', opacity: 0.15 }}>inventory_2</span>
            <p>No items yet.</p>
            <span>Tap + to add your first inventory item</span>
          </div>
        )}

        {items.length > 0 && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.15 }}>search_off</span>
            <p>No items match your filters.</p>
          </div>
        )}

        {/* Low stock banner — shown on All tab when there are alerts */}
        {activeTab === 'all' && lowStockCount > 0 && (
          <div className={styles.alertBanner} onClick={() => setActiveTab('low')}>
            <span className="mi" style={{ fontSize: '1rem', color: '#fb923c' }}>warning_amber</span>
            <span className={styles.alertText}>
              {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} need attention
            </span>
            <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)', marginLeft: 'auto' }}>chevron_right</span>
          </div>
        )}

        {Object.entries(grouped).map(([groupLabel, groupItems]) => (
          <div key={groupLabel} className={styles.itemGroup}>
            <div className={styles.groupLabel}>{groupLabel}</div>
            <div className={styles.groupDivider} />
            {groupItems.map((item, idx) => (
              <InventoryCard
                key={item.id}
                item={item}
                isLast={idx === groupItems.length - 1}
                onTap={() => setDetailItem(item)}
              />
            ))}
          </div>
        ))}

        <div style={{ height: 32 }} />
      </div>

      {/* ── FAB ── */}
      <button className={styles.fab} onClick={() => { setEditItem(null); setModalOpen(true) }}>
        <span className="mi">add</span>
      </button>

      {/* ── Modals ── */}
      <ItemModal
        isOpen={modalOpen}
        editItem={editItem}
        onClose={() => { setModalOpen(false); setEditItem(null) }}
        onSave={handleSave}
      />

      {detailItem && (
        <ItemDetail
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={() => {
            setEditItem(detailItem)
            setDetailItem(null)
            setModalOpen(true)
          }}
          onDelete={() => setConfirmDel(detailItem)}
          onAdjust={handleAdjust}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Item?"
        message="This will permanently remove the item from your inventory."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      <Toast message={toastMsg} />
      <BottomNav></BottomNav>
    </div>
  )
}