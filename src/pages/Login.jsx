import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  // State variables — each one tracks one piece of data on the form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')       // Error message to show the user
  const [loading, setLoading] = useState(false) // True while waiting for the server

  const { signIn } = useAuth()
  const navigate = useNavigate()

  // Show the unlock icon when the user has started typing a password
  const isUnlocked = password.length > 0

  // Called when the user submits the login form
  async function handleLogin(e) {
    e.preventDefault() // Prevents the browser from refreshing the page (default form behaviour)

    setError('')     // Clear any old error
    setLoading(true) // Show a loading state on the button

    const { error } = await signIn(email, password)

    setLoading(false) // Hide the loading state

    if (error) {
      setError(error.message) // Show the error message below the form
    } else {
      navigate('/dashboard') // Login worked — go to the dashboard
    }
  }

  return (
    <div className={styles.body}>
      <div className={styles.loginContainer}>
        <div className={styles.shieldLogo}>
          <img src="/images/logo.png" alt="ShieldLearn logo" />
        </div>

        {/* Lock/unlock icon changes based on whether the user is typing a password */}
        <div className={styles.unlockContainer}>
          <img
            src={isUnlocked ? '/images/unlock.png' : '/images/lock.png'}
            alt="Lock icon"
            className={`${styles.lockIcon} ${isUnlocked ? styles.animate : ''}`}
          />
        </div>

        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="enter your email here:"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="enter your password here:"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Only render the error message if there is one */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.optionsRow}>
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              remember me?
            </label>
            <a href="#" className={styles.forgotLink}>forgot password?</a>
          </div>

          {/* disabled={loading} stops multiple clicks while waiting for the server */}
          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <div className={styles.registerLink}>
          <Link to="/register">No account? Register here!</Link>
        </div>
      </div>
    </div>
  )
}
