// src/pages/CustomerDetail/CustomerDetail.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers }   from '../../contexts/CustomerContext'
import { usePremium }     from '../../contexts/PremiumContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import { useOrders }      from '../../contexts/OrdersContext'
import { useInvoice }     from '../../contexts/InvoiceContext'
import { addReceipt, subscribeToReceipts, deleteReceipt } from '../../services/receiptService'
import { subscribeToPayments } from '../../services/paymentService'
import { useAuth }        from '../../contexts/AuthContext'
import Header        from '../../components/Header/Header'
import Toast         from '../../components/Toast/Toast'
import MeasurementsTab from './tabs/MeasurementsTab/MeasurementsTab'
import OrdersTab       from './tabs/OrdersTab/OrdersTab'
import InvoiceTab      from './tabs/InvoiceTab/InvoiceTab'
import PaymentsTab     from './tabs/PaymentsTab/PaymentsTab'
import ReceiptTab      from './tabs/ReceiptTab/ReceiptTab'
import styles from './CustomerDetail.module.css'

function fmt(currency, amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getBirthday(birthday) {
  if (!birthday) return null
  const d = new Date(birthday)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TABS = [
  { id: 'dress',    label: 'Measurements' },
  { id: 'orders',   label: 'Orders'       },
  { id: 'invoice',  label: 'Invoices'     },
  { id: 'payments', label: 'Payments'     },
  { id: 'receipts', label: 'Receipts'     },
]

function readBrandSnapshot(settingsSnap, invoiceBrand) {
  return {
    name:     settingsSnap.brandName      || invoiceBrand?.name    || '',
    tagline:  settingsSnap.brandTagline   || invoiceBrand?.tagline || '',
    colour:   settingsSnap.brandColour    || invoiceBrand?.colour  || '#D4AF37',
    colourId: settingsSnap.brandColourId  || invoiceBrand?.colourId || '',
    phone:    settingsSnap.brandPhone     || invoiceBrand?.phone   || '',
    email:    settingsSnap.brandEmail     || invoiceBrand?.email   || '',
    address:  settingsSnap.brandAddress   || invoiceBrand?.address || '',
    logo:     settingsSnap.brandLogo      || invoiceBrand?.logo    || '',
    website:  settingsSnap.brandWebsite   || invoiceBrand?.website || '',
    footer:   settingsSnap.invoiceFooter  || 'Thank you for your patronage 🙏',
    currency: settingsSnap.invoiceCurrency || '₦',
    showTax:  settingsSnap.invoiceShowTax  || false,
    taxRate:  settingsSnap.invoiceTaxRate  || 0,
    dueDays:  settingsSnap.invoiceDueDays  || 7,
  }
}

// ── Photo Overlay ─────────────────────────────────────────────
function PhotoOverlay({ open, onClose, photo, initials, name }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.photoOverlay} onClick={onClose}>
      <button
        className={styles.photoCloseBtn}
        onClick={onClose}
        aria-label="Close"
      >
        <span className="mi">close</span>
      </button>
      <div className={styles.photoBig} onClick={e => e.stopPropagation()}>
        {photo
          ? <img src={photo} alt={name} className={styles.photoBigImg} />
          : <span className={styles.photoBigInitials}>{initials}</span>
        }
      </div>
      <div className={styles.photoNameBig}>{name}</div>
    </div>
  )
}

// ── Edit Customer Modal ───────────────────────────────────────
function EditCustomerModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     customer.name     || '',
    phone:    customer.phone    || '',
    email:    customer.email    || '',
    address:  customer.address  || '',
    birthday: customer.birthday || '',
    sex:      customer.sex      || '',
    notes:    customer.notes    || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim())  return
    if (!form.phone.trim()) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={handleBackdrop}>
      <div className={styles.modalSheet}>
        <div className={styles.modalHeader}>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <span className="mi">close</span>
          </button>
          <span className={styles.modalTitle}>Edit Customer</span>
          <button
            className={styles.modalSaveBtn}
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.phone.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Full Name *</label>
            <input className={styles.modalInput} value={form.name} onChange={set('name')} placeholder="Customer name" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Phone Number *</label>
            <input className={styles.modalInput} value={form.phone} onChange={set('phone')} placeholder="Phone number" type="tel" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Gender</label>
            <div className={styles.modalSexRow}>
              {['Male', 'Female'].map(option => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.modalSexChip} ${form.sex === option ? styles.modalSexChipActive : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, sex: prev.sex === option ? '' : option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Email Address</label>
            <input className={styles.modalInput} value={form.email} onChange={set('email')} placeholder="Email (optional)" type="email" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Birthday</label>
            <input className={styles.modalInput} value={form.birthday} onChange={set('birthday')} placeholder="MM-DD" maxLength={5} />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Address</label>
            <input className={styles.modalInput} value={form.address} onChange={set('address')} placeholder="Address (optional)" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Notes</label>
            <textarea className={`${styles.modalInput} ${styles.modalTextarea}`} value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" rows={3} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────
function DeleteConfirmModal({ customer, onConfirm, onCancel }) {
  if (!customer) return null
  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.deleteSheet}>
        <div className={styles.deleteIconWrap}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--danger)' }}>person_remove</span>
        </div>
        <h4 className={styles.deleteTitle}>Remove This Customer?</h4>
        <p className={styles.deleteMessage}>
          You're about to permanently remove <strong>{customer.name}</strong> from your customer list.
          This action cannot be undone — all their details will be lost forever.
        </p>
        <p className={styles.deleteWarning}>Are you absolutely sure you want to continue?</p>
        <div className={styles.deleteActions}>
          <button className={styles.deleteCancelBtn} onClick={onCancel}>No, Keep Customer</button>
          <button className={styles.deleteConfirmBtn} onClick={onConfirm}>
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>delete_forever</span>
            Yes, Delete Customer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helper: format last order date ───────────────────────────
function formatLastOrderDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d)) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function CustomerDetail({ onMenuClick }) {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { getCustomer, deleteCustomer, updateCustomer } = useCustomers()
  const { isPremium } = usePremium()
  const data          = useCustomerData(id)
  const { getOrders } = useOrders()
  const { template: invoiceTemplate, brand: invoiceBrand } = useInvoice()

  const [activeTab,     setActiveTab]     = useState('dress')
  const [toastMsg,      setToastMsg]      = useState('')
  const [invoicesState, setInvoicesState] = useState([])
  const [receipts,      setReceipts]      = useState([])
  const [payments,      setPayments]      = useState([])
  const [isScrolled,    setIsScrolled]    = useState(false)

  const [editModalOpen,   setEditModalOpen]   = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [photoOpen,       setPhotoOpen]       = useState(false)
  const [notesExpanded,   setNotesExpanded]   = useState(false)

  const toastTimer     = useRef(null)
  const tabsRef        = useRef(null)
  const topSentinelRef = useRef(null)
  const healedRef      = useRef(false)

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const orders = getOrders(id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (data.invoices) setInvoicesState(data.invoices)
  }, [data.invoices])

  useEffect(() => {
    if (!user || !id || healedRef.current) return
    if (!data.invoices || data.invoices.length === 0) return

    const unsubPayments = subscribeToPayments(
      user.uid, id,
      async (payments) => {
        if (healedRef.current) return
        healedRef.current = true
        for (const p of payments) {
          if (!p.orderId) continue
          const paidAmount = (p.installments || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
          if (paidAmount <= 0) continue
          const inv = data.invoices.find(i => String(i.orderId) === String(p.orderId) && i.status === 'unpaid')
          if (!inv) continue
          const correctStatus = p.status === 'paid' ? 'paid' : 'part_paid'
          try {
            await data.updateInvoiceStatus(inv.id, correctStatus)
            setInvoicesState(prev => prev.map(i => i.id === inv.id ? { ...i, status: correctStatus } : i))
          } catch (e) {
            console.error('[CustomerDetail] heal invoice status:', e)
          }
        }
      },
      (err) => console.error('[CustomerDetail] heal payments sub:', err)
    )
    return () => unsubPayments()
  }, [user, id, data.invoices])

  useEffect(() => {
    if (!user || !id) return
    const unsub = subscribeToReceipts(
      user.uid, id,
      (data) => setReceipts(data),
      (err)  => console.error('[CustomerDetail] receipts:', err)
    )
    return unsub
  }, [user, id])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const handleEditSave = useCallback(async (updates) => {
    try {
      await updateCustomer(id, updates)
      showToast('Customer updated ✓')
    } catch {
      showToast('Failed to update customer. Try again.')
      throw new Error('update failed')
    }
  }, [id, updateCustomer, showToast])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteCustomer(id)
      setDeleteModalOpen(false)
      navigate('/customers', { replace: true })
    } catch {
      showToast('Failed to delete customer. Try again.')
      setDeleteModalOpen(false)
    }
  }, [id, deleteCustomer, navigate, showToast])

  const handleGenerateInvoice = useCallback(async (orderId) => {
    const existing = data.invoices.find(inv => String(inv.orderId) === String(orderId))
    if (existing) { showToast('Invoice already exists'); setActiveTab('invoice'); return }

    const order = orders.find(o => String(o.id) === String(orderId))
    if (!order) return

    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const invNumber   = `INV-${String(data.invoices.length + 1).padStart(3, '0')}`
    const today       = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const ids         = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
    const linkedNames = ids.map(mid => data.measurements.find(m => String(m.id) === String(mid))?.name).filter(Boolean)
    const items       = Array.isArray(order.items) ? order.items : []
    const brandSnapshot = readBrandSnapshot(settingsSnap, invoiceBrand)

    const newInvoice = {
      id:        Date.now() + Math.random(),
      orderId,
      number:    invNumber,
      orderDesc: order.desc,
      price:     order.price,
      qty:       order.qty,
      items,
      linkedNames,
      due:       order.due,
      notes:     order.notes,
      status:    'unpaid',
      date:      today,
      template:  settingsSnap.invoiceTemplate || 'invoiceTemplate1',
      brandSnapshot,
      shippingFee:    order.shippingFee    ?? 0,
      discountType:   order.discountType   ?? null,
      discountValue:  order.discountValue  ?? 0,
      discountAmount: order.discountAmount ?? 0,
      taxRate:        order.taxRate        ?? 0,
      taxAmount:      order.taxAmount      ?? 0,
      totalAmount:    order.totalAmount    ?? order.price ?? 0,
    }

    try {
      await data.saveInvoice(newInvoice)
      showToast(`${invNumber} generated ✓`)
      setActiveTab('invoice')
    } catch {
      showToast('Failed to save invoice. Try again.')
    }
  }, [data, orders, showToast, invoiceTemplate, invoiceBrand])

  const handleInvoicePaid = useCallback(async (orderId, invoiceStatus) => {
    const newStatus  = invoiceStatus || 'paid'
    const sourceList = (data.invoices && data.invoices.length > 0) ? data.invoices : invoicesState
    const matchingInvoice = sourceList.find(inv => String(inv.orderId) === String(orderId) && inv.status !== 'paid')
    if (!matchingInvoice) return
    try {
      await data.updateInvoiceStatus(matchingInvoice.id, newStatus)
      setInvoicesState(prev => prev.map(inv => inv.id === matchingInvoice.id ? { ...inv, status: newStatus } : inv))
      const label = newStatus === 'part_paid' ? 'Part Payment' : 'Full Payment'
      showToast(`Invoice marked as ${label} ✓`)
    } catch {
      showToast('Could not auto-update invoice.')
    }
  }, [invoicesState, data, showToast])

  const handleGenerateReceipt = useCallback(async (payment, installment) => {
    if (!user) return
    if (!installment) { showToast('No installment selected.'); return }

    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const todayStr    = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const allInstalls = payment.installments || []
    const orderTotal  = parseFloat(payment.orderPrice) || 0

    const thisInstallIndex = allInstalls.findIndex(i => String(i.id) === String(installment.id))
    const installsUpToThis = thisInstallIndex >= 0 ? allInstalls.slice(0, thisInstallIndex + 1) : [installment]
    const cumulativePaid   = installsUpToThis.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const balance          = Math.max(0, orderTotal - cumulativePaid)
    const isFullPay        = balance <= 0

    const previousInstallments = allInstalls
      .slice(0, Math.max(0, thisInstallIndex))
      .map(inst => ({ id: inst.id, amount: inst.amount, method: inst.method || 'cash', date: inst.date }))
    const previousPaid = previousInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

    const order = orders.find(o => String(o.id) === String(payment.orderId))

    const perPaymentCount = receipts.filter(r => String(r.paymentId) === String(payment.id)).length + 1
    const globalCount     = receipts.length + 1
    const rcptNumber      = `RCP-${String(perPaymentCount).padStart(2, '0')}-${String(globalCount).padStart(3, '0')}`

    const brandSnapshot = {
      ...readBrandSnapshot(settingsSnap, invoiceBrand),
      footer: settingsSnap.receiptFooter || settingsSnap.invoiceFooter || 'Thank you for your payment 🙏',
    }

    const newReceipt = {
      paymentId:  payment.id,
      orderId:    payment.orderId,
      orderDesc:  payment.orderDesc,
      orderPrice: payment.orderPrice,
      items:      order?.items || payment.orderItems || [],
      number:     rcptNumber,
      date:       todayStr,
      payments: [{ id: installment.id, amount: installment.amount, method: installment.method || 'cash', date: installment.date }],
      installmentIds:       [String(installment.id)],
      previousInstallments,
      previousPaid,
      cumulativePaid,
      isFullPayment:        isFullPay,
      balance,
      notes:    payment.notes || '',
      template: settingsSnap.receiptTemplate || 'receiptTemplate1',
      brandSnapshot,
      shippingFee:    order?.shippingFee    ?? 0,
      discountType:   order?.discountType   ?? null,
      discountValue:  order?.discountValue  ?? 0,
      discountAmount: order?.discountAmount ?? 0,
      taxRate:        order?.taxRate        ?? 0,
      taxAmount:      order?.taxAmount      ?? 0,
      totalAmount:    order?.totalAmount    ?? order?.price ?? 0,
    }

    try {
      await addReceipt(user.uid, id, newReceipt)
      showToast(`${rcptNumber} receipt generated ✓`)
    } catch {
      showToast('Failed to generate receipt. Try again.')
      throw new Error('receipt failed')
    }
  }, [user, id, receipts, orders, showToast, invoiceBrand])

  const handleDeleteReceipt = useCallback(async (receiptId) => {
    if (!user) return
    try {
      await deleteReceipt(user.uid, id, receiptId)
      showToast('Receipt deleted')
    } catch {
      showToast('Failed to delete receipt.')
    }
  }, [user, id, showToast])

  useEffect(() => {
    const handleSwitch   = () => setActiveTab('invoice')
    const handleGenerate = (e) => handleGenerateInvoice(e.detail.orderId)
    document.addEventListener('switchToInvoiceTab', handleSwitch)
    document.addEventListener('generateInvoice',    handleGenerate)
    return () => {
      document.removeEventListener('switchToInvoiceTab', handleSwitch)
      document.removeEventListener('generateInvoice',    handleGenerate)
    }
  }, [handleGenerateInvoice])

  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    if (window.scrollY > 56) window.scrollTo({ top: 56, behavior: 'auto' })
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (window.innerWidth > 600) return
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      const tabIds = TABS.map(t => t.id)
      const currentIdx = tabIds.indexOf(activeTab)
      if (dx < 0 && currentIdx < tabIds.length - 1) {
        setActiveTab(tabIds[currentIdx + 1])
      } else if (dx > 0 && currentIdx > 0) {
        setActiveTab(tabIds[currentIdx - 1])
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }, [activeTab])

  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)
  // Show photo if available (premium or not — just check if photo exists)
  const hasPhoto = isPremium && customer.photo

  const lastOrder = orders.length > 0
    ? orders.reduce((latest, o) => {
        const oDate = o.createdAt?.toDate?.() || new Date(o.createdAt || 0)
        const lDate = latest.createdAt?.toDate?.() || new Date(latest.createdAt || 0)
        return oDate > lDate ? o : latest
      }, orders[0])
    : null
  const lastOrderLabel = lastOrder
    ? `${lastOrder.desc || 'Order'} · ${formatLastOrderDate(lastOrder.createdAt?.toDate?.()?.toISOString?.() || lastOrder.createdAt || '')}`
    : null

  const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.price) || 0), 0)
  const totalPaidAcrossPayments = payments.reduce((sum, p) => {
    return sum + (p.installments || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  }, 0)
  const outstanding = Math.max(0, totalSpent - totalPaidAcrossPayments)

  const handleFabClick = () => {
    if (activeTab === 'dress')     document.dispatchEvent(new CustomEvent('openMeasureModal'))
    if (activeTab === 'orders')    document.dispatchEvent(new CustomEvent('openOrderModal'))
    if (activeTab === 'invoice')   document.dispatchEvent(new CustomEvent('openInvoiceModal'))
    if (activeTab === 'payments')  document.dispatchEvent(new CustomEvent('openPaymentModal'))
    if (activeTab === 'receipts')  document.dispatchEvent(new CustomEvent('openReceiptModal'))
  }

  const showFab = ['dress', 'orders', 'invoice', 'payments', 'receipts'].includes(activeTab)

  const tabItemCounts = {
    dress:    data.measurements?.length ?? 0,
    orders:   orders?.length            ?? 0,
    invoice:  invoicesState?.length     ?? 0,
    payments: payments?.length          ?? 0,
    receipts: receipts?.length          ?? 0,
  }
  const activeTabIsEmpty = tabItemCounts[activeTab] === 0

  // ── scrolledAvatar — no right avatar, only left transition avatar
  // Pass null for src when no photo so initials render in left avatar
  const scrolledAvatar = {
    src:      hasPhoto ? customer.photo : null,
    initials: initials,
    onClick:  () => setPhotoOpen(true),
  }

  // ── Stats block ──────────────────────────────────────────────
  const StatsBlock = () => (
    <div className={styles.statsBlock}>
      {totalSpent > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCell}>
            <span className={styles.statAmount}>{fmt("₦", totalSpent)}</span>
            <span className={styles.statLabel}>Total Billed</span>
          </div>
          {outstanding > 0 && (
            <div className={`${styles.statCell} ${styles.statCell_owed}`}>
              <span className={styles.statAmount}>{fmt("₦", outstanding)}</span>
              <span className={styles.statLabel}>Balance Due</span>
            </div>
          )}
          {totalPaidAcrossPayments > 0 && (
            <div className={`${styles.statCell} ${styles.statCell_paid}`}>
              <span className={styles.statAmount}>{fmt("₦", totalPaidAcrossPayments)}</span>
              <span className={styles.statLabel}>Total Paid</span>
            </div>
          )}
          {outstanding === 0 && totalSpent > 0 && (
            <div className={`${styles.statCell} ${styles.statCell_clear}`}>
              <span className={styles.statAmount}>All clear</span>
              <span className={styles.statLabel}>Balance</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div
      className={styles.page}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sentinel to detect when profile scrolls out of view */}
      <div ref={topSentinelRef} className={styles.sentinel} />

      {/* ── Sticky Header ── */}
      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : 'Customer Details'}
          isScrolled={isScrolled}
          scrolledAvatar={scrolledAvatar}
          showRightAvatar={false}
          customActions={[
            {
              icon: 'edit',
              onClick: () => setEditModalOpen(true),
              outlined: true,
            },
            {
              icon: 'delete',
              onClick: () => setDeleteModalOpen(true),
              outlined: true,
              color: 'var(--danger)',
            },
          ]}
        />
      </div>

      <div className={styles.profileContainer}>
        {/* ── Single unified profile section ── */}
        <div className={styles.profileSection}>

          {/* Row: avatar + name/details */}
          <div className={styles.topRow}>
            <div
              className={`${styles.avatar} ${isScrolled ? styles.avatarScrolled : ''}`}
              onClick={() => setPhotoOpen(true)}
              role="button"
              aria-label="View profile photo"
            >
              {hasPhoto
                ? <img src={customer.photo} className={styles.avatarImg} alt={customer.name} />
                : <span className={styles.avatarInitials}>{initials}</span>
              }
            </div>

            <div className={styles.identityBlock}>
              <div className={styles.name}>{customer.name}</div>

              {/* Phone · Sex · Birthday — always one line, no wrap */}
              <div className={styles.metaRow}>
                <span className={styles.metaChip}>
                  <span className="mi">call</span>
                  <span className={styles.metaChipText}>{customer.phone}</span>
                </span>
                {customer.sex && (
                  <>
                    <span className={styles.metaDot} aria-hidden="true">·</span>
                    <span className={styles.metaChip}>
                      <span className="mi">person</span>
                      <span className={styles.metaChipText}>{customer.sex}</span>
                    </span>
                  </>
                )}
                {birthday && (
                  <>
                    <span className={styles.metaDot} aria-hidden="true">·</span>
                    <span className={`${styles.metaChip} ${styles.metaChipBirthday}`}>
                      <span className="mi">cake</span>
                      <span className={styles.metaChipText}>{birthday}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Secondary contact details */}
          {(customer.email || customer.address) && (
            <div className={styles.contactBlock}>
              {customer.email && (
                <div className={styles.contactRow}>
                  <span className="mi">mail_outline</span>
                  <span className={styles.contactText}>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className={styles.contactRow}>
                  <span className="mi">place</span>
                  <span className={styles.contactText}>{customer.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Last order */}
          {lastOrderLabel && (
            <div className={styles.lastOrderBlock}>
              <div className={styles.lastOrderLine}>
                <span className="mi">schedule</span>
                <span className={styles.lastOrderText}>
                  <strong>{lastOrderLabel}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className={styles.notesBlock}>
              <div className={styles.notesLine}>
                <span className="mi">edit_note</span>
                <p
                  className={`${styles.notesText} ${notesExpanded ? styles.notesText_expanded : ''}`}
                  onClick={() => setNotesExpanded(prev => !prev)}
                >
                  {customer.notes}
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <StatsBlock />
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `tel:${customer.phone}`}>
            <span className="mi">call</span>Call
          </button>
          <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `mailto:${customer.email}`}>
            <span className="mi">mail_outline</span>Email
          </button>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => navigate(`/customers/${id}/body-measurements`)}
          >
            <span className="mi">straighten</span>Body Measurements
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.stickyTabsWrapper}>
        <div className={styles.tabs} ref={tabsRef}>
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={(e) => handleTabClick(e, tab.id)}
            >
              <span>{tab.label}</span>
              {tabItemCounts[tab.id] > 0 && (
                <span className={`${styles.tabBadge} ${activeTab === tab.id ? styles.tabBadge_active : ''}`}>
                  {tabItemCounts[tab.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className={styles.tabContent}
        data-empty={activeTabIsEmpty ? 'true' : 'false'}
      >
        {activeTab === 'dress' && (
          <MeasurementsTab
            measurements={data.measurements}
            onSave={data.saveMeasurement}
            onDelete={data.deleteMeasurement}
            showToast={showToast}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            customerId={id}
            orders={orders}
            measurements={data.measurements}
            showToast={showToast}
            onGenerateInvoice={handleGenerateInvoice}
          />
        )}
        {activeTab === 'invoice' && (
          <InvoiceTab
            invoices={invoicesState}
            orders={orders}
            measurements={data.measurements}
            customer={customer}
            onSave={data.saveInvoice}
            onDelete={data.deleteInvoice}
            onStatusChange={data.updateInvoiceStatus}
            onGenerateInvoice={handleGenerateInvoice}
            showToast={showToast}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab
            customerId={id}
            orders={orders}
            showToast={showToast}
            onGenerateReceipt={handleGenerateReceipt}
            onInvoicePaid={handleInvoicePaid}
            onPaymentsChange={setPayments}
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptTab
            receipts={receipts}
            customer={customer}
            orders={orders}
            payments={payments}
            onDelete={handleDeleteReceipt}
            onGenerateReceipt={handleGenerateReceipt}
            showToast={showToast}
          />
        )}
      </div>

      {showFab && (
        <button className={styles.fab} onClick={handleFabClick}>
          <span className="mi">add</span>
        </button>
      )}

      <Toast message={toastMsg} />

      <PhotoOverlay
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        photo={hasPhoto ? customer.photo : null}
        initials={initials}
        name={customer.name}
      />

      {editModalOpen && (
        <EditCustomerModal
          customer={customer}
          onSave={handleEditSave}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          customer={customer}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  )
}