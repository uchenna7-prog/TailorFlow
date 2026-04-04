import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'
import styles from './Header.module.css'

// ── Notification type colours ─────────────────────────────────
const TYPE_BG = {
  order:       'rgba(168,85,247,0.12)',
  invoice:     'rgba(34,197,94,0.12)',
  task:        'rgba(99,102,241,0.12)',
  appointment: 'rgba(6,182,212,0.12)',
  birthday:    'rgba(251,146,60,0.12)',
}

function timeLabel(timeStr) {
  if (!timeStr) return ''
  // If stored as YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
    const diff = Math.round((new Date(timeStr + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
    if (diff === 0)  return 'Today'
    if (diff === 1)  return 'Tomorrow'
    if (diff === -1) return 'Yesterday'
    if (diff < 0)    return `${Math.abs(diff)}d ago`
    return `In ${diff}d`
  }
  // If stored as "MM-DD" (birthday)
  return timeStr
}

// ── Single notification row ───────────────────────────────────
function NotifItem({ n, onRead }) {
  return (
    <div
      className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}
      onClick={() => n.unread && onRead(n.id)}
    >
      <div className={styles.notifIcon} style={{ background: TYPE_BG[n.type] || 'var(--surface2)' }}>
        {n.icon}
      </div>
      <div className={styles.notifContent}>
        <h5>{n.title}</h5>
        <p>{n.body}</p>
        <span className={styles.notifTime}>{timeLabel(n.time)}</span>
      </div>
      {n.unread && <span className={styles.unreadDot} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function Header({ onMenuClick, onBackClick, type = 'default', title, customActions = [] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifTab,     setNotifTab]     = useState('all')   // 'all' | 'unread' | 'read'
  const navigate = useNavigate()
  const location = useLocation()

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  const PAGE_TITLES = {
    '/':          'Dashboard',
    '/customers': 'Customers',
    '/tasks':     'Tasks',
    '/settings':  'Settings',
  }
  const pageTitle = title ?? PAGE_TITLES[location.pathname] ?? 'TailorFlow'

  const PAGE_DROPDOWN = {
    '/': [
      { icon: 'share',   label: 'Share App',       action: () => console.log('Share app') },
      { icon: 'logout',  label: 'Log Out',          action: () => navigate('/logout'), danger: true },
    ],
    '/customers': [
      { icon: 'download', label: 'Export Clients',  action: () => console.log('Export clients') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/tasks': [
      { icon: 'settings', label: 'Settings',        action: () => navigate('/settings') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/orders': [
      { icon: 'download', label: 'Export Orders',   action: () => console.log('Export orders') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/gallery': [
      { icon: 'upload',   label: 'Upload Image',    action: () => console.log('Upload image') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/settings': [
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/account': [
      { icon: 'edit',     label: 'Edit Profile',    action: () => console.log('Edit profile') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/contact': [
      { icon: 'email',    label: 'Send Message',    action: () => console.log('Send message') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
    '/faqs': [
      { icon: 'help',     label: 'Get Help',        action: () => console.log('Help clicked') },
      { icon: 'logout',   label: 'Log Out',         action: () => navigate('/logout'), danger: true },
    ],
  }

  const toggleDropdown = () => setDropdownOpen(p => !p)
  const closeDropdown  = () => setDropdownOpen(false)

  const openNotif  = () => { setNotifTab('all'); setNotifOpen(true) }
  const closeNotif = () => setNotifOpen(false)

  const handleBackAction = () => {
    if (onBackClick) onBackClick()
    else navigate(-1)
  }

  // ── Filtered lists per tab ────────────────────────────────
  const visibleNotifs = (() => {
    if (notifTab === 'unread') return notifications.filter(n => n.unread)
    if (notifTab === 'read')   return notifications.filter(n => !n.unread)
    return notifications
  })()

  const TABS = [
    { id: 'all',    label: 'All',    count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount          },
    { id: 'read',   label: 'Read',   count: notifications.length - unreadCount },
  ]

  return (
    <>
      <header className={`${styles.header} ${type === 'back' ? styles.backHeader : ''}`}>
        <div className={styles.leftSide}>
          {type === 'default' && (
            <button className={styles.iconBtn} onClick={onMenuClick} aria-label="Open menu">
              <span className={styles.hamburgerLines}><span /><span /><span /></span>
            </button>
          )}
          {type === 'back' && (
            <button className={styles.iconBtn} onClick={handleBackAction} aria-label="Go back">
              <span className="mi" style={{ fontSize: '1.4rem' }}>arrow_back</span>
            </button>
          )}
          <div className={styles.title}>{pageTitle}</div>
        </div>

        {type === 'back' && customActions.length > 0 && (
          <div className={styles.rightActions}>
            {customActions.map((action, i) => (
              <button
                key={i}
                className={action.label ? styles.textBtn : styles.iconBtn}
                onClick={action.onClick}
                aria-label={action.label}
                disabled={action.disabled}
                style={!action.label ? { color: action.color || 'var(--text2)' } : {}}
              >
                {action.icon && (
                  <span
                    className={`mi${action.outlined ? '-outlined' : ''}`}
                    style={{ fontSize: action.label ? '1.1rem' : '1.4rem' }}
                  >
                    {action.icon}
                  </span>
                )}
                {action.label && <span>{action.label}</span>}
              </button>
            ))}
          </div>
        )}

        {type === 'default' && (
          <div className={styles.rightActions}>
            {/* Notification bell */}
            <button className={styles.iconBtn} onClick={openNotif} aria-label="Notifications">
              <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>notifications</span>
              {unreadCount > 0 && (
                <span className={styles.notifDot}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* More menu */}
            <div className={styles.dropdownWrap}>
              <button className={styles.iconBtn} onClick={toggleDropdown} aria-label="More options">
                <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>more_vert</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
                  <div className={styles.dropdown}>
                    {(PAGE_DROPDOWN[location.pathname] ?? []).map((item, i, arr) => (
                      <div key={i}>
                        <button
                          className={`${styles.dropdownItem} ${item.danger ? styles.danger : ''}`}
                          onClick={() => { closeDropdown(); item.action() }}
                        >
                          <span className="mi" style={{ fontSize: '1.2rem', color: item.danger ? 'var(--danger)' : 'var(--text2)' }}>{item.icon}</span>
                          {item.label}
                        </button>
                        {i < arr.length - 1 && <div className={styles.dropdownSeparator} />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── NOTIFICATION PANEL ── */}
      {type === 'default' && notifOpen && (
        <div className={styles.notifOverlay} onClick={e => e.target === e.currentTarget && closeNotif()}>
          <div className={styles.notifPanel}>

            {/* Panel header */}
            <div className={styles.notifHeader}>
              <span className={styles.notifTitle}>Notifications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                <button className={styles.iconBtn} onClick={closeNotif}>
                  <span className="mi" style={{ fontSize: '1.5rem' }}>close</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.notifTabs}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`${styles.notifTabBtn} ${notifTab === t.id ? styles.notifTabActive : ''}`}
                  onClick={() => setNotifTab(t.id)}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`${styles.notifTabBadge} ${t.id === 'unread' && t.count > 0 ? styles.notifTabBadgeAlert : ''}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className={styles.notifBody}>
              {visibleNotifs.length === 0 ? (
                <div className={styles.notifEmpty}>
                  <span className="mi" style={{ fontSize: '2.5rem', opacity: 0.2 }}>
                    {notifTab === 'read' ? 'done_all' : 'notifications_none'}
                  </span>
                  <p>
                    {notifTab === 'unread' ? 'All caught up!' : notifTab === 'read' ? 'No read notifications yet.' : 'No notifications.'}
                  </p>
                </div>
              ) : (
                visibleNotifs.map(n => (
                  <NotifItem key={n.id} n={n} onRead={markRead} />
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}

export default Header
