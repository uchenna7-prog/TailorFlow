import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

function Header({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const PAGE_TITLES = {
    '/': 'Home',
    '/customers': 'Clients',
    '/tasks': 'Tasks',
    '/settings': 'Settings',
  }
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TailorBook'

  // Page-specific dropdown items with icons
  const PAGE_DROPDOWN = {
    '/': [
      { icon: 'logout', label: 'Log Out', action: () => navigate('/logout') },
      { icon: 'settings', label: 'Settings', action: () => navigate('/settings') },
    ],
    '/customers': [
      { icon: 'logout', label: 'Log Out', action: () => navigate('/logout') },
      { icon: 'person_add', label: 'Add Client', action: () => navigate('/customers/add') },
      { icon: 'download', label: 'Export Clients', action: () => console.log('Export clients') },
    ],
    // Add others as needed...
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
        <button className={styles.iconBtn} onClick={onMenuClick} aria-label="Open menu">
          <span className={styles.hamburgerLines}>
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className={styles.title}>{pageTitle}</div>

        <div className={styles.actions}>
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
                        className={styles.dropdownItem}
                        onClick={() => { closeDropdown(); item.action() }}
                      >
                        <span className="mi" style={{ fontSize: '1.2rem', color: 'var(--text2)' }}>{item.icon}</span>
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