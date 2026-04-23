// src/pages/Reviews/Reviews.jsx

import { useState, useCallback, useRef } from 'react'
import Header    from '../../components/Header/Header'
import Toast     from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import { useReviews } from '../../contexts/ReviewContext'
import styles    from './Reviews.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── Helpers ───────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarDisplay({ rating, size = '1rem' }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className="material-icons"
          style={{
            fontSize: size,
            color: n <= rating ? '#f59e0b' : 'var(--border2)',
          }}
        >
          star
        </span>
      ))}
    </div>
  )
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={styles.starPickerBtn}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <span
            className="material-icons"
            style={{
              fontSize: '2rem',
              color: n <= (hovered || value) ? '#f59e0b' : 'var(--border2)',
              transition: 'color 0.15s',
            }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Status config ─────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  icon: 'schedule'      },
  approved: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   icon: 'check_circle'  },
  rejected: { label: 'Rejected', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)', icon: 'cancel'        },
}

const TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'pending',  label: 'Pending'  },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

// ── Add Review Sheet ──────────────────────────────────────────

function AddReviewSheet({ isOpen, onClose, onSave }) {
  const [customerName,  setCustomerName]  = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [reviewText,    setReviewText]    = useState('')
  const [rating,        setRating]        = useState(0)
  const [errors,        setErrors]        = useState({})

  const reset = () => {
    setCustomerName(''); setCustomerPhone('')
    setReviewText(''); setRating(0); setErrors({})
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    const errs = {}
    if (!customerName.trim()) errs.customerName = 'Name is required'
    if (!reviewText.trim())   errs.reviewText   = 'Review text is required'
    if (rating === 0)         errs.rating       = 'Please select a rating'
    if (Object.keys(errs).length) { setErrors(errs); return }

    onSave({
      customerName:  customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerId:    null,
      review:        reviewText.trim(),
      rating,
      token:         crypto.randomUUID(),
    })
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.sheetOverlay} onClick={handleClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Add Review Manually</span>
          <button className={styles.sheetClose} onClick={handleClose}>
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <div className={styles.sheetBody}>
          {/* Customer name */}
          <label className={styles.fieldLabel}>Customer Name <span className={styles.req}>*</span></label>
          <input
            className={`${styles.input} ${errors.customerName ? styles.inputError : ''}`}
            placeholder="e.g. Emeka Okafor"
            value={customerName}
            onChange={e => { setCustomerName(e.target.value); setErrors(p => ({ ...p, customerName: '' })) }}
          />
          {errors.customerName && <span className={styles.errorMsg}>{errors.customerName}</span>}

          {/* Phone (optional) */}
          <label className={styles.fieldLabel} style={{ marginTop: 16 }}>WhatsApp Number <span className={styles.optional}>(optional)</span></label>
          <input
            className={styles.input}
            placeholder="e.g. 08012345678"
            value={customerPhone}
            type="tel"
            onChange={e => setCustomerPhone(e.target.value)}
          />

          {/* Rating */}
          <label className={styles.fieldLabel} style={{ marginTop: 16 }}>
            Rating <span className={styles.req}>*</span>
          </label>
          <StarPicker value={rating} onChange={(v) => { setRating(v); setErrors(p => ({ ...p, rating: '' })) }} />
          {errors.rating && <span className={styles.errorMsg}>{errors.rating}</span>}

          {/* Review text */}
          <label className={styles.fieldLabel} style={{ marginTop: 16 }}>
            Review <span className={styles.req}>*</span>
          </label>
          <textarea
            className={`${styles.textarea} ${errors.reviewText ? styles.inputError : ''}`}
            placeholder="Write the customer's review here…"
            value={reviewText}
            rows={4}
            onChange={e => { setReviewText(e.target.value); setErrors(p => ({ ...p, reviewText: '' })) }}
          />
          {errors.reviewText && <span className={styles.errorMsg}>{errors.reviewText}</span>}
        </div>

        <div className={styles.sheetFooter}>
          <button className={styles.sheetSaveBtn} onClick={handleSave}>Save Review</button>
        </div>
      </div>
    </div>
  )
}

// ── Review Detail Sheet ───────────────────────────────────────

function ReviewDetailSheet({ review, onClose, onApprove, onReject, onDelete }) {
  if (!review) return null
  const sc = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Review Details</span>
          <button className={styles.sheetClose} onClick={onClose}>
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <div className={styles.sheetBody}>
          {/* Customer info */}
          <div className={styles.detailCustomerRow}>
            <div className={styles.detailAvatar}>
              {review.customerName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className={styles.detailCustomerName}>{review.customerName}</div>
              {review.customerPhone && (
                <div className={styles.detailCustomerPhone}>
                  <span className="material-icons" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>phone</span>
                  {review.customerPhone}
                </div>
              )}
            </div>
            {/* Status pill */}
            <span
              className={styles.statusPill}
              style={{ color: sc.color, background: sc.bg, borderColor: sc.border, marginLeft: 'auto' }}
            >
              <span className="material-icons" style={{ fontSize: '0.75rem' }}>{sc.icon}</span>
              {sc.label}
            </span>
          </div>

          {/* Rating + date */}
          <div className={styles.detailMeta}>
            <StarDisplay rating={review.rating} size="1.1rem" />
            <span className={styles.detailDate}>{formatDate(review.createdAt)}</span>
          </div>

          {/* Review text */}
          <div className={styles.detailReviewBox}>
            <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--text3)', flexShrink: 0 }}>format_quote</span>
            <p className={styles.detailReviewText}>{review.review}</p>
          </div>

          {/* Approval actions — only show for pending */}
          {review.status === 'pending' && (
            <div className={styles.detailActions}>
              <button className={styles.approveBtn} onClick={() => onApprove(review.id)}>
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>check_circle</span>
                Approve
              </button>
              <button className={styles.rejectBtn} onClick={() => onReject(review.id)}>
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>cancel</span>
                Reject
              </button>
            </div>
          )}

          {/* Re-approve if rejected */}
          {review.status === 'rejected' && (
            <button className={styles.approveBtn} style={{ width: '100%', marginTop: 8 }} onClick={() => onApprove(review.id)}>
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>check_circle</span>
              Approve Anyway
            </button>
          )}

          {/* Reject if approved */}
          {review.status === 'approved' && (
            <button className={styles.rejectBtn} style={{ width: '100%', marginTop: 8 }} onClick={() => onReject(review.id)}>
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>cancel</span>
              Remove from Portfolio
            </button>
          )}

          {/* Delete */}
          <button className={styles.deleteBtn} onClick={() => onDelete(review)}>
            <span className="material-icons" style={{ fontSize: '1rem' }}>delete_outline</span>
            Delete Review
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Review Card ───────────────────────────────────────────────

function ReviewCard({ review, onTap, isLast }) {
  const sc = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending
  return (
    <div
      className={`${styles.reviewCard} ${isLast ? styles.reviewCardLast : ''}`}
      onClick={onTap}
    >
      {/* Left — avatar */}
      <div className={styles.cardAvatar}>
        {review.customerName?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      {/* Middle — info */}
      <div className={styles.cardInfo}>
        <div className={styles.cardName}>{review.customerName}</div>
        <StarDisplay rating={review.rating} size="0.85rem" />
        <p className={styles.cardReviewSnippet}>
          {review.review?.length > 80
            ? review.review.slice(0, 80) + '…'
            : review.review}
        </p>
        <span className={styles.cardDate}>{formatDate(review.createdAt)}</span>
      </div>

      {/* Right — status */}
      <span
        className={styles.statusPill}
        style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
      >
        <span className="material-icons" style={{ fontSize: '0.7rem' }}>{sc.icon}</span>
        {sc.label}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Reviews({ onMenuClick }) {
  const { reviews, loading, addReview, approveReview, rejectReview, deleteReview } = useReviews()

  const [activeTab,     setActiveTab]     = useState('all')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [addSheetOpen,  setAddSheetOpen]  = useState(false)
  const [detailReview,  setDetailReview]  = useState(null)
  const [confirmDel,    setConfirmDel]    = useState(null)
  const [toastMsg,      setToastMsg]      = useState('')
  const toastTimer = useRef(null)
  const tabRefs    = useRef({})

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── Filtering ──────────────────────────────────────────────

  const tabFiltered = activeTab === 'all'
    ? reviews
    : reviews.filter(r => r.status === activeTab)

  const filtered = searchQuery.trim()
    ? tabFiltered.filter(r =>
        r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.review?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tabFiltered

  const counts = {
    all:      reviews.length,
    pending:  reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }

  // ── Handlers ──────────────────────────────────────────────

  const handleAddReview = async (data) => {
    try {
      await addReview(data)
      showToast('Review added ✓')
    } catch {
      showToast('Failed to add review')
    }
  }

  const handleApprove = async (id) => {
    try {
      await approveReview(id)
      setDetailReview(prev => prev?.id === id ? { ...prev, status: 'approved' } : prev)
      showToast('Review approved ✓')
    } catch {
      showToast('Failed to approve review')
    }
  }

  const handleReject = async (id) => {
    try {
      await rejectReview(id)
      setDetailReview(prev => prev?.id === id ? { ...prev, status: 'rejected' } : prev)
      showToast('Review rejected')
    } catch {
      showToast('Failed to reject review')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    try {
      await deleteReview(confirmDel.id)
      showToast('Review deleted')
    } catch {
      showToast('Failed to delete review')
    }
    setConfirmDel(null)
    setDetailReview(null)
  }

  return (
    <div className={styles.page}>
      <Header title="Reviews" onMenuClick={onMenuClick} />

      {/* Search + Filter bar */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <span className="material-icons" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
          <input
            className={styles.searchInput}
            placeholder="Search reviews or clients…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
              <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
            </button>
          )}
        </div>
        <button className={styles.filterBtn}>
          <span className="material-icons" style={{ fontSize: '1.2rem' }}>tune</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            ref={el => { tabRefs.current[tab.id] = el }}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              tabRefs.current[tab.id]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
            }}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'pending' && counts.pending > 0 ? styles.tabBadgePending : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* List */}
      <div className={styles.listArea}>
        {loading ? (
          <div className={styles.emptyState}>
            <span className="material-icons" style={{ fontSize: '2.5rem', opacity: 0.2 }}>hourglass_empty</span>
            <p>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-icons" style={{ fontSize: '3rem', opacity: 0.15 }}>rate_review</span>
            <p>
              {searchQuery.trim()
                ? 'No results found.'
                : activeTab === 'all'
                  ? 'No reviews yet.'
                  : `No ${activeTab} reviews.`}
            </p>
            {activeTab === 'all' && !searchQuery.trim() && (
              <span className={styles.emptyHint}>
                Send review links to customers from their order detail,{'\n'}or add one manually below.
              </span>
            )}
          </div>
        ) : (
          <div className={styles.reviewList}>
            {filtered.map((review, idx) => (
              <ReviewCard
                key={review.id}
                review={review}
                isLast={idx === filtered.length - 1}
                onTap={() => setDetailReview(review)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB — add review manually */}
      <button className={styles.fab} onClick={() => setAddSheetOpen(true)}>
        <span className="material-icons">add</span>
      </button>

      {/* Add Review Sheet */}
      <AddReviewSheet
        isOpen={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onSave={handleAddReview}
      />

      {/* Detail Sheet */}
      {detailReview && (
        <ReviewDetailSheet
          review={detailReview}
          onClose={() => setDetailReview(null)}
          onApprove={(id) => { handleApprove(id) }}
          onReject={(id)  => { handleReject(id) }}
          onDelete={(r)   => { setDetailReview(null); setConfirmDel(r) }}
        />
      )}

      {/* Confirm delete */}
      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Review?"
        message="This review will be permanently removed."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      <Toast message={toastMsg} />
      <BottomNav></BottomNav>
    </div>
  )
}
