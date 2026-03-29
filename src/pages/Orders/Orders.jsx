import { useState } from 'react';
import styles from './Orders.module.css';
import { useOrders } from '../../contexts/OrdersContext'; // assuming you have a context

export default function Orders() {
  const { orders } = useOrders(); // all orders from context or API
  const [filter, setFilter] = useState('all'); // all, pending, completed, overdue

  
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    overdue: orders.filter(o => o.status === 'overdue').length,
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  return (
    <div className={styles.page}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {['all', 'pending', 'completed', 'overdue'].map(tab => (
          <div
            key={tab}
            className={`${styles.tab} ${filter === tab ? styles.tabActive : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={styles.tabBadge}>{counts[tab]}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className={styles.listArea}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {filter === 'all' && 'No orders yet.'}
              {filter === 'pending' && 'No pending orders yet.'}
              {filter === 'completed' && 'No completed orders yet.'}
              {filter === 'overdue' && 'No overdue orders yet.'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className={`${styles.card} ${
                order.status === 'overdue' ? styles.overdue : ''
              }`}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>
                  Order #{order.id} - {order.customerName}
                </div>
                <div className={styles.cardMeta}>
                  <div className={styles.metaChip}>{order.status}</div>
                  <div className={styles.metaChip}>{order.date}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
