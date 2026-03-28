import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import styles from './Home.module.css'

const QUICK_ACTIONS = [
  { icon: 'group',      label: 'Clients',  path: '/customers' },
  { icon: 'assignment', label: 'Tasks',    path: '/tasks' },
  { icon: 'receipt',    label: 'Invoices', path: '/invoices' },
  { icon: 'settings',   label: 'Settings', path: '/settings' },
]

function Home({ onMenuClick }) {
  const navigate = useNavigate()

  return (
    <>
      <Header onMenuClick={onMenuClick} />
      <main className={styles.page}>
      {/* Greeting */}
      <section className={styles.greeting}>
        <p className={styles.greetSub}>Welcome back 👋</p>
        <h1 className={styles.greetTitle}>My Tailor Shop</h1>
      </section>

      {/* Quick actions */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Quick Actions</div>
        <div className={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.path}
              className={styles.quickCard}
              onClick={() => navigate(action.path)}
            >
              <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text2)' }}>
                {action.icon}
              </span>
              <span className={styles.quickLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Overview</div>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statVal}>0</div>
            <div className={styles.statLbl}>Clients</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>0</div>
            <div className={styles.statLbl}>Pending Orders</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>₦0</div>
            <div className={styles.statLbl}>Unpaid</div>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

export default Home
