import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders }    from '../../contexts/OrdersContext'
import { useTasks }     from '../../contexts/TaskContext'
import { useAuth }      from '../../contexts/AuthContext'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

const QUICK_ACTIONS = [
  { icon: 'person_add',   label: 'New Customer', path: '/customers' },
  { icon: 'shopping_bag', label: 'View Orders',  path: '/orders'    },
  { icon: 'add_task',     label: 'New Task',     path: '/tasks'     },
  { icon: 'photo_library',label: 'Gallery',      path: '/gallery'   },
]

function Home({ onMenuClick }) {
  const navigate = useNavigate()
  const { user }      = useAuth()
  const { customers } = useCustomers()
  const { allOrders } = useOrders()
  const { tasks }     = useTasks()

  const firstName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'there'

  // ✅ FILTERS
  const pendingOrders = allOrders.filter(o => o.status !== 'Ready')
  const pendingTasks  = tasks.filter(t => t.status !== 'Done')

  // ✅ invoices derived from orders
  const unpaidInvoices = allOrders.filter(o => o.paymentStatus !== 'Paid')

  const recentOrders = pendingOrders.slice(0, 3)
  const recentTasks  = pendingTasks.slice(0, 3)

  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>

        {/* Greeting */}
        <section className={styles.heroSection}>
          <div className={styles.greetHeader}>
            <span className={styles.greetText}>Welcome back 👋,</span>
            <span className={styles.signatureName}>{firstName}</span>
          </div>
          <p className={styles.greetSubText}>
            Here's what's happening in your tailoring shop today
          </p>
        </section>

        <div className={styles.sectionDivider} />

        {/* Overview */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard} onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Customers</span>
              <span className={styles.statVal}>{customers?.length ?? 0}</span>
            </div>

            <div className={styles.statCard} onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Pending Orders</span>
              <span className={styles.statVal}>{pendingOrders.length}</span>
            </div>

            <div className={styles.statCard} onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Pending Tasks</span>
              <span className={styles.statVal}>{pendingTasks.length}</span>
            </div>

            {/* ✅ now based on orders */}
            <div className={styles.statCard} onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
              <span className={styles.statLabel}>Unpaid Invoices</span>
              <span className={styles.statVal}>{unpaidInvoices.length}</span>
            </div>
          </div>
        </section>

        <div className={styles.sectionDivider} />

        {/* Quick Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <div key={action.path} className={styles.actionBox} onClick={() => navigate(action.path)}>
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
            <button className={styles.seeAll} onClick={() => navigate('/orders')}>View list</button>
          </div>

          {recentOrders.length === 0 ? (
            <p className={styles.emptyText}>No pending orders.</p>
          ) : (
            <div className={styles.orderStack}>
              {recentOrders.map((order) => (
                <div key={`${order.customerId}-${order.id}`} className={styles.orderCard}>
                  <div className={styles.orderAvatar}>
                    {order.customerName?.[0] ?? '?'}
                  </div>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderTitle}>{order.desc ?? order.name ?? 'Order'}</div>
                    <div className={styles.orderSubtitle}>
                      {order.customerName ? `For ${order.customerName}` : ''}
                      {order.due ? ` • Due ${order.due}` : ''}
                    </div>
                  </div>
                  <div className={styles.statusBadge}>
                    {order.status ?? 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className={styles.sectionDivider} />

        {/* Recent Tasks */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Tasks</h2>
            <button className={styles.seeAll} onClick={() => navigate('/tasks')}>View list</button>
          </div>

          {recentTasks.length === 0 ? (
            <p className={styles.emptyText}>No pending tasks.</p>
          ) : (
            <div className={styles.orderStack}>
              {recentTasks.map((task) => (
                <div key={task.id} className={styles.orderCard}>
                  <div className={styles.orderAvatar}>
                    {task.title?.[0] ?? 'T'}
                  </div>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderTitle}>{task.title}</div>
                    <div className={styles.orderSubtitle}>
                      {task.due ? `Due ${task.due}` : ''}
                    </div>
                  </div>
                  <div className={styles.statusBadge}>
                    {task.status ?? 'Pending'}
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