// src/pages/Tasks/Tasks.jsx
// ─────────────────────────────────────────────────────────────
// Uses TaskContext (Firestore) instead of localStorage.
// Orders for a selected customer are loaded via orderService.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth }      from '../../contexts/AuthContext'
import { useTasks }     from '../../contexts/TaskContext'
import { useCustomers } from '../../contexts/CustomerContext'
import { subscribeToOrders } from '../../services/orderService'
import Header       from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast        from '../../components/Toast/Toast'
import styles from './Tasks.module.css'

// ── Helpers ───────────────────────────────────────────────────

const PRIORITY_LABELS = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }
const PRIORITY_COLORS = {
  low:    { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8' },
  normal: { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.4)',  text: '#818cf8' },
  high:   { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.4)',  text: '#fb923c' },
  urgent: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   text: '#ef4444' },
}

// ── Status text colours for task cards ───────────────────────
const TASK_STATUS_TEXT = {
  pending:  { color: '#856404' },
  done:     { color: '#155724' },
  overdue:  { color: '#721C24' },
}

// ── Status pill styles (matches Home page) ────────────────────
const TASK_STATUS_STYLES = {
  completed: { bg: 'rgba(34,197,94,0.12)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'   },
  overdue:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', border: 'rgba(239,68,68,0.3)'   },
  pending:   { bg: 'rgba(234,179,8,0.12)',   color: '#a16207', border: 'rgba(234,179,8,0.3)'   },
}

const CATEGORY_ICONS = {
  general: 'assignment', sewing: 'content_cut', delivery: 'local_shipping',
  payment: 'payments',   fitting: 'checkroom',  shopping: 'shopping_cart',
}

const CATEGORIES = [
  { id: 'general',  label: 'General',  icon: 'assignment'     },
  { id: 'sewing',   label: 'Sewing',   icon: 'content_cut'    },
  { id: 'delivery', label: 'Delivery', icon: 'local_shipping'  },
  { id: 'payment',  label: 'Payment',  icon: 'payments'       },
  { id: 'fitting',  label: 'Fitting',  icon: 'checkroom'      },
  { id: 'shopping', label: 'Shopping', icon: 'shopping_cart'  },
]

function isOverdue(task) {
  if (!task.dueDate || task.done) return false
  return new Date(task.dueDate + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr + 'T00:00:00')
  const diff  = Math.round((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `${diff}d left`
}

// ── Add Task Modal ────────────────────────────────────────────

function AddTaskModal({ isOpen, onClose, onSave, customers }) {
  const { user } = useAuth()

  const [desc,         setDesc]         = useState('')
  const [notes,        setNotes]        = useState('')
  const [priority,     setPriority]     = useState('normal')
  const [dueDate,      setDueDate]      = useState('')
  const [dueTime,      setDueTime]      = useState('')
  const [reminder,     setReminder]     = useState(false)
  const [custQuery,    setCustQuery]    = useState('')
  const [selectedCust, setSelectedCust] = useState(null)
  const [custDropOpen, setCustDropOpen] = useState(false)
  const [selectedOrder,setSelectedOrder]= useState(null)
  const [orderDropOpen,setOrderDropOpen]= useState(false)
  const [category,     setCategory]     = useState('general')
  const [custOrders,   setCustOrders]   = useState([])

  useEffect(() => {
    if (!user || !selectedCust) { setCustOrders([]); return }
    const unsub = subscribeToOrders(
      user.uid, selectedCust.id,
      (orders) => setCustOrders(orders),
      (err)    => console.error('[Tasks] custOrders:', err)
    )
    return unsub
  }, [user, selectedCust])

  const filteredCusts = custQuery.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custQuery.toLowerCase()) || c.phone?.includes(custQuery))
    : customers

  const reset = () => {
    setDesc(''); setNotes(''); setPriority('normal'); setDueDate(''); setDueTime('')
    setReminder(false); setCustQuery(''); setSelectedCust(null); setCustDropOpen(false)
    setSelectedOrder(null); setOrderDropOpen(false); setCategory('general'); setCustOrders([])
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (!desc.trim()) return
    onSave({
      desc:         desc.trim(),
      notes:        notes.trim(),
      priority,
      dueDate,
      dueTime,
      reminder,
      category,
      customerId:   selectedCust  ? String(selectedCust.id)  : null,
      customerName: selectedCust  ? selectedCust.name        : null,
      orderId:      selectedOrder ? String(selectedOrder.id) : null,
      orderDesc:    selectedOrder ? selectedOrder.desc       : null,
      done:         false,
    })
    reset()
    onClose()
  }

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ''}`}>
      <Header 
        type="back" 
        title="New Task" 
        onBackClick={handleClose} 
        customActions={[
          { label: 'Add', onClick: handleSave, color: 'var(--accent)' }
        ]}
      />

      <div className={styles.modalBody}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>What needs to be done? *</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Finish sewing the Senator suit for Uchendu"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
          />
        </div>

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

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Priority</label>
          <div className={styles.priorityRow}>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`${styles.priorityChip} ${priority === key ? styles.priorityActive : ''}`}
                style={priority === key ? {
                  background:  PRIORITY_COLORS[key].bg,
                  borderColor: PRIORITY_COLORS[key].border,
                  color:       PRIORITY_COLORS[key].text,
                } : {}}
                onClick={() => setPriority(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Due Date</label>
            <input type="date" className={styles.input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Due Time</label>
            <input type="time" className={styles.input} value={dueTime} onChange={e => setDueTime(e.target.value)} />
          </div>
        </div>

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
                placeholder="Search client name or phone…"
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
                        setSelectedCust(c); setCustQuery(''); setCustDropOpen(false); setSelectedOrder(null)
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

        {selectedCust && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Related Order <span className={styles.optional}>(optional)</span></label>
            {selectedOrder ? (
              <div className={styles.selectedChip}>
                <span className={styles.chipName}>
                  <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>content_cut</span>
                  {selectedOrder.desc}
                </span>
                <button className={styles.chipRemove} onClick={() => setSelectedOrder(null)}>
                  <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                </button>
              </div>
            ) : (
              <div className={styles.orderDropWrap}>
                <button className={styles.orderDropBtn} onClick={() => setOrderDropOpen(p => !p)}>
                  <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>assignment</span>
                  <span>{custOrders.length === 0 ? 'No orders for this client' : 'Select an order…'}</span>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 'auto' }}>expand_more</span>
                </button>
                {orderDropOpen && custOrders.length > 0 && (
                  <div className={styles.dropdown}>
                    {custOrders.map(o => (
                      <button key={o.id} className={styles.dropItem} onClick={() => { setSelectedOrder(o); setOrderDropOpen(false) }}>
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

// ── Task List Item ────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete, onOpen, isLast }) {
  const overdue = isOverdue(task)
  const catIcon = CATEGORY_ICONS[task.category] || 'assignment'
  const iconColor = overdue ? '#ef4444' : task.done ? '#22c55e' : '#818cf8'

  return (
    <div
      className={`${styles.taskListItem} ${isLast ? styles.taskListItemLast : ''} ${task.done ? styles.taskListItemDone : ''} ${overdue ? styles.taskListItemOverdue : ''}`}
      onClick={onOpen}
    >
      {/* Left: grey outer box with white inner box */}
      <div className={styles.taskListOuter} style={overdue ? { borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.05)' } : task.done ? { borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.04)' } : undefined}>
        <div className={styles.taskListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: iconColor }}>
            {catIcon}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className={styles.taskListInfo}>
        <div className={`${styles.taskListDesc} ${task.done ? styles.taskListDescDone : ''}`}>{task.desc}</div>

        {task.customerName && (
          <div className={styles.taskListMeta}>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
            <span className={styles.taskListMetaText}>{task.customerName}</span>
          </div>
        )}

        {(() => {
          const statusKey = overdue ? 'overdue' : task.done ? 'completed' : 'pending'
          const sty = TASK_STATUS_STYLES[statusKey]
          const label = statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
          return (
            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: `1px solid ${sty.border}`,
              background: sty.bg,
              color: sty.color,
            }}>
              {label}
            </span>
          )
        })()}

        {task.dueDate && (
          <div className={styles.taskListDue} style={overdue ? { color: '#ef4444' } : {}}>
            Due {formatDate(task.dueDate)}
          </div>
        )}
      </div>

      {/* Right: checkbox + delete */}
      <div className={styles.taskListActions}>
        <button
          className={`${styles.checkbox} ${task.done ? styles.checkboxDone : ''}`}
          onClick={e => { e.stopPropagation(); onToggle(task.id, task.done) }}
        >
          {task.done && <span className="mi" style={{ fontSize: '1rem' }}>check</span>}
        </button>
        <button
          className={styles.taskDeleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(task) }}
        >
          <span className="mi" style={{ fontSize: '1.1rem' }}>delete_outline</span>
        </button>
      </div>
    </div>
  )
}

// ── Task Detail Panel ─────────────────────────────────────────

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
              className={`${styles.statusBtn} ${!task.done ? styles.statusPending : ''}`}
              onClick={() => onToggle(task.id, true)}
            >
              Pending
            </button>
            <button
              className={`${styles.statusBtn} ${task.done ? styles.statusDoneBtn : ''}`}
              onClick={() => onToggle(task.id, false)}
            >
              ✓ Completed
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

// ── Tabs Config ───────────────────────────────────────────────

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'pending',   label: 'Pending'   },
  { id: 'done',      label: 'Completed' },
  { id: 'overdue',   label: 'Overdue'   },
]

// ── Main Page ─────────────────────────────────────────────────

export default function Tasks({ onMenuClick }) {
  const { customers }                               = useCustomers()
  const { tasks, addTask, toggleTask, deleteTask }  = useTasks()

  const [activeTab,  setActiveTab]  = useState('all')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [toastMsg,   setToastMsg]   = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const handleAdd = async (taskData) => {
    try {
      await addTask(taskData)
      showToast('Task added ✓')
    } catch {
      showToast('Failed to add task. Try again.')
    }
  }

  const handleToggle = async (id, currentDone) => {
    try {
      await toggleTask(id, currentDone)
      setDetailTask(prev => prev && String(prev.id) === String(id)
        ? { ...prev, done: !currentDone }
        : prev
      )
    } catch {
      showToast('Failed to update task.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    try {
      await deleteTask(confirmDel.id)
      showToast('Task deleted')
    } catch {
      showToast('Failed to delete task.')
    }
    setConfirmDel(null)
    setDetailTask(null)
  }

  const filtered = tasks.filter(t => {
    if (activeTab === 'all')     return true
    if (activeTab === 'pending') return !t.done && !isOverdue(t)
    if (activeTab === 'done')    return t.done
    if (activeTab === 'overdue') return isOverdue(t)
    return true
  })

  const counts = {
    all:     tasks.length,
    pending: tasks.filter(t => !t.done && !isOverdue(t)).length,
    done:    tasks.filter(t => t.done).length,
    overdue: tasks.filter(t => isOverdue(t)).length,
  }

  // ── Group by due date (fall back to 'No Due Date') ────────
  const grouped = filtered.reduce((acc, t) => {
    const key = t.dueDate ? formatDate(t.dueDate) : 'No Due Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

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
              {activeTab === 'overdue' && "No overdue tasks. You're on track!"}
            </p>
            {activeTab === 'all' && <span className={styles.emptyHint}>Tap + to add your first task</span>}
          </div>
        )}

        {Object.entries(grouped).map(([groupKey, groupTasks]) => (
          <div key={groupKey} className={styles.taskGroup}>
            <div className={styles.taskGroupDate}>{groupKey}</div>
            <div className={styles.taskGroupDivider} />
            {groupTasks.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                isLast={idx === groupTasks.length - 1}
                onToggle={handleToggle}
                onDelete={(t) => setConfirmDel(t)}
                onOpen={() => setDetailTask(task)}
              />
            ))}
          </div>
        ))}
      </div>

      <button className={styles.fab} onClick={() => setModalOpen(true)}>
        <span className="mi">add</span>
      </button>

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        customers={customers}
      />

      {detailTask && (
        <TaskDetail
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onToggle={handleToggle}
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