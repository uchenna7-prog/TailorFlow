import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useReviews } from '../../contexts/ReviewContext'
import styles from './SideBar.module.css'


const NAV_SECTIONS = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: [
      { path: '/',           label: 'Dashboard', icon: 'dashboard'     },
      { path: '/customers',  label: 'Customers', icon: 'groups'        },
      { path: '/orders',     label: 'Orders',    icon: 'shopping_cart' },
      { path: '/inventory',  label: 'Inventory', icon: 'inventory_2'   },
      { path: '/gallery',    label: 'Gallery',   icon: 'photo_library' },
    ],
  },
  {
    key: 'schedule',
    label: 'Schedule',
    items: [
      { path: '/appointments', label: 'Appointments', icon: 'event'      },
      { path: '/tasks',        label: 'Tasks',        icon: 'assignment' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { path: '/payments', label: 'Payments', icon: 'payments'     },
      { path: '/invoices', label: 'Invoices', icon: 'receipt_long' },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    items: [
      { path: '/reports', label: 'Reports', icon: 'bar_chart'   },
      { path: '/reviews', label: 'Reviews', icon: 'rate_review' },
    ],
  },
  {
    key: 'help',
    label: 'Help',
    items: [
      { path: '/contact', label: 'Contact Us', icon: 'call'         },
      { path: '/faq',     label: 'FAQs',       icon: 'help_outline' },
    ],
  },
  {
    key: 'account',
    label: 'Account',
    items: [
      { path: '/settings', label: 'Settings', icon: 'settings' },
      { path: '/profile',  label: 'Account',  icon: 'person'   },
      { path: '/login',    label: 'Log out',  icon: 'logout', danger: true },
    ],
  },
]

function SideBar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pendingCount } = useReviews()

  const fullName    = user?.displayName || user?.email?.split('@')[0] || 'User'
  const displayName = fullName.split(' ').slice(0, 2).join(' ')
  const initials    = fullName.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

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

        <div className={styles.top}>
          <div className={styles.brand}>Tailor<span>Flow</span></div>
          <div className={styles.tagline}>Smart tailoring workflow</div>
          <div className={styles.user}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.nav}>
            {NAV_SECTIONS.map((section, i) => (
              <div key={section.key} className={`${styles.section} ${i > 0 ? styles.sectionBordered : ''}`}>
                <div className={styles.sectionLabel}>{section.label}</div>
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''} ${item.danger ? styles.danger : ''}`}
                    onClick={() => handleNav(item.path)}
                  >
                    <span className="mi">{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.path === '/reviews' && pendingCount > 0 && (
                      <span className={styles.badge}>{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button className={styles.footerLink}>Terms & Conditions</button>
            <button className={styles.footerLink}>Refund / Cancellation Policy</button>
            <button className={styles.footerLink}>Privacy Policy</button>
          </div>
        </div>

      </nav>
    </>
  )
}

export default SideBar