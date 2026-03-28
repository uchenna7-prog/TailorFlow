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
        {/* Luxury Greeting Section */}
        <section className={styles.heroSection}>
          <div className={styles.greetHeader}>
            <span className={styles.greetSub}>Welcome back</span>
            <span className={styles.sparkle}>✨</span>
          </div>
          <h1 className={styles.signatureName}>Uchenna</h1>
          <p className={styles.greetDesc}>
            Your atelier is active today with <strong>8 premium orders</strong> requiring attention.
          </p>
        </section>

        {/* Business Pulse (Stats) */}
        <section className={styles.section}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Clients</span>
              <span className={styles.statVal}>24</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Active</span>
              <span className={styles.statVal}>08</span>
            </div>
            <div className={styles.statCard + ' ' + styles.statRevenue}>
              <span className={styles.statLabel}>Revenue</span>
              <span className={styles.statVal}>₦120k</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Studio Tools</h2>
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

        {/* Recent Activity */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <button className={styles.seeAll} onClick={() => navigate('/orders')}>See all</button>
          </div>

          <div className={styles.orderStack}>
            {RECENT_ORDERS.map((order) => (
              <div key={order.name + order.client} className={styles.orderCard}>
                <div className={styles.orderLeading}>
                  <div className={styles.orderAvatar}>{order.client[0]}</div>
                </div>
                <div className={styles.orderInfo}>
                  <div className={styles.orderTitle}>{order.name}</div>
                  <div className={styles.orderSubtitle}>For {order.client} • Due {order.due}</div>
                </div>
                <div className={`${styles.statusBadge} ${order.status === 'Ready' ? styles.ready : ''}`}>
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
