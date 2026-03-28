import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

const QUICK_ACTIONS = [
  { icon: 'person_add', label: 'New Client', path: '/customers' },
  { icon: 'shopping_bag', label: 'View Orders', path: '/orders' },
  { icon: 'add_task', label: 'New Task', path: '/tasks' },
  { icon: 'receipt_long', label: 'Invoices', path: '/invoices' },
]

const RECENT_ORDERS = [
  { name: 'Senator Wear', client: 'David', due: 'March 30', status: 'Ready' },
  { name: 'Wedding Gown', client: 'Amaka', due: 'April 2', status: 'In Progress' },
]

function Home({ onMenuClick }) {
  const navigate = useNavigate()

  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>
        {/* Greeting */}
        <section className={styles.heroSection}>
          <div className={styles.greetHeader}>
            <span className={styles.greetText}>Welcome back,</span>
            <span className={styles.signatureName}>Uchenna</span>
            <span className={styles.handIcon}>👋</span>
          </div>
          <p className={styles.greetSubText}>
            Here’s what’s happening in your tailoring shop today
          </p>
        </section>

        <div className={styles.sectionDivider} />

        {/* Overview */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Clients</span>
              <span className={styles.statVal}>24</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Orders</span>
              <span className={styles.statVal}>08</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Tasks</span>
              <span className={styles.statVal}>05</span>
            </div>
          </div>
        </section>

        <div className={styles.sectionDivider} />

        {/* Quick Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <div
                key={action.path}
                className={styles.actionBox}
                onClick={() => navigate(action.path)}
              >
                <div className={styles.iconCircle}>
                  <span className={`mi ${styles.icon}`}>{action.icon}</span>
                </div>
                <span className={styles.actionLabel}>{action.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.sectionDivider} />

        {/* Recent Orders */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <button
              className={styles.seeAll}
              onClick={() => navigate('/orders')}
            >
              View list
            </button>
          </div>

          <div className={styles.orderStack}>
            {RECENT_ORDERS.map((order) => (
              <div key={order.name + order.client} className={styles.orderCard}>
                <div className={styles.orderAvatar}>{order.client[0]}</div>

                <div className={styles.orderInfo}>
                  <div className={styles.orderTitle}>{order.name}</div>
                  <div className={styles.orderSubtitle}>
                    For {order.client} • {order.due}
                  </div>
                </div>

                <div
                  className={`${styles.statusBadge} ${
                    order.status === 'Ready' ? styles.ready : ''
                  }`}
                >
                  {order.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home