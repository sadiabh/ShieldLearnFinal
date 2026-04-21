// RecentActivity.jsx
// Shows the user's last 5 quiz attempts with a pass/fail icon, percentage, and star rating.
import styles from './RecentActivity.module.css'

// Works out how many stars (0–3) to show for a given score percentage.
// 40%+ = 1 star, 70%+ = 2 stars, 90%+ = 3 stars, below 40% = 0 stars
function getStars(pct) {
  if (pct >= 0.9)      return 3
  if (pct >= 0.7)      return 2
  if (pct >= 0.4)      return 1
  return 0
}

// Renders up to 3 star characters, filled based on count
function Stars({ count }) {
  return (
    <span>
      <span style={{ color: count >= 1 ? '#f59e0b' : '#d1d5db' }}>★</span>
      <span style={{ color: count >= 2 ? '#f59e0b' : '#d1d5db' }}>★</span>
      <span style={{ color: count >= 3 ? '#f59e0b' : '#d1d5db' }}>★</span>
    </span>
  )
}

// Props:
//   scores — array of score records from the server
export default function RecentActivity({ scores }) {
  // Only show the 5 most recent scores so the list doesn't get too long
  const recentScores = scores.slice(0, 5)

  return (
    <div className={styles.activitySection}>
      <h2>Recent Activity</h2>
      {scores.length === 0 ? (
        // Show a friendly message when there are no scores yet
        <div className={styles.activityItem}>No activity yet. Start a module!</div>
      ) : (
        recentScores.map((s, i) => {
          const pct = s.score / s.total
          const stars = getStars(pct)
          return (
            <div key={i} className={styles.activityItem}>
              {s.passed ? '✅' : '❌'} {s.module_title} {Math.round(pct * 100)}% <Stars count={stars} />
            </div>
          )
        })
      )}
    </div>
  )
}
