import styles from './AchievementBadges.module.css'

// Props:
//   badges      — array of badge objects, each has { id, label, icon, earned }
//   earnedCount — how many stars the user has earned so far
//   progressPct — a number from 0–100 used to size the progress bar
export default function AchievementBadges({ badges, earnedCount, progressPct }) {
  const fillStyle = { width: `${progressPct}%` }

  return (
    <div className={styles.section}>
      <h2>Achievement Stars</h2>

      {/* Render each module's star — lit up (earned) or dim (not yet earned) */}
      <div className={styles.stars}>
        {badges.map((badge) => (
          <div key={badge.id} className={styles.starContainer}>
            <div className={`${styles.star} ${badge.earned ? styles.earned : ''}`}>★</div>
            <div className={styles.starLabel}>{badge.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar shows overall star completion */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={fillStyle} />
      </div>
      <div className={styles.progressText}>{earnedCount} of {badges.length} stars earned</div>

      <div className={styles.achievementText}>
        Score 70% or above on each module to earn its star!
      </div>
    </div>
  )
}
