import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders }    from '../../contexts/OrdersContext'
import { useTasks }     from '../../contexts/TaskContext'
import { useAuth }      from '../../contexts/AuthContext'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

const QUICK_ACTIONS = [
  { icon: 'person_add',    label: 'New Customer', path: '/customers' },
  { icon: 'shopping_bag',  label: 'View Orders',  path: '/orders' },
  { icon: 'add_task',      label: 'New Task',     path: '/tasks' },
  { icon: 'receipt_long',  label: 'Gallery',      path: '/gallery' },
]

function Home({ onMenuClick }) {
  const navigate = useNavigate()
  const { user }      = useAuth()
  const { customers } = useCustomers()
  const { orders }    = useOrders()
  const { tasks }     = useTasks()

  // Nigerian naming convention: Surname NativeName EnglishName
  // We pick the middle name (native name) for the greeting.
  // If only 1 part → use it. If 2 parts → use first. If 3+ parts → use index [1].
  const greetName = (() => {
    const raw = user?.displayName || user?.email?.split('@')[0] || 'there'
    const parts = raw.trim().split(' ').filter(Boolean)
    if (parts.length >= 3) return parts[1]   // native name (middle)
    if (parts.length === 2) return parts[0]  // first of two
    return parts[0]                          // single name
  })()

  // Recent orders — last 3
  const recentOrders = [...(orders ?? [])].slice(0, 3)

  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>
        {/* Greeting */}
        <section className={styles.heroSection}>
          <div className={styles.greetHeader}>
            <span className={styles.greetText}>Welcome back 👋,</span>
            <span className={styles.signatureName}>{greetName}</span>
          </div>
          <p className={styles.greetSubText}>
            Here's what's happening in your tailoring shop today
          </p>
        </section>

        <div className={styles.sectionDivider} />

        {/* Overview — real counts from Firestore */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard} onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Customers</span>
              <span className={styles.statVal}>{customers?.length ?? 0}</span>
            </div>
            <div className={styles.statCard} onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Orders</span>
              <span className={styles.statVal}>{orders?.length ?? 0}</span>
            </div>
            <div className={styles.statCard} onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Tasks</span>
              <span className={styles.statVal}>{tasks?.length ?? 0}</span>
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

        {/* Recent Orders — live from Firestore */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <button className={styles.seeAll} onClick={() => navigate('/orders')}>
              View list
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              No orders yet. Add customers and create orders to see them here.
            </p>
          ) : (
            <div className={styles.orderStack}>
              {recentOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderAvatar}>
                    {order.clientName?.[0] ?? '?'}
                  </div>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderTitle}>{order.desc ?? order.name ?? 'Order'}</div>
                    <div className={styles.orderSubtitle}>
                      {order.clientName ? `For ${order.clientName}` : ''}{order.due ? ` • Due ${order.due}` : ''}
                    </div>
                  </div>
                  <div className={`${styles.statusBadge} ${order.status === 'Ready' ? styles.ready : ''}`}>
                    {order.status ?? 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Home
