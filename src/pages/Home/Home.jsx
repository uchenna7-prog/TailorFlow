import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

const QUICK_ACTIONS = [
  { icon: 'person_add', label: 'New Client', path: '/customers' },
  { icon: 'straighten', label: 'Measure', path: '/measurements' },
  { icon: 'add_task', label: 'New Task', path: '/tasks' },
  { icon: 'receipt', label: 'Invoice', path: '/invoices' },
];

const URGENT_TASKS = [
  { icon: 'check_circle', name: 'Uchenna New Cloth', due: 'March 26, 2026' },
  { icon: 'check_circle', name: 'Another Task', due: 'March 27, 2026' },
];

function Home() {
  const navigate = useNavigate();

  return (
    <main className={styles.main}>
      
      {/* Overview */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statVal}>2</span>
            <span className={styles.statLabel}>Clients</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal}>1</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal}>0</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <div
              key={action.path}
              className={styles.actionBox}
              onClick={() => navigate(action.path)}
            >
              <span className={`mi ${styles.icon}`}>{action.icon}</span>
              <span>{action.label}</span>
            </div>
          ))}
        </div>
      </section>

      <hr className={styles.divider} />

      {/* Urgent Tasks */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Urgent Tasks</h2>
        </div>
        {URGENT_TASKS.map(task => (
          <div key={task.name} className={styles.taskCard}>
            <span className={`mi ${styles.taskIcon}`}>{task.icon}</span>
            <div className={styles.taskInfo}>
              <div className={styles.taskName}>{task.name}</div>
              <div className={styles.taskDate}>Due: {task.due}</div>
            </div>
            <span className={`mi ${styles.chevron}`}>chevron_right</span>
          </div>
        ))}
      </section>

    </main>
  );
}

export default Home;