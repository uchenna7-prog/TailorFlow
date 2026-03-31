import { useState, useRef, useCallback, useEffect } from 'react'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast from '../../components/Toast/Toast'
import styles from './Tasks.module.css'

// ── STORAGE ──
const TASKS_KEY = 'tailorbook_tasks'

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTasks(tasks) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)) }
  catch { /* ignore */ }
}

// ── HELPERS ──
const PRIORITY_LABELS = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }
const PRIORITY_COLORS = {
  low:    { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8' },
  normal: { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.4)',  text: '#818cf8' },
  high:   { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.4)',  text: '#fb923c' },
  urgent: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   text: '#ef4444' },
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false
  return new Date(task.dueDate + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `${diff}d left`
}

// ── ADD TASK MODAL ──
function AddTaskModal({ isOpen, onClose, onSave, customers }) {
  const [desc, setDesc]           = useState('')
  const [notes, setNotes]         = useState('')
  const [priority, setPriority]   = useState('normal')
  const [dueDate, setDueDate]     = useState('')
  const [dueTime, setDueTime]     = useState('')
  const [reminder, setReminder]   = useState(false)
  const [custQuery, setCustQuery] = useState('')
  const [selectedCust, setSelectedCust] = useState(null)
  const [custDropOpen, setCustDropOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDropOpen, setOrderDropOpen] = useState(false)
  const [category, setCategory]   = useState('general')

  const ORDERS_FOR_CUST = selectedCust
    ? (() => {
        try {
          const raw = localStorage.getItem(`tailorbook_orders_${selectedCust.id}`)
          return raw ? JSON.parse(raw) : []
        } catch { return [] }
      })()
    : []

  const filteredCusts = custQuery.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custQuery.toLowerCase()) || c.phone?.includes(custQuery))
    : customers

  const reset = () => {
    setDesc(''); setNotes(''); setPriority('normal'); setDueDate(''); setDueTime('')
    setReminder(false); setCustQuery(''); setSelectedCust(null); setCustDropOpen(false)
    setSelectedOrder(null); setOrderDropOpen(false); setCategory('general')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (!desc.trim()) return
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    onSave({
      id: Date.now() + Math.random(),
      desc: desc.trim(),
      notes: notes.trim(),
      priority,
      dueDate,
      dueTime,
      reminder,
      category,
      customerId:    selectedCust  ? String(selectedCust.id)   : null,
      customerName:  selectedCust  ? selectedCust.name         : null,
      orderId:       selectedOrder ? String(selectedOrder.id)  : null,
      orderDesc:     selectedOrder ? selectedOrder.desc        : null,
      status: 'pending',
      createdAt: today,
    })
    reset()
    onClose()
  }

  const CATEGORIES = [
    { id: 'general',     label: 'General',     icon: 'assignment' },
    { id: 'sewing',      label: 'Sewing',       icon: 'content_cut' },
    { id: 'delivery',    label: 'Delivery',     icon: 'local_shipping' },
    { id: 'payment',     label: 'Payment',      icon: 'payments' },
    { id: 'fitting',     label: 'Fitting',      icon: 'checkroom' },
    { id: 'shopping',    label: 'Shopping',     icon: 'shopping_cart' },
  ]

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <div className={styles.modalHeader}>
        <button className={styles.modalClose} onClick={handleClose}>
          <span className="mi" style={{ fontSize: '1.5rem' }}>arrow_back</span>
        </button>
        <span className={styles.modalTitle}>New Task</span>
        <button className={styles.headerSaveBtn} onClick={handleSave}>Add</button>
      </div>

      <div className={styles.modalBody}>
        {/* Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>What needs to be done? *</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Finish sewing the Senator suit..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
          />
        </div>

        {/* Category */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Category</label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`${styles.categoryChip} ${category === cat.id ? styles.categoryActive : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="mi" style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Priority</label>
          <div className={styles.priorityRow}>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`${styles.priorityChip} ${priority === key ? styles.priorityActive : ''}`}
                style={priority === key ? {
                  background: PRIORITY_COLORS[key].bg,
                  borderColor: PRIORITY_COLORS[key].border,
                  color: PRIORITY_COLORS[key].text,
                } : {}}
                onClick={() => setPriority(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date & time */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Due Date</label>
            <input
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Due Time</label>
            <input
              type="time"
              className={styles.input}
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
            />
          </div>
        </div>

        {/* Reminder toggle */}
        <div className={styles.fieldGroup}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Reminder</div>
              <div className={styles.toggleSub}>Get notified when due</div>
            </div>
            <button
              className={`${styles.toggle} ${reminder ? styles.toggleOn : ''}`}
              onClick={() => setReminder(p => !p)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        {/* Related Customer */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Related Client <span className={styles.optional}>(optional)</span></label>
          {selectedCust ? (
            <div className={styles.selectedChip}>
              <div className={styles.chipAvatar}>
                {selectedCust.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <span className={styles.chipName}>{selectedCust.name}</span>
              <button className={styles.chipRemove} onClick={() => { setSelectedCust(null); setSelectedOrder(null) }}>
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
          ) : (
            <div className={styles.searchWrap}>
              <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search client name..."
                value={custQuery}
                onChange={e => { setCustQuery(e.target.value); setCustDropOpen(true) }}
                onFocus={() => setCustDropOpen(true)}
              />
              {custDropOpen && custQuery && (
                <div className={styles.dropdown}>
                  {filteredCusts.length === 0 ? (
                    <div className={styles.dropEmpty}>No clients found</div>
                  ) : (
                    filteredCusts.slice(0, 6).map(c => (
                      <button key={c.id} className={styles.dropItem} onClick={() => {
                        setSelectedCust(c); setCustQuery(''); setCustDropOpen(false)
                        setSelectedOrder(null)
                      }}>
                        <div className={styles.dropAvatar}>
                          {c.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.dropName}>{c.name}</div>
                          <div className={styles.dropMeta}>{c.phone}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Order — only shown if customer selected */}
        {selectedCust && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Related Order <span className={styles.optional}>(optional)</span></label>
            {selectedOrder ? (
              <div className={styles.selectedChip}>
                <span className={styles.chipName}><span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>content_cut</span>{selectedOrder.desc}</span>
                <button className={styles.chipRemove} onClick={() => setSelectedOrder(null)}>
                  <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                </button>
              </div>
            ) : (
              <div className={styles.orderDropWrap}>
                <button className={styles.orderDropBtn} onClick={() => setOrderDropOpen(p => !p)}>
                  <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>assignment</span>
                  <span>{ORDERS_FOR_CUST.length === 0 ? 'No orders for this client' : 'Select an order…'}</span>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 'auto' }}>expand_more</span>
                </button>
                {orderDropOpen && ORDERS_FOR_CUST.length > 0 && (
                  <div className={styles.dropdown}>
                    {ORDERS_FOR_CUST.map(o => (
                      <button key={o.id} className={styles.dropItem} onClick={() => {
                        setSelectedOrder(o); setOrderDropOpen(false)
                      }}>
                        <span className="mi" style={{ fontSize: '1.1rem' }}>content_cut</span>
                        <div>
                          <div className={styles.dropName}>{o.desc}</div>
                          <div className={styles.dropMeta}>{o.due ? `Due ${o.due}` : o.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Notes <span className={styles.optional}>(optional)</span></label>
          <textarea
            className={styles.textarea}
            placeholder="Any extra details…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

// ── TASK CARD ──
function TaskCard({ task, onToggle, onDelete, onOpen }) {
  const overdue = isOverdue(task)
  const pc = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal
  const due = daysUntil(task.dueDate)

  const CATEGORY_ICONS = {
    general: 'assignment', sewing: 'content_cut', delivery: 'local_shipping',
    payment: 'payments', fitting: 'checkroom', shopping: 'shopping_cart',
  }

  return (
    <div
      className={`${styles.taskCard} ${task.status === 'done' ? styles.taskDone : ''} ${overdue ? styles.taskOverdue : ''}`}
      onClick={onOpen}
    >
      <div className={styles.priorityBar} style={{ background: pc.text }} />
      <button
        className={`${styles.checkbox} ${task.status === 'done' ? styles.checkboxDone : ''}`}
        onClick={e => { e.stopPropagation(); onToggle(task.id) }}
      >
        {task.status === 'done' && <span className="mi" style={{ fontSize: '1rem' }}>check</span>}
      </button>

      <div className={styles.taskContent}>
        <div className={styles.taskDesc}>{task.desc}</div>
        <div className={styles.taskMeta}>
          {task.category && task.category !== 'general' && (
            <span className={styles.metaChip}>
              <span className="mi" style={{ fontSize: '0.85rem' }}>{CATEGORY_ICONS[task.category]}</span> {task.category}
            </span>
          )}
          {task.customerName && (
            <span className={styles.metaChip}>
              <span className="mi" style={{ fontSize: '0.75rem' }}>person</span>
              {task.customerName}
            </span>
          )}
          {task.dueDate && (
            <span className={`${styles.metaChip} ${overdue ? styles.metaOverdue : ''}`}>
              <span className="mi" style={{ fontSize: '0.75rem' }}>schedule</span>
              {due}
            </span>
          )}
        </div>
      </div>

      <button className={styles.taskDeleteBtn} onClick={e => { e.stopPropagation(); onDelete(task) }}>
        <span className="mi" style={{ fontSize: '1.1rem' }}>delete_outline</span>
      </button>
    </div>
  )
}

// ── TASK DETAIL PANEL ──
function TaskDetail({ task, onClose, onToggle, onDelete }) {
  if (!task) return null
  const overdue = isOverdue(task)
  const pc = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal

  return (
    <div className={styles.detailOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.detailPanel}>
        <div className={styles.detailHandle} />
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>Task Details</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>

        <div className={styles.detailBody}>
          <div className={styles.statusRow}>
            <button
              className={`${styles.statusBtn} ${task.status !== 'done' ? styles.statusPending : ''}`}
              onClick={() => onToggle(task.id, 'pending')}
            >
              Pending
            </button>
            <button
              className={`${styles.statusBtn} ${task.status === 'done' ? styles.statusDoneBtn : ''}`}
              onClick={() => onToggle(task.id, 'done')}
            >
              ✓ Done
            </button>
          </div>

          <p className={styles.detailDesc}>{task.desc}</p>

          <div className={styles.detailGrid}>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Priority</div>
              <span style={{ color: pc.text, fontWeight: 700, fontSize: '0.9rem' }}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Category</div>
              <div className={styles.detailCellVal}>{task.category || 'General'}</div>
            </div>
            {task.dueDate && (
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Due Date</div>
                <div className={`${styles.detailCellVal} ${overdue ? styles.overdueText : ''}`}>
                  {formatDate(task.dueDate)}{task.dueTime ? ` · ${task.dueTime}` : ''}
                </div>
              </div>
            )}
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Created</div>
              <div className={styles.detailCellVal}>{task.createdAt}</div>
            </div>
          </div>

          {(task.customerName || task.orderDesc) && (
            <div className={styles.detailLinked}>
              <div className={styles.detailLinkedLabel}>Linked To</div>
              {task.customerName && (
                <div className={styles.detailLinkedRow}>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>person</span>
                  <span>{task.customerName}</span>
                </div>
              )}
              {task.orderDesc && (
                <div className={styles.detailLinkedRow}>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>content_cut</span>
                  <span>{task.orderDesc}</span>
                </div>
              )}
            </div>
          )}

          {task.notes && (
            <div className={styles.detailNotes}>
              <div className={styles.detailLinkedLabel}>Notes</div>
              <p>{task.notes}</p>
            </div>
          )}

          <button className={styles.detailDeleteBtn} onClick={() => onDelete(task)}>
            <span className="mi" style={{ fontSize: '1rem' }}>delete_outline</span>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TABS CONFIG ──
const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'done',     label: 'Done' },
  { id: 'overdue',  label: 'Overdue' },
]

// ── MAIN PAGE ──
export default function Tasks({ onMenuClick }) {
  const { customers } = useCustomers()
  const [tasks, setTasks]             = useState(() => loadTasks())
  const [activeTab, setActiveTab]     = useState('all')
  const [modalOpen, setModalOpen]     = useState(false)
  const [detailTask, setDetailTask]   = useState(null)
  const [confirmDel, setConfirmDel]   = useState(null)
  const [toastMsg, setToastMsg]       = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  useEffect(() => { saveTasks(tasks) }, [tasks])

  const addTask = (task) => {
    setTasks(prev => [task, ...prev])
    showToast('Task added ✓')
  }

  const toggleTask = (id, forceTo) => {
    setTasks(prev => prev.map(t => {
      if (String(t.id) !== String(id)) return t
      const next = forceTo ?? (t.status === 'done' ? 'pending' : 'done')
      return { ...t, status: next }
    }))
    setDetailTask(prev => prev && String(prev.id) === String(id)
      ? { ...prev, status: forceTo ?? (prev.status === 'done' ? 'pending' : 'done') }
      : prev
    )
  }

  const handleDeleteConfirm = () => {
    if (!confirmDel) return
    setTasks(prev => prev.filter(t => String(t.id) !== String(confirmDel.id)))
    showToast('Task deleted')
    setConfirmDel(null)
    setDetailTask(null)
  }

  const filtered = tasks.filter(t => {
    if (activeTab === 'all')     return true
    if (activeTab === 'pending') return t.status !== 'done' && !isOverdue(t)
    if (activeTab === 'done')    return t.status === 'done'
    if (activeTab === 'overdue') return isOverdue(t)
    return true
  })

  const counts = {
    all:     tasks.length,
    pending: tasks.filter(t => t.status !== 'done' && !isOverdue(t)).length,
    done:    tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
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

      <div className={styles.listArea}>
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>
              {activeTab === 'done' ? 'check_circle' : activeTab === 'overdue' ? 'alarm_on' : 'assignment'}
            </span>
            <p>
              {activeTab === 'all'     && 'No tasks yet.'}
              {activeTab === 'pending' && 'No pending tasks.'}
              {activeTab === 'done'    && 'No completed tasks yet.'}
              {activeTab === 'overdue' && 'No overdue tasks. You\'re on track!'}
            </p>
          </div>
        )}

        {filtered.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={(t) => setConfirmDel(t)}
            onOpen={() => setDetailTask(task)}
          />
        ))}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button className={styles.fab} onClick={() => setModalOpen(true)}>
        <span className="mi">add</span>
      </button>

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTask}
        customers={customers}
      />

      {detailTask && (
        <TaskDetail
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onToggle={toggleTask}
          onDelete={(t) => { setDetailTask(null); setConfirmDel(t) }}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Task?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      <Toast message={toastMsg} />
    </div>
  )
}
