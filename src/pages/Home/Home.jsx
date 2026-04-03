import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders }    from '../../contexts/OrdersContext'
import { useTasks }     from '../../contexts/TaskContext'
import { useAuth }      from '../../contexts/AuthContext'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

const STATUS_COLORS = {
  'In Progress': '#f59e0b',
  Pending: '#3b82f6',
  Completed: '#22c55e',
  Delivered: '#8b5cf6',
  Unpaid: '#ef4444',
  Paid: '#22c55e',
  Overdue: '#f97316'
}

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
          <h1 className={styles.title}>
            Welcome, <span>{firstName}</span>
          </h1>
          <p className={styles.subtitle}>
            this is what is ....
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
                  <div className={styles.orderTitle}>{order.desc ?? 'Order'}</div>
                  <div className={styles.orderCustomer}>{order.customerName}</div>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderPrice}>₦{order.price ?? 0}</span>
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: STATUS_COLORS[order.status] || '#777', color: '#fff' }}
                  >
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