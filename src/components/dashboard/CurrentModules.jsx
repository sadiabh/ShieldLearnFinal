import ProgressBreakdown from './ProgressBreakdown'
import StatsRow from './StatsRow'
import LearningJourney from './LearningJourney'

// Props:
//   progressRows        — array of all module rows with score data
//   stats               — object of numbers passed to StatsRow (completed count, avg score, etc.)
//   progressPct         — overall completion % for the learning journey bar
//   userRole            — the logged-in user's role ('student', 'professional', 'learning')
//   pathModules         — array of { id, title, icon, path, completed } for their personalised path
//   pathCompletedCount  — how many path modules the user has finished
export default function CurrentModules({ progressRows, stats, progressPct, userRole, pathModules, pathCompletedCount }) {
  return (
    <>
      <h2>My Current Modules</h2>

      {/* Top stats bar: modules done, avg score, stars, overall % */}
      <StatsRow {...stats} />

      {/* Learning journey: overall progress bar + personalised path checklist */}
      <LearningJourney
        progressPct={progressPct}
        userRole={userRole}
        pathModules={pathModules}
        pathCompletedCount={pathCompletedCount}
      />

      {/* Table of all attempted modules with scores */}
      <ProgressBreakdown rows={progressRows} />
    </>
  )
}
