import { useLocation, useNavigate } from 'react-router-dom'
import styles from './SideBar.module.css'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/customers', label: 'Clients', icon: 'group' },
  { path: '/tasks', label: 'Tasks', icon: 'assignment' },
  { path: '/orders', label: 'Orders', icon: 'shopping_cart' },
  { path: '/gallery', label: 'Gallery', icon: 'photo_library' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
  { path: '/account', label: 'My Account', icon: 'person' },
  { path: '/contact', label: 'Contact Us', icon: 'call' },
  { path: '/share', label: 'Share', icon: 'share' },
  { path: '/faqs', label: 'FAQs', icon: 'help_outline' },
  { path: '/logout', label: 'Log out', icon: 'logout' },
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
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        
        {/* Top branding + user */}
        <div className={styles.top}>
          <div className={styles.brand}>
            Tailor<span>Flow</span>
          </div>
          <div className={styles.tagline}>Smart tailoring workflow</div>

          <div className={styles.user}>
            <div className={styles.avatar}>UU</div>
            <div className={styles.userName}>Uchendu Uchenna</div>
          </div>
        </div>

        {/* Nav links */}
        <div className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
              onClick={() => handleNav(item.path)}
            >
              <span className="mi">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Legal links */}
        <div className={styles.footer}>
          <button className={styles.footerLink}>
            Terms & Conditions
          </button>

          <button className={styles.footerLink}>
            Refund / Cancellation Policy
          </button>

          <button className={styles.footerLink}>
            Privacy Policy
          </button>
        </div>
      </nav>
    </>
  )
}

export default SideBar