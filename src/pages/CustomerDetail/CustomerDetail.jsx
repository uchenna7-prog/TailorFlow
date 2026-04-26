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
import MeasurementsTab from './tabs/MeasurementsTab'
import OrdersTab       from './tabs/OrdersTab'
import InvoiceTab      from './tabs/InvoiceTab/InvoiceTab'
import PaymentsTab     from './tabs/PaymentsTab/PaymentsTab'
import ReceiptTab      from './tabs/ReceiptTab/ReceiptTab'
import styles from './CustomerDetail.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

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
  { id: 'dress',    label: 'Dress\nMeasurements' },
  { id: 'orders',   label: 'Orders'             },
  { id: 'invoice',  label: 'Invoices'           },
  { id: 'payments', label: 'Payments'           },
  { id: 'receipts', label: 'Receipts'           },
]

// ─────────────────────────────────────────────────────────────
// Helper: read a fresh brand snapshot from localStorage.
// Called at the moment a receipt or invoice is generated so the
// snapshot is frozen to the brand settings active RIGHT NOW.
// Never reads from the live React context — that way changing the
// brand colour later never mutates already-generated documents.
// ─────────────────────────────────────────────────────────────
function readBrandSnapshot(settingsSnap, invoiceBrand) {
  // Priority: localStorage brand fields > context (fallback only)
  return {
    name:     settingsSnap.brandName      || invoiceBrand?.name    || '',
    tagline:  settingsSnap.brandTagline   || invoiceBrand?.tagline || '',
    // Colour MUST come from localStorage first — it is the source of truth
    // for what the user had set at generation time.
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
    if (!form.name.trim())  { return }
    if (!form.phone.trim()) { return }
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
            <input
              className={styles.modalInput}
              value={form.name}
              onChange={set('name')}
              placeholder="Customer name"
            />
          </div>

          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Phone Number *</label>
            <input
              className={styles.modalInput}
              value={form.phone}
              onChange={set('phone')}
              placeholder="Phone number"
              type="tel"
            />
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
            <input
              className={styles.modalInput}
              value={form.email}
              onChange={set('email')}
              placeholder="Email (optional)"
              type="email"
            />
          </div>

          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Birthday</label>
            <input
              className={styles.modalInput}
              value={form.birthday}
              onChange={set('birthday')}
              placeholder="MM-DD"
              maxLength={5}
            />
          </div>

          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Address</label>
            <input
              className={styles.modalInput}
              value={form.address}
              onChange={set('address')}
              placeholder="Address (optional)"
            />
          </div>

          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Notes</label>
            <textarea
              className={`${styles.modalInput} ${styles.modalTextarea}`}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any additional notes…"
              rows={3}
            />
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
          You're about to permanently remove{' '}
          <strong>{customer.name}</strong> from your customer list.
          This action cannot be undone — all their details will be lost forever.
        </p>

        <p className={styles.deleteWarning}>
          ⚠️ Are you absolutely sure you want to continue?
        </p>

        <div className={styles.deleteActions}>
          <button className={styles.deleteCancelBtn} onClick={onCancel}>
            No, Keep Customer
          </button>
          <button className={styles.deleteConfirmBtn} onClick={onConfirm}>
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>delete_forever</span>
            Yes, Delete Customer
          </button>
        </div>
      </div>
    </div>
  )
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
  const [isScrolled,    setIsScrolled]    = useState(false)

  const [editModalOpen,   setEditModalOpen]   = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const toastTimer     = useRef(null)
  const tabsRef        = useRef(null)
  const topSentinelRef = useRef(null)
  const healedRef      = useRef(false)

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

  // ── One-time heal: fix invoices stuck as 'unpaid' that have real payments ──
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
          const paidAmount = (p.installments || []).reduce(
            (s, i) => s + (parseFloat(i.amount) || 0), 0
          )
          if (paidAmount <= 0) continue

          const inv = data.invoices.find(
            i => String(i.orderId) === String(p.orderId) && i.status === 'unpaid'
          )
          if (!inv) continue

          const correctStatus = p.status === 'paid' ? 'paid' : 'part_paid'
          try {
            await data.updateInvoiceStatus(inv.id, correctStatus)
            setInvoicesState(prev =>
              prev.map(i => i.id === inv.id ? { ...i, status: correctStatus } : i)
            )
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

    // Read settings fresh from localStorage at this exact moment
    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const invNumber   = `INV-${String(data.invoices.length + 1).padStart(3, '0')}`
    const today       = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const ids         = order.measurementIds?.length ? order.measurementIds : (order.measurementId ? [order.measurementId] : [])
    const linkedNames = ids.map(mid => data.measurements.find(m => String(m.id) === String(mid))?.name).filter(Boolean)
    const items       = Array.isArray(order.items) ? order.items : []

    // FIX: brand snapshot is frozen from localStorage at generation time only
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
      template: settingsSnap.invoiceTemplate || 'invoiceTemplate1',
      brandSnapshot,
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
    const newStatus = invoiceStatus || 'paid'
    const sourceList = (data.invoices && data.invoices.length > 0)
      ? data.invoices
      : invoicesState
    const matchingInvoice = sourceList.find(
      inv => String(inv.orderId) === String(orderId) && inv.status !== 'paid'
    )
    if (!matchingInvoice) return
    try {
      await data.updateInvoiceStatus(matchingInvoice.id, newStatus)
      setInvoicesState(prev =>
        prev.map(inv =>
          inv.id === matchingInvoice.id ? { ...inv, status: newStatus } : inv
        )
      )
      const label = newStatus === 'part_paid' ? 'Part Payment' : 'Full Payment'
      showToast(`Invoice marked as ${label} ✓`)
    } catch {
      showToast('Could not auto-update invoice.')
    }
  }, [invoicesState, data, showToast])

  const handleGenerateReceipt = useCallback(async (payment) => {
    if (!user) return

    // Read settings fresh from localStorage at this exact moment
    // This freezes the brand at generation time — changes to the brand
    // profile AFTER this point will not affect this receipt.
    let settingsSnap = {}
    try { settingsSnap = JSON.parse(localStorage.getItem('tailorbook_settings') || '{}') } catch {}

    const todayStr        = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const allInstallments = payment.installments || []

    if (allInstallments.length === 0) {
      showToast('No payments recorded yet — nothing to receipt.')
      return
    }

    // Work out which installments are genuinely new (not on any prior receipt)
    const usedInstallmentIds = new Set(
      receipts
        .filter(r => String(r.paymentId) === String(payment.id))
        .flatMap(r => r.installmentIds || [])
    )

    const newInstallments = allInstallments.filter(
      inst => !usedInstallmentIds.has(String(inst.id))
    )

    // If there are new installments use them; otherwise fall back to all
    // (handles edge case where IDs aren't tracked yet)
    const installmentsForReceipt = newInstallments.length > 0
      ? newInstallments
      : allInstallments

    const receiptInstallmentIds = new Set(installmentsForReceipt.map(i => String(i.id)))

    // Everything NOT on this receipt = historical previous payments
    const previousInstallments = allInstallments
      .filter(inst => !receiptInstallmentIds.has(String(inst.id)))
      .map(inst => ({
        id:     inst.id,
        amount: inst.amount,
        method: inst.method || 'cash',
        date:   inst.date,
      }))

    const previousPaid   = previousInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const cumulativePaid = allInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const orderTotal     = parseFloat(payment.orderPrice) || 0
    const balance        = Math.max(0, orderTotal - cumulativePaid)
    const isFullPay      = balance <= 0

    const order = orders.find(o => String(o.id) === String(payment.orderId))

    const perPaymentCount = receipts.filter(r => String(r.paymentId) === String(payment.id)).length + 1
    const globalCount     = receipts.length + 1
    const rcptNumber      = `RCP-${String(perPaymentCount).padStart(2, '0')}-${String(globalCount).padStart(3, '0')}`

    // FIX: brand snapshot is frozen from localStorage at generation time only
    const brandSnapshot = {
      ...readBrandSnapshot(settingsSnap, invoiceBrand),
      // Override footer for receipts specifically
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
      payments: installmentsForReceipt.map(inst => ({
        id:     inst.id,
        amount: inst.amount,
        method: inst.method || 'cash',
        date:   inst.date,
      })),
      installmentIds: installmentsForReceipt.map(inst => String(inst.id)),
      previousInstallments,
      previousPaid,
      cumulativePaid,
      isFullPayment: isFullPay,
      balance,
      notes: payment.notes || '',
      template: settingsSnap.invoiceTemplate || 'receiptTemplate1',
      brandSnapshot,
    }

    try {
      await addReceipt(user.uid, id, newReceipt)
      showToast(`${rcptNumber} receipt generated ✓`)
      setActiveTab('receipts')
    } catch {
      showToast('Failed to generate receipt. Try again.')
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
    if (window.scrollY > 56) {
      window.scrollTo({ top: 56, behavior: 'auto' })
    }
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)
  const hasPhoto = isPremium && customer.photo

  const handleFabClick = () => {
    if (activeTab === 'dress')    document.dispatchEvent(new CustomEvent('openMeasureModal'))
    if (activeTab === 'orders')   document.dispatchEvent(new CustomEvent('openOrderModal'))
    if (activeTab === 'payments') document.dispatchEvent(new CustomEvent('openPaymentModal'))
  }

  const showFab = ['dress', 'orders', 'payments'].includes(activeTab)

  const tabItemCounts = {
    dress:    data.measurements?.length ?? 0,
    orders:   orders?.length            ?? 0,
    invoice:  invoicesState?.length     ?? 0,
    payments: orders?.filter(o => o.payments?.length).length ?? 0,
    receipts: receipts?.length          ?? 0,
  }
  const activeTabIsEmpty = tabItemCounts[activeTab] === 0

  return (
    <div className={styles.page}>
      <div ref={topSentinelRef} className={styles.sentinel} />

      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : "Customer Details"}
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
        {isPremium ? (
          <div className={styles.profileSection}>
            <div className={styles.leftColumn}>
              <div className={styles.avatar}>
                {hasPhoto
                  ? <img src={customer.photo} className={styles.avatarImg} alt={customer.name} />
                  : initials
                }
              </div>
              {birthday && <div className={styles.birthday}>🎈 {birthday}</div>}
            </div>
            <div className={styles.rightColumn}>
              <div className={styles.name}>{customer.name}{customer.sex && ` (${customer.sex})`}</div>
              <div className={styles.meta}><span className="mi">call</span>{customer.phone}</div>
              {customer.email   && <div className={styles.meta}><span className="mi">mail_outline</span>{customer.email}</div>}
              {customer.address && <div className={styles.meta}><span className="mi">place</span>{customer.address}</div>}
            </div>
          </div>
        ) : (
          <div className={styles.profileSectionFree}>
            <div className={styles.name}>{customer.name}{customer.sex && ` (${customer.sex})`}</div>
            <div className={styles.metaInline}>
              <div className={styles.metaItem}>
                <span className="mi">call</span>
                <span>{customer.phone}</span>
              </div>
              {birthday && (
                <div className={`${styles.metaItem} ${styles.birthday}`}>
                  <span className="mi">cake</span>
                  <span>{birthday}</span>
                </div>
              )}
              {customer.email && (
                <div className={styles.metaItem}>
                  <span className="mi">mail_outline</span>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className={styles.metaItem}>
                  <span className="mi">place</span>
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
            <span className="mi">straighten</span>Full Body Measurements
          </button>
        </div>
      </div>

      <div className={styles.stickyTabsWrapper}>
        <div className={styles.tabs} ref={tabsRef}>
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={(e) => handleTabClick(e, tab.id)}
            >
              {tab.label}
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
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptTab
            receipts={receipts}
            customer={customer}
            orders={orders}
            onDelete={handleDeleteReceipt}
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

      <BottomNav></BottomNav>
    </div>
  )
}
