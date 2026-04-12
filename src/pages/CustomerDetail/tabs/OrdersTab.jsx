// src/pages/CustomerDetail/tabs/OrdersTab.jsx

import { useState, useEffect } from 'react'
import { useOrders } from '../../../contexts/OrdersContext'
import ConfirmSheet from '../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../components/Header/Header'
import styles from './Tabs.module.css'

const PRIORITY_COLOR = { normal: 'var(--border2)', urgent: '#fb923c', vip: '#a855f7' }
const PRIORITY_BANNER = {
  normal: { cls: styles.bannerNormal, text: 'Normal Priority' },
  urgent: { cls: styles.bannerUrgent, text: 'Urgent ★' },
  vip:    { cls: styles.bannerVip,    text: 'VIP ★' },
}

const STATUSES = [
  { value: 'pending',     label: 'Pending'      },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'completed',   label: 'Completed'    },
  { value: 'delivered',   label: 'Delivered'    },
  { value: 'cancelled',   label: 'Cancelled'    },
]

// Production stages — ordered from start to finish
const STAGES = [
  { value: 'measurement_taken', label: 'Measurement Taken', icon: 'straighten'     },
  { value: 'fabric_ready',      label: 'Fabric Ready',      icon: 'roll_content'   },
  { value: 'cutting',           label: 'Cutting',           icon: 'content_cut'    },
  { value: 'weaving',           label: 'Weaving',           icon: 'texture'        },
  { value: 'sewing',            label: 'Sewing',            icon: 'send'           },
  { value: 'embroidery',        label: 'Embroidery',        icon: 'auto_awesome'   },
  { value: 'fitting',           label: 'Fitting',           icon: 'accessibility'  },
  { value: 'adjustments',       label: 'Adjustments',       icon: 'tune'           },
  { value: 'finishing',         label: 'Finishing',         icon: 'dry_cleaning'   },
  { value: 'quality_check',     label: 'Quality Check',     icon: 'fact_check'     },
  { value: 'ready',             label: 'Ready',             icon: 'check_circle'   },
]

// Auto-status derived from stage selection
const STAGE_TO_STATUS = {
  measurement_taken: 'pending',
  fabric_ready:      'pending',
  cutting:           'in-progress',
  weaving:           'in-progress',
  sewing:            'in-progress',
  embroidery:        'in-progress',
  fitting:           'in-progress',
  adjustments:       'in-progress',
  finishing:         'in-progress',
  quality_check:     'in-progress',
  ready:             'completed',
}

function formatDate(ts) {
  if (!ts) return 'Unknown Date'
  if (typeof ts.toDate === 'function') {
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (typeof ts === 'string') return ts
  return 'Unknown Date'
}

// Returns today's date as a readable string e.g. "Apr 12, 2026"
function todayReadable() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── ORDER FORM MODAL ──────────────────────────────────────────
function OrderModal({ isOpen, onClose, measurements, onSave }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [pickerQuery,   setPickerQuery]   = useState('')
  const [desc,          setDesc]          = useState('')
  const [due,           setDue]           = useState('')
  const [priority,      setPriority]      = useState('normal')
  const [notes,         setNotes]         = useState('')
  const [stage,         setStage]         = useState('')

  const reset = () => {
    setSelectedItems([]); setPickerQuery(''); setDesc('')
    setDue(''); setPriority('normal'); setNotes(''); setStage('')
  }

  const toggleId = (m) => {
    const idStr = String(m.id)
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === idStr)
      if (exists) return prev.filter(item => item.id !== idStr)
      return [...prev, { id: idStr, price: '', name: m.name, imgSrc: m.imgSrc }]
    })
  }

  const updateItemPrice = (id, priceValue) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === id ? { ...item, price: priceValue } : item
    ))
  }

  const totalPrice   = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  const dynamicQty   = selectedItems.length || 1

  const filteredMeasurements = pickerQuery.trim()
    ? measurements.filter(m => m.name.toLowerCase().includes(pickerQuery.toLowerCase()))
    : measurements

  const handleSave = () => {
    if (selectedItems.length === 0 && !desc.trim()) return

    let dueDisplay = ''
    if (due) {
      const d = new Date(due + 'T00:00:00')
      dueDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    onSave({
      desc:           desc.trim() || (selectedItems.length > 0 ? selectedItems.map(i => i.name).join(', ') : 'New Order'),
      price:          totalPrice,
      items:          selectedItems.map(i => ({ id: i.id, price: parseFloat(i.price) || 0, name: i.name, imgSrc: i.imgSrc || null })),
      qty:            dynamicQty,
      due:            dueDisplay,
      dueRaw:         due,
      notes:          notes.trim(),
      priority,
      measurementIds: selectedItems.map(i => i.id),
      status:         'pending',
      stage:          stage || null,
      takenAt:        todayReadable(),
    })
    reset()
    onClose()
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <Header
        type="back"
        title="New Order"
        onBackClick={handleClose}
        customActions={[{ label: 'Place Order', onClick: handleSave }]}
      />

      <div className={styles.modalBody}>
        <div style={{ padding: '20px' }}>

          <p className={styles.sectionHeading}>1. Select Clothes</p>

          <div className={styles.pickerList}>
            {measurements.map(m => (
              <div
                key={m.id}
                className={styles.pickerItem}
                onClick={() => toggleId(m)}
              >
                <div className={styles.pickerThumb}>
                  {m.imgSrc
                    ? <img src={m.imgSrc} alt={m.name} />
                    : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>}
                </div>
                <div className={styles.pickerInfo}>
                  <h5>{m.name}</h5>
                  <span>{m.fields?.length || 0} measurements</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── ORDER DETAIL ──────────────────────────────────────────────
function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange, onStageChange, onGenerateInvoice }) {
  if (!order) return null

  return (
    <div className={`${styles.detailModal} ${styles.detailOpen}`}>
      <Header
        type="back"
        title={order.desc}
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.detailBody}>
        <div className={styles.orderMetaGrid}>
          <div className={styles.orderMetaCell}>
            <div className={styles.cellLabel}>Total Price</div>
            <div className={styles.cellValue}>₦{Number(order.price || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN TAB ──────────────────────────────────────────────────
export default function OrdersTab({ customerId, orders, measurements, showToast, onGenerateInvoice }) {
  const { addOrder, deleteOrder, updateOrderStatus, updateOrderStage } = useOrders()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openOrderModal', handler)
    return () => document.removeEventListener('openOrderModal', handler)
  }, [])

  return (
    <>
      {orders.map(o => (
        <div key={o.id} onClick={() => setDetailOrder(o)}>
          {o.desc}
        </div>
      ))}
    </>
  )
}