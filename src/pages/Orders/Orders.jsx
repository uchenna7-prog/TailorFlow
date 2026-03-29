import { useState, useEffect } from 'react';
import styles from './Orders.module.css';
import { useOrders } from '../../contexts/OrdersContext'; // assuming you have a context

export default function Orders() {
  const { orders } = useOrders(); // all orders from context or API
  const [filter, setFilter] = useState('all'); // all, pending, completed, overdue

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'completed') return order.status === 'completed';
    if (filter === 'overdue') return order.status === 'overdue';
    return true;
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