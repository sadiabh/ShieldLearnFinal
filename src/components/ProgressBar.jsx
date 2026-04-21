import styles from './ProgressBar.module.css'

// ProgressBar shows how far through a module the user is.
// Props:
//   current     — the question number the user is on (1, 2, 3...)
//   total       — how many questions there are in total
//   accentColor — the colour of the bar (defaults to blue)
export default function ProgressBar({ current, total, accentColor }) {
  // Fall back to blue if no accent colour is provided or if null is passed from the DB
  const color = accentColor || '#3b82f6'

  // Calculate what percentage of the module we have completed
  const percentage = Math.round((current / total) * 100)

  // Build the gradient style string separately so it is easy to read
  // The 'cc' at the end of a hex colour makes it slightly transparent
  const barStyle = {
    width: `${percentage}%`,
    background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
  }

  return (
    <div className={styles.container}>
      {/* Show the question number and percentage as text */}
      <div className={styles.info}>
        <span>Question {current} of {total}</span>
        <span>{percentage}%</span>
      </div>

      {/* The grey track behind the coloured fill */}
      <div className={styles.bar}>
        <div className={styles.fill} style={barStyle} />
      </div>
    </div>
  )
}
