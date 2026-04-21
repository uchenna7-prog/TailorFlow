import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useReviews } from '../../contexts/ReviewContext'
import styles from './SideBar.module.css'

const NAV_ITEMS = [
  { path: '/',             label: 'Dashboard',    icon: 'dashboard'     },
  { path: '/customers',    label: 'Customers',    icon: 'groups'        },
  { path: '/orders',       label: 'Orders',       icon: 'shopping_cart' },
  { path: '/payments',     label: 'Payments',     icon: 'payments'      },
  { path: '/inventory',    label: 'Inventory',    icon: 'inventory_2'   },
  { path: '/appointments', label: 'Appointments', icon: 'event'         },
  { path: '/tasks',        label: 'Tasks',        icon: 'assignment'    },
  { path: '/invoices',     label: 'Invoices',     icon: 'receipt_long'  },
  { path: '/reports',      label: 'Reports',      icon: 'bar_chart'     },
  { path: '/reviews',      label: 'Reviews',      icon: 'rate_review'   },
  { path: '/gallery',      label: 'Gallery',      icon: 'photo_library' },
  { path: '/settings',     label: 'Settings',     icon: 'settings'      },
  { path: '/profile',      label: 'Account',   icon: 'person'        },
  { path: '/contact',      label: 'Contact Us',   icon: 'call'          },
  { path: '/faq',          label: 'FAQs',         icon: 'help_outline'  },
  { path: '/login',        label: 'Log out',      icon: 'logout'        },
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
            <div className={styles.userName}>{displayName}</div>
          </div>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''} ${item.path === '/login' ? styles.danger : ''}`}
                onClick={() => handleNav(item.path)}
              >
                <span className="mi">{item.icon}</span>
                {item.label}
                {item.path === '/reviews' && pendingCount > 0 && (
                  <span className={styles.badge}>{pendingCount}</span>
                )}
              </button>
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