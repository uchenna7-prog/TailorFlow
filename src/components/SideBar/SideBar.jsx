import { useLocation, useNavigate } from 'react-router-dom'
import styles from './SideBar.module.css'

const NAV_ITEMS = [
  { path: '/',             icon: 'home',        label: 'Home' },
  { path: '/customers',    icon: 'group',       label: 'Clients' },
  { path: '/tasks',        icon: 'assignment',  label: 'Tasks' },
  { path: '/orders',       icon: 'shopping_cart', label: 'Orders' },
  { path: '/settings',     icon: 'settings',    label: 'Settings' },
  { path: '/account',      icon: 'person',      label: 'My Account' },
  { path: '/faqs',         icon: 'help_outline', label: 'FAQs' },
  { path: '/logout',       icon: 'logout',      label: 'Log out' },
]

function SideBar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* Backdrop overlay — only rendered when open on mobile */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Brand */}
        <div className={styles.top}>
          <div className={styles.brand}>
            Tailor<span>Book</span>
          </div>
          <div className={styles.tagline}>Customer management</div>
        </div>

        {/* Nav items */}
        <div className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="mi nav-icon">{item.icon}</span>
              {item.label}
              {item.path === '/customers' && (
                <span className={styles.navBadge} id="clientCountBadge">1</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.user}>
            <div className={styles.avatar}>UU</div>
            <div>
              <div className={styles.userName}>Uchendu Uchenna</div>
              
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default SideBar