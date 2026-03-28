import { useLocation, useNavigate } from 'react-router-dom'
import styles from './SideBar.module.css'

const NAV_ITEMS = [
  { path: '/',             icon: 'home',          label: 'Home' },
  { path: '/customers',    icon: 'group',         label: 'Clients' },
  { path: '/tasks',        icon: 'assignment',    label: 'Tasks' },
  { path: '/orders',       icon: 'shopping_cart', label: 'Orders' },
  { path: '/gallery',      icon: 'photo_library', label: 'Gallery' },
  { path: '/settings',     icon: 'settings',      label: 'Settings' },
  { path: '/account',      icon: 'person',        label: 'My Account' },
  { path: '/contact',      icon: 'call',          label: 'Contact Us' },
  { path: '/share',        icon: 'share',         label: 'Share' },
  { path: '/faqs',         icon: 'help_outline',  label: 'FAQs' },
  { path: '/logout',       icon: 'logout',        label: 'Log out' },
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
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />

      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        
        {/* User at the top */}
        <div className={styles.top}>
          <div className={styles.user}>
            <div className={styles.avatar}>UU</div>
            <div>
              <div className={styles.userName}>Uchendu Uchenna</div>
              <div className={styles.userRole}>Tailor · Owner</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
              onClick={() => handleNav(item.path)}
            >
              <span className="mi nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer links */}
        <div className={styles.footer}>
          <button className={styles.footerLink}>Terms & Conditions</button>
          <button className={styles.footerLink}>Refund / Cancellation Policy</button>
          <button className={styles.footerLink}>Privacy Policy</button>
        </div>
      </nav>
    </>
  )
}

export default SideBar