import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders }    from '../../contexts/OrdersContext'
import { useTasks }     from '../../contexts/TaskContext'
import { useAuth }      from '../../contexts/AuthContext'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

function Home({ onMenuClick }) {
  const navigate = useNavigate()
  const { user }      = useAuth()
  const { customers } = useCustomers()
  const { allOrders } = useOrders()
  const { tasks }     = useTasks()

  const firstName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'there'

  const pendingOrders = allOrders.filter(o => o.status !== 'Ready')
  const pendingTasks  = tasks.filter(t => t.status !== 'Done')
  const unpaidInvoices = allOrders.filter(o => o.paymentStatus !== 'Paid')

  const recentOrders = pendingOrders.slice(0, 4)

  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <span className={styles.dashboardLabel}>Dashboard</span>
          <h1 className={styles.title}>
            Welcome, <span>{firstName}</span>
          </h1>
          <p className={styles.subtitle}>
            Your atelier at a glance
          </p>
        </section>

        {/* STATS */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => navigate('/customers')}>
            <span className={`mi ${styles.statIcon}`}>groups</span>
            <div>
              <div className={styles.statValue}>{customers.length}</div>
              <div className={styles.statLabel}>Customers</div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/orders')}>
            <span className={`mi ${styles.statIcon}`}>content_cut</span>
            <div>
              <div className={styles.statValue}>{pendingOrders.length}</div>
              <div className={styles.statLabel}>Active Orders</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={`mi ${styles.statIcon}`}>receipt_long</span>
            <div>
              <div className={styles.statValue}>{unpaidInvoices.length}</div>
              <div className={styles.statLabel}>Unpaid</div>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => navigate('/tasks')}>
            <span className={`mi ${styles.statIcon}`}>task_alt</span>
            <div>
              <div className={styles.statValue}>{pendingTasks.length}</div>
              <div className={styles.statLabel}>Tasks</div>
            </div>
          </div>
        </section>

        {/* REVENUE */}
        <section className={styles.revenueCard}>
          <span>Total Revenue (Paid)</span>
          <h2>$1,400</h2>
        </section>

        {/* QUICK ACTIONS */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>

          <div className={styles.actionList}>
            <button onClick={() => navigate('/customers')}>
              <span className="mi">person_add</span> Add Customer
            </button>

            <button onClick={() => navigate('/tasks')}>
              <span className="mi">add_task</span> Manage Tasks
            </button>

            <button onClick={() => navigate('/customers')}>
              <span className="mi">arrow_forward</span> View All Customers
            </button>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Orders</h3>

          <div className={styles.ordersCard}>
            {recentOrders.map(order => (
              <div key={order.id} className={styles.orderRow}>
                <div>
                  <div className={styles.orderTitle}>
                    {order.desc ?? 'Order'}
                  </div>
                  <div className={styles.orderCustomer}>
                    {order.customerName}
                  </div>
                </div>

                <div className={styles.orderRight}>
                  <span className={styles.orderPrice}>
                    ₦{order.price ?? 0}
                  </span>
                  <span className={`${styles.badge} ${styles[order.status?.toLowerCase()]}`}>
                    {order.status}
                  </span>
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