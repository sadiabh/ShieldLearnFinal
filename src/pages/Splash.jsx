import { useNavigate } from 'react-router-dom'
import styles from './Splash.module.css'

// Splash is the very first page the user sees — a welcome / landing screen.
export default function Splash() {
  // useNavigate gives us a function to send the user to a different page
  const navigate = useNavigate()

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <div className={styles.welcomeTitle}>ShieldLearn</div>
          <div className={styles.welcomeSubtitle}>Your Cybersecurity Learning Platform</div>
        </div>

        {/* Clicking the lock button takes the user to the login page */}
        <button className={styles.lockButton} onClick={() => navigate('/login')}>
          <img src="/images/lock.png" alt="Lock icon" className={styles.lockIcon} />
        </button>

        <p className={styles.tapHint}>Tap to get started</p>
      </div>
    </div>
  )
}
