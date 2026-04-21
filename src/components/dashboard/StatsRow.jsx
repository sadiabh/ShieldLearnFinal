import styles from './StatsRow.module.css'

// Props: all the numbers to display across the four stat cards
export default function StatsRow({ completedCount, totalModules, avgScore, totalStarsEarned, maxStars, overallPct }) {
  // Define each card's content in a plain array so we can loop over them simply.
  // Each object has: icon (emoji), value (the number to show), label (description below)
  const stats = [
    { icon: '📚', value: `${completedCount} / ${totalModules}`, label: 'Modules Completed' },
    { icon: '🎯', value: `${avgScore}%`,                        label: 'Average Score' },
    { icon: '⭐', value: `${totalStarsEarned} / ${maxStars}`,   label: 'Stars Collected' },
    { icon: '🔥', value: `${overallPct}%`,                      label: 'Overall Progress' },
  ]

  return (
    <div className={styles.row}>
      {/* Render one card per stat */}
      {stats.map((s) => (
        <div key={s.label} className={styles.statCard}>
          <div className={styles.icon}>{s.icon}</div>
          <div className={styles.value}>{s.value}</div>
          <div className={styles.label}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
