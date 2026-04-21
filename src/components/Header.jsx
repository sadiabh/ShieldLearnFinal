import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Header.module.css'

export default function Header({ title, activePage }) {
  // useNavigate lets us go to a different page from inside the component
  const navigate = useNavigate()

  // Get the signOut function and current user from our auth context
  const { signOut, user } = useAuth()

  // Extract just the first name for the greeting, e.g. "Sadia Ahmed" → "Sadia"
  let firstName = ''
  if (user && user.name) {
    const nameParts = user.name.split(' ') // Split full name by spaces
    firstName = nameParts[0]               // Take only the first part
  }

  // Log out and redirect to the login page
  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  // Returns styles.active if the given page matches the current activePage prop.
  // This highlights the correct nav link.
  function getNavClass(page) {
    if (activePage === page) {
      return `${styles.navBtn} ${styles.active}`
    }
    return styles.navBtn
  }

  return (
    <div className={styles.header}>
      {/* Clicking the logo goes back to the dashboard */}
      <Link to="/dashboard">
        <img src="/images/logo.png" alt="ShieldLearn Logo" className={styles.logo} />
      </Link>

      <div className={styles.titleGroup}>
        {/* Show a personalised greeting if we know the user's name */}
        {firstName ? <h1>Welcome back, {firstName}!</h1> : <h1>{title}</h1>}
      </div>

      <nav className={styles.nav}>
        <Link to="/dashboard" className={getNavClass('dashboard')}>Dashboard</Link>
        <Link to="/modules" className={getNavClass('modules')}>All Modules</Link>
        <Link to="/forum" className={getNavClass('forum')}>Forum</Link>
        <Link to="/profile" className={getNavClass('profile')}>Profile</Link>
        <Link to="/ask-al" className={getNavClass('askal')}>Ask AL</Link>
        <button className={`${styles.navBtn} ${styles.logoutBtn}`} onClick={handleLogout}>Logout</button>
      </nav>
    </div>
  )
}
