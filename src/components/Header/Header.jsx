import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

// Map of route paths to page titles
const PAGE_TITLES = {
  '/': 'Home',
  '/customers': 'Clients',
  '/tasks': 'Tasks',
  '/settings': 'Settings',
}

function Header({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TailorBook'

  const toggleDropdown = () => setDropdownOpen(prev => !prev)
  const closeDropdown  = () => setDropdownOpen(false)
  const toggleNotif    = () => setNotifOpen(prev => !prev)
  const closeNotif     = () => setNotifOpen(false)

  // Dummy notifications — replace with real data from context/store later
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
        {/* Hamburger */}
        <button
          className={styles.iconBtn}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <span className={`${styles.hamburgerLines}`}>
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Page title */}
        <div className={styles.title}>{pageTitle}</div>

        {/* Right actions */}
        <div className={styles.actions}>
          {/* Notification bell */}
          <button
            className={styles.iconBtn}
            onClick={toggleNotif}
            aria-label="Notifications"
          >
            <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>
              notifications
            </span>
            {hasUnread && <span className={styles.notifDot} />}
          </button>

          {/* Three-dot dropdown */}
          <div className={styles.dropdownWrap}>
            <button
              className={styles.iconBtn}
              onClick={toggleDropdown}
              aria-label="More options"
            >
              <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>
                more_vert
              </span>
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop to close on outside tap */}
                <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
                <div className={styles.dropdown}>
                  <button className={styles.dropdownItem} onClick={() => { closeDropdown(); navigate('/') }}>
                    <span className="mi">home</span> Home
                  </button>
                  <button className={styles.dropdownItem} onClick={() => { closeDropdown(); navigate('/customers') }}>
                    <span className="mi">group</span> Clients
                  </button>
                  <button className={styles.dropdownItem} onClick={() => { closeDropdown(); navigate('/tasks') }}>
                    <span className="mi">assignment</span> Tasks
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} onClick={() => { closeDropdown(); navigate('/settings') }}>
                    <span className="mi">settings</span> Settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notification panel */}
      {notifOpen && (
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
