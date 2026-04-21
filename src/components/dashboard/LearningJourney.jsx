import styles from './LearningJourney.module.css'

// A friendly label shown at the top of the path section for each role
const ROLE_LABELS = {
  student:      '🎓 Student Path',
  professional: '🏥 Healthcare Professional Path',
  learning:     '🌐 General Public Path',
}

// A short description explaining why this path was chosen for the user
const ROLE_DESCRIPTIONS = {
  student:      'Modules chosen to help you stay safe at university and beyond.',
  professional: 'Modules selected to protect you and your patients in a healthcare setting.',
  learning:     'A full tour through the essential skills for staying safe online.',
}

// Props:
//   progressPct        — overall completion % across ALL modules (0–100)
//   userRole           — the user's role: 'student', 'professional', or 'learning'
//   pathModules        — array of { id, title, icon, path, completed } for this user's path
//   pathCompletedCount — how many of the path modules have been completed
export default function LearningJourney({ progressPct, userRole, pathModules, pathCompletedCount }) {
  // Inline style that sets the width of the overall progress bar fill
  const fillStyle = { width: `${progressPct}%` }

  // Work out how wide the path-specific progress bar should be
  // Avoid dividing by zero if pathModules is somehow empty
  const pathTotal = pathModules && pathModules.length > 0 ? pathModules.length : 1
  const pathPct   = Math.round((pathCompletedCount / pathTotal) * 100)
  const pathFillStyle = { width: `${pathPct}%` }

  // Pick the label and description for this user's role
  // Fall back to the 'learning' (general public) values if the role is unknown
  const roleLabel       = ROLE_LABELS[userRole]       || ROLE_LABELS['learning']
  const roleDescription = ROLE_DESCRIPTIONS[userRole] || ROLE_DESCRIPTIONS['learning']

  return (
    <div className={styles.section}>

      {/* ── Overall progress header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.title}>📖 Your Achievement Star Journey</span>
        <span className={styles.pctLabel}>{Math.round(progressPct)}% complete</span>
      </div>

      {/* Overall progress bar: shows completion across every module on the platform */}
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={fillStyle} />
      </div>

      {/* Milestone markers under the overall bar */}
      <div className={styles.milestones}>
        <div className={styles.milestone}>
          <span>🌱</span>
          <span className={styles.milestoneLabel}>Started</span>
        </div>
        <div className={styles.milestone}>
          <span>⚡</span>
          <span className={styles.milestoneLabel}>Halfway</span>
        </div>
        <div className={styles.milestone}>
          <span>🔥</span>
          <span className={styles.milestoneLabel}>Expert</span>
        </div>
        <div className={styles.milestone}>
          <span>🏆</span>
          <span className={styles.milestoneLabel}>Master</span>
        </div>
      </div>

      {/* ── Personalised path section ────────────────────────────────────── */}
      {/* Only show this section if we have path modules to display */}
      {pathModules && pathModules.length > 0 && (
        <div className={styles.pathSection}>

          {/* Path header: role label on the left, x/y count on the right */}
          <div className={styles.pathHeader}>
            <span className={styles.pathTitle}>{roleLabel}</span>
            <span className={styles.pathCount}>{pathCompletedCount} / {pathModules.length} done</span>
          </div>

          {/* Short description of why these modules were chosen */}
          <p className={styles.pathDescription}>{roleDescription}</p>

          {/* Thin progress bar just for the personalised path */}
          <div className={styles.pathBarTrack}>
            <div className={styles.pathBarFill} style={pathFillStyle} />
          </div>

          {/* Checklist of each module in the path */}
          <ul className={styles.pathList}>
            {pathModules.map(function(mod) {
              return (
                <li key={mod.id} className={styles.pathItem}>

                  {/* Tick (green) if done, circle (grey) if not yet started */}
                  <span className={mod.completed ? styles.tickDone : styles.tickTodo}>
                    {mod.completed ? '✅' : '⭕'}
                  </span>

                  {/* Module icon + title */}
                  <span className={styles.pathModuleIcon}>{mod.icon}</span>
                  <span className={mod.completed ? styles.pathModuleTitleDone : styles.pathModuleTitle}>
                    {mod.title}
                  </span>

                  {/* If not yet done, show a "Start" link so the user can jump straight to it */}
                  {!mod.completed && mod.path && (
                    <a href={mod.path} className={styles.startLink}>Start →</a>
                  )}

                  {/* If done, show a small "Done" badge */}
                  {mod.completed && (
                    <span className={styles.doneBadge}>Done!</span>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Congratulations message when all path modules are complete */}
          {pathCompletedCount === pathModules.length && (
            <div className={styles.completedMessage}>
              🎉 You have completed your personalised learning path!
            </div>
          )}

        </div>
      )}

    </div>
  )
}
