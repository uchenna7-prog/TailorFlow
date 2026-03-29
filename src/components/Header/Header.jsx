import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

function Header({ onMenuClick, type = 'default', title, customActions = [] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Default page titles
  const PAGE_TITLES = {
    '/': 'Home',
    '/customers': 'Clients',
    '/tasks': 'Tasks',
    '/settings': 'Settings',
  }
  const pageTitle = title ?? PAGE_TITLES[location.pathname] ?? 'TailorBook'

  const PAGE_DROPDOWN = {
    '/': [
      { icon: 'settings', label: 'Settings', action: () => navigate('/settings') },
      { icon: 'logout', label: 'Log Out', action: () => navigate('/logout'), danger: true },
    ],
    '/customers': [
      { icon: 'download', label: 'Export Clients', action: () => console.log('Export clients') },
      { icon: 'logout', label: 'Log Out', action: () => navigate('/logout'), danger: true },
    ],
    '/tasks': [
      { icon: 'settings', label: 'Settings', action: () => navigate('/settings') },
      { icon: 'logout', label: 'Log Out', action: () => navigate('/logout'), danger: true },
    ],
    '/settings': [
      { icon: 'logout', label: 'Log Out', action: () => navigate('/logout'), danger: true },
    ],
  }

  const toggleDropdown = () => setDropdownOpen(prev => !prev)
  const closeDropdown = () => setDropdownOpen(false)
  const toggleNotif = () => setNotifOpen(prev => !prev)
  const closeNotif = () => setNotifOpen(false)

  const notifications = [
    {
      id: 1,
      icon: '🎂',
      type: 'birthday',
      title: "Upcoming birthday",
      body: "Uchendu Uchenna's birthday is in 2 days.",
      time: 'In 2 days',
      unread: true,
    },
    {
      id: 2,
      icon: '✂️',
      type: 'order',
      title: 'Pending order: Senator Suit',
      body: 'Due Apr 10 — awaiting completion.',
      time: 'Apr 10',
      unread: true,
    },
    {
      id: 3,
      icon: '🧾',
      type: 'invoice',
      title: 'Unpaid: INV-001',
      body: 'Senator Suit · ₦25,000 — awaiting payment.',
      time: 'Mar 28',
      unread: false,
    },
  ]
  const hasUnread = notifications.some(n => n.unread)

  return (
    <>
      <header className={styles.header}>
        {/* Left icon */}
        {type === 'default' && (
          <button className={styles.iconBtn} onClick={onMenuClick} aria-label="Open menu">
            <span className={styles.hamburgerLines}><span /><span /><span /></span>
          </button>
        )}
        {type === 'back' && (
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>arrow_back</span>
          </button>
        )}

        {/* Title */}
        <div className={styles.title}>{pageTitle}</div>

        {/* Right actions */}
        <div className={styles.actions}>
          {type === 'default' && (
            <>
              <button className={styles.iconBtn} onClick={toggleNotif} aria-label="Notifications">
                <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>notifications</span>
                {hasUnread && <span className={styles.notifDot} />}
              </button>

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
            </>
          )}

          {/* Custom actions for back pages (edit/delete/etc.) */}
          {type === 'back' && customActions.map((action, i) => (
            <button key={i} className={styles.iconBtn} onClick={action.onClick} aria-label={action.label}>
              <span className="mi" style={{ fontSize: '1.4rem', color: action.color || 'var(--text2)' }}>{action.icon}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Notification panel (default only) */}
      {type === 'default' && notifOpen && (
        <div className={styles.notifOverlay}>
          <div className={styles.notifPanel}>
            <div className={styles.notifHeader}>
              <span className={styles.notifTitle}>Notifications</span>
              <button className={styles.iconBtn} onClick={closeNotif}>
                <span className="mi" style={{ fontSize: '1.6rem' }}>close</span>
              </button>
            </div>
            <div className={styles.notifBody}>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>
                  <span>🔔</span>
                  <p>You're all caught up!</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}>
                    <div className={`${styles.notifIcon} ${styles[n.type]}`}>{n.icon}</div>
                    <div className={styles.notifContent}>
                      <h5>{n.title}</h5>
                      <p>{n.body}</p>
                      <span className={styles.notifTime}>{n.time}</span>
                    </div>
                    {n.unread && <span className={styles.unreadDot} />}
                  </div>
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
