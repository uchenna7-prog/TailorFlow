import styles from './Contact.module.css'
import Header from '../../components/Header/Header'

const CONTACT = {
  whatsapp:     '+234 800 000 0000',
  phone:        '+234 800 000 0001',
  email:        'support@tailorbook.app',
  website:      'www.tailorbook.app',
  businessName: 'TailorBook',
  billingName:  'TailorBook Technologies',
  address:      '12 Tailor Street, 2nd Floor,\nIkeja, Lagos, Nigeria',
}

function ContactRow({ icon, label, value, href, divider = true }) {
  const inner = (
    <div
      className={`${styles.row} ${href ? styles.rowLink : ''}`}
      style={!divider ? { borderBottom: 'none' } : {}}
    >
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        {label && <div className={styles.rowLabel}>{label}</div>}
        <div className={href ? styles.rowValueLink : styles.rowValue}>{value}</div>
      </div>
      {href && (
        <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>open_in_new</span>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles.anchor}>
        {inner}
      </a>
    )
  }
  return inner
}

function InfoRow({ label, value, divider = true }) {
  return (
    <div className={styles.infoRow} style={!divider ? { borderBottom: 'none' } : {}}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

export default function Contact({ onMenuClick }) {
  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.scrollArea}>

        {/* ── PAGE TITLE ── */}
        <div className={styles.pageTitle}>Contact Us</div>
        <p className={styles.pageSub}>
          Reach out for support, feedback, or any questions about TailorBook.
        </p>

        {/* ── QUICK CONTACT ── */}
        <div className={styles.card}>
          <ContactRow
            icon="chat"
            label="WhatsApp"
            value={CONTACT.whatsapp}
            href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}`}
          />
          <ContactRow
            icon="call"
            label="Phone"
            value={CONTACT.phone}
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
          />
          <ContactRow
            icon="mail"
            label="Email"
            value={CONTACT.email}
            href={`mailto:${CONTACT.email}`}
          />
          <ContactRow
            icon="language"
            label="Website"
            value={CONTACT.website}
            href={`https://${CONTACT.website}`}
            divider={false}
          />
        </div>

        {/* ── BUSINESS INFO ── */}
        <div className={styles.sectionHeader}>
          <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>business</span>
          <span className={styles.sectionLabel}>Business Info</span>
        </div>
        <div className={styles.card}>
          <InfoRow label="Business name" value={CONTACT.businessName} />
          <InfoRow label="Billing name"  value={CONTACT.billingName} />
          <InfoRow label="Address"       value={CONTACT.address} divider={false} />
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
