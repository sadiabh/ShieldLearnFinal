import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Register.module.css'

// List of profile icons the user can choose from
const PROFILE_ICONS = [
  { src: '/images/user-profiles/1.png', alt: 'Briefcase' },
  { src: '/images/user-profiles/2.png', alt: 'Graduation Cap' },
  { src: '/images/user-profiles/3.png', alt: 'Bomb' },
  { src: '/images/user-profiles/4.png', alt: 'Bug' },
  { src: '/images/user-profiles/5.png', alt: 'Icon 5' },
  { src: '/images/user-profiles/6.png', alt: 'Icon 6' },
  { src: '/images/user-profiles/7.png', alt: 'Icon 7' },
  { src: '/images/user-profiles/8.png', alt: 'Icon 8' },
]

export default function Register() {
  // One state variable per form field
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedIcon, setSelectedIcon] = useState(null)  // Index of the chosen icon
  const [contentType, setContentType] = useState('')       // 'professional', 'student', or 'learning'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  // Called when the registration form is submitted
  async function handleSubmit(e) {
    e.preventDefault() // Stop the page from refreshing
    setError('')

    // Simple validation before sending to the server
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, {
      name,
      phone,
      role: contentType,
      avatarIndex: selectedIcon,
    })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/howto') // Account created — show the guide page before the dashboard
    }
  }

  return (
    <div className={styles.body}>
      <div className={styles.signupContainer}>
        <div className={styles.shieldLogo}>
          <img src="/images/logo.png" alt="logo" />
        </div>

        <h1>Fill out this form to get registered</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Enter your name:</label>
              <input type="text" id="name" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Enter your email address:</label>
              <input type="email" id="email" placeholder="abcd@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="password">Enter your password:</label>
              <input type="password" id="password" placeholder="must be 8 characters long" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span className={styles.passwordHint}>must be 8 characters long</span>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="phone">Enter your phone number:</label>
              <input type="tel" id="phone" placeholder="+447123456788" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {/* Let the user pick what type of learner they are */}
          <div className={styles.tailoredContent}>
            <label>Do you want tailored content? (I am a ...)</label>
            <div className={styles.contentOptions}>

              <div className={styles.contentOption}>
                <input
                  type="radio" id="professional" name="content" value="professional"
                  checked={contentType === 'professional'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <label htmlFor="professional">Professional</label>
              </div>

              <div className={styles.contentOption}>
                <input
                  type="radio" id="student" name="content" value="student"
                  checked={contentType === 'student'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <label htmlFor="student">Student</label>
              </div>

              <div className={styles.contentOption}>
                <input
                  type="radio" id="learning" name="content" value="learning"
                  checked={contentType === 'learning'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <label htmlFor="learning">I'm here to learn how to stay safe!</label>
              </div>

            </div>
          </div>

          {/* Profile icon picker — clicking an icon sets selectedIcon to its index */}
          <div className={styles.iconSelection}>
            <label>Select an icon:</label>
            <div className={styles.iconGrid}>
              {PROFILE_ICONS.map((icon, i) => (
                <div
                  key={i}
                  className={`${styles.iconOption} ${selectedIcon === i ? styles.selected : ''}`}
                  onClick={() => setSelectedIcon(i)}
                >
                  <img src={icon.src} alt={icon.alt} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.doneButton} disabled={loading}>
            {loading ? 'REGISTERING...' : 'DONE!'}
          </button>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </form>

        <div className={styles.loginLink}>
          Already have an account? <Link to="/login">Login here!</Link>
        </div>
      </div>
    </div>
  )
}
