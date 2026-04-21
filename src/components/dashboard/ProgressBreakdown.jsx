import styles from './ProgressBreakdown.module.css'

// Helper sub-component: renders 3 stars, filled up to `count`
function Stars({ count }) {
  return (
    <div className={styles.stars}>
      {/* Each star checks if its position number is within the count */}
      <span className={count >= 1 ? styles.starFilled : styles.starEmpty}>★</span>
      <span className={count >= 2 ? styles.starFilled : styles.starEmpty}>★</span>
      <span className={count >= 3 ? styles.starFilled : styles.starEmpty}>★</span>
    </div>
  )
}

// Helper sub-component: renders a colour-coded score bar
// pct is a decimal, e.g. 0.85 = 85%
function ScoreBar({ pct }) {
  // Choose a colour based on how well the user scored
  let barColor
  if (pct >= 0.7) {
    barColor = '#22c55e' // Green = passed
  } else if (pct >= 0.4) {
    barColor = '#f59e0b' // Amber = getting close
  } else {
    barColor = '#ef4444' // Red = needs more practice
  }

  const fillStyle = { width: `${Math.round(pct * 100)}%`, background: barColor }

  return (
    <div className={styles.scoreCell}>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={fillStyle} />
      </div>
      <span className={styles.scorePct}>{Math.round(pct * 100)}%</span>
    </div>
  )
}

// Helper: returns the CSS class for the difficulty level badge
function levelColor(level) {
  if (!level) return styles.levelDefault
  const lowerLevel = level.toLowerCase()
  if (lowerLevel === 'beginner')     return styles.levelBeginner
  if (lowerLevel === 'intermediate') return styles.levelIntermediate
  if (lowerLevel === 'advanced')     return styles.levelAdvanced
  return styles.levelDefault
}

export default function ProgressBreakdown({ rows }) {
  // Check that rows is an array and has at least one item before rendering the table
  const rowsIsArray = Array.isArray(rows)
  const hasRows = rowsIsArray && rows.length > 0

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>🥉 Completed</h2>
      {hasRows ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Module</th>
                <th>Category</th>
                <th>Level</th>
                <th>Score</th>
                <th>Stars</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.moduleId}>
                  <td className={styles.moduleCell}>
                    <span className={styles.moduleIcon}>{row.icon}</span>
                    {row.title}
                  </td>
                  <td><span className={styles.categoryBadge}>{row.category}</span></td>
                  <td><span className={`${styles.levelBadge} ${levelColor(row.level)}`}>{row.level}</span></td>
                  <td><ScoreBar pct={row.bestPct} /></td>
                  <td><Stars count={row.stars} /></td>
                  <td className={styles.attemptsCell}>{row.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>No completed modules yet.</div>
      )}
    </div>
  )
}
