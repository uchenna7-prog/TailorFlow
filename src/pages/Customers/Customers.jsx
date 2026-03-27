import React, { useState } from "react";
import styles from "./Customers.module.css";

const Customers = () => {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.customersPage}>
      {/* SEARCH */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <span className={`material-icons ${styles.mi}`}>search</span>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* SECTION LABEL */}
      <div className={styles.sectionLabel}>All Clients</div>

      {/* CUSTOMER LIST */}
      <div className={styles.scrollArea}>
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust, idx) => (
            <div key={idx} className={styles.customerCard}>
              <div className={styles.custAvatar}>{cust.initials}</div>
              <div className={styles.custInfo}>
                <div className={styles.custName}>{cust.name}</div>
                <div className={styles.custMeta}>{cust.phone}</div>
              </div>
              <button className={styles.custDeleteBtn}>🗑️</button>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className="material-icons emptyIcon">👤</div>
            <p>No clients yet.</p>
            <span>Tap + to add your first client</span>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="material-icons">add</span>
      </button>

      {/* ADD CUSTOMER FORM */}
      {formOpen && (
        <div className={styles.formOverlay}>
          <div className={styles.formHeader}>
            <button
              className="material-icons"
              onClick={() => setFormOpen(false)}
            >
              arrow_back
            </button>
            <div className={styles.formHeaderTitle}>New Client</div>
            <div style={{ width: 36 }}></div>
          </div>

          <div className={styles.formBody}>
            <div className={styles.photoPicker} onClick={() => {}}>
              <div className={styles.photoPickerInitials}>A</div>
              <div className={styles.camBadge}>📷</div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Name</label>
              <input className={styles.formInput} type="text" />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Phone</label>
              <input className={styles.formInput} type="text" />
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email</label>
                <input className={styles.formInput} type="email" />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Address</label>
                <input className={styles.formInput} type="text" />
              </div>
            </div>
          </div>

          <div className={styles.formSaveBar}>
            <button className={styles.btnSave}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;