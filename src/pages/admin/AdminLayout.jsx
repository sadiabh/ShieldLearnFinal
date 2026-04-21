// AdminLayout.jsx
// The shared layout for all admin pages — renders the sidebar and wraps page content.
// If the logged-in user is not an admin, they are redirected to the dashboard.
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Admin.module.css'

const NAV_ITEMS = [
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/modules',    label: 'Modules',    icon: '📦' },
  { to: '/admin/questions',  label: 'Questions',  icon: '❓' },
  { to: '/admin/surveys',    label: 'Surveys',    icon: '📊' },
  { to: '/admin/forum',      label: 'Forum',      icon: '💬' },
]

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className={styles.adminWrap}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span className={styles.brandIcon}>🛡️</span>
          <div className={styles.brandName}>
            ShieldLearn
            <span>Admin Portal</span>
          </div>
        </div>

        {/* Admin user card — shows who is logged in as admin */}
        <div className={styles.adminUser}>
          <div className={styles.adminAvatar}>👤</div>
          <div className={styles.adminInfo}>
            {/* user.name comes from the AuthContext */}
            <div className={styles.adminName}>{user.name || 'Admin'}</div>
            <div className={styles.adminBadge}>Administrator</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={
                location.pathname === to
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to App
          </Link>
        </div>
      </aside>

      <main className={styles.mainContent}>{children}</main>
    </div>
  )
}
