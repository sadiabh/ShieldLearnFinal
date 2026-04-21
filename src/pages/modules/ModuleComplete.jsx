// ModuleComplete.jsx
// The results screen shown after a user finishes a module.
// Displays their score, how many stars they earned, and whether they got the badge.
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/Header'
import styles from './ModuleComplete.module.css'

// Maps each module title to its achievement badge name
const STAR_NAMES = {
  'Intro to Staying Safe':                    'First Steps',
  'Password on Lock!':                        'Keymaster Rookie',
  'Password on Lock 2':                       'Master of Passwords',
  'Shield against Phishers':                  'Master Shield',
  'No more Baiting':                          'Hook, Line & Nope',
  'Ring Ring... Is It a Scam?':               'Ring-Ring Rejector',
  'Scroll Smart: Protecting Yourself Online': 'Scroll Sensei',
  'Human Hacking in Healthcare':              'Healthcare Superstar',
}

export default function ModuleComplete() {
  const navigate = useNavigate()
  const location = useLocation()

  // showStars controls the fade-in animation — it turns true after a short delay
  const [showStars, setShowStars] = useState(false)

  // location.state is passed in from ModulePlayer via navigate('/modules/complete', { state: {...} })
  const state = location.state || {}
  const moduleName = state.moduleName || 'Module'
  const score     = state.score    ?? 0
  const total     = state.total    ?? 10
  const passing   = state.passing  ?? 0.7  // e.g. 0.7 means you need 70% to pass

  // Resolve the achievement star name: prefer the module-specific name, fall back to the DB badge field
  const starName   = STAR_NAMES[moduleName] || state.badge || null
  const moduleIcon = state.moduleIcon || '🛡️'

  const passed     = score / total >= passing
  const percentage = Math.round((score / total) * 100)

  // Trigger the star animation after 300ms so it feels like a reveal
  useEffect(() => {
    const timer = setTimeout(() => setShowStars(true), 300)
    return () => clearTimeout(timer) // Cleanup if we leave the page early
  }, [])

  // Stars earned using the same thresholds as the dashboard:
  // 40%+ = 1 star, 70%+ = 2 stars, 90%+ = 3 stars, below 40% = 0 stars
  let starsEarned = 0
  if (percentage >= 90)      starsEarned = 3
  else if (percentage >= 70) starsEarned = 2
  else if (percentage >= 40) starsEarned = 1

  const starIndexes = [0, 1, 2]

  return (
    <div className={styles.page}>
      <Header title={moduleName} activePage="modules" />
      <div className={styles.container}>
        <img src="/images/logo.png" className={styles.logo} alt="ShieldLearn Logo" />

        {/* Stars row — fades in after the short delay above */}
        <div className={`${styles.starsRow} ${showStars ? styles.visible : ''}`}>
          {starIndexes.map((i) => {
            // Stars with index less than starsEarned get the "earned" (filled) style
            const starClass = i < starsEarned ? styles.starEarned : styles.starEmpty
            // Stagger each star's animation by 0.15 seconds so they pop in one by one
            const delayStyle = { animationDelay: `${i * 0.15}s` }
            return (
              <span key={i} className={`${styles.star} ${starClass}`} style={delayStyle}>
                ★
              </span>
            )
          })}
        </div>

        {/* Big emoji based on pass or fail */}
        {passed
          ? <div className={styles.confetti}>🎉</div>
          : <div className={styles.confetti}>💪</div>
        }

        <h1 className={styles.title}>
          {passed ? 'Congratulations!' : 'Good Effort!'}
        </h1>

        <div className={styles.moduleNameTag}>{moduleName}</div>

        {/* Score card */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreCircle}>
            <div className={styles.scoreNumber}>{score}</div>
            <div className={styles.scoreTotal}>/ {total}</div>
          </div>
          <div className={styles.percentageText}>{percentage}%</div>
        </div>

        {/* Badge earned panel, or retry message */}
        {passed ? (
          <div className={styles.badgeEarned}>
            <div className={styles.badgeIcon}>🏆</div>
            <div className={styles.badgeText}>Badge Earned!</div>
            {starName && <div className={styles.badgeName}>{starName}</div>}
          </div>
        ) : (
          <div className={styles.retryMsg}>
            You need {Math.round(passing * 100)}% to earn the badge. Try again to improve your score!
          </div>
        )}

        <div className={styles.buttonRow}>
          <button className={`${styles.btn} ${styles.btnDashboard}`} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className={`${styles.btn} ${styles.btnModules}`} onClick={() => navigate('/modules')}>
            More Modules
          </button>
        </div>

        <div className={styles.surveyPrompt}>
          <button
            className={`${styles.btn} ${styles.btnSurvey}`}
            onClick={() => navigate('/survey', { state: { moduleName, moduleIcon } })}
          >
            Give Feedback
          </button>
        </div>
      </div>
    </div>
  )
}
