import { useEffect, useState } from 'react'
import Header from '../components/Header'
import CurrentModules from '../components/dashboard/CurrentModules'
import RecentActivity from '../components/dashboard/RecentActivity'
import AchievementBadges from '../components/dashboard/AchievementBadges'
import { apiGet } from '../lib/api'
import styles from './Dashboard.module.css'

// ── Learning Path Config ──────────────────────────────────────────────────────
// Each role maps to the list of module titles the user should complete.
// 'learning' is the "general public" role chosen at registration.
// All paths begin with 'Intro to Staying Safe' as the foundation module.
const LEARNING_PATHS = {
  student: [
    'Intro to Staying Safe',
    'Ring Ring... Is It a Scam?',
    'Scroll Smart: Protecting Yourself Online',
  ],
  learning: [
    'Intro to Staying Safe',
    'Password on Lock!',
    'Password on Lock 2',
    'Shield against Phishers',
    'No more Baiting',
  ],
  professional: [
    'Intro to Staying Safe',
    'Password on Lock!',
    'Shield against Phishers',
    'No more Baiting',
    'Human Hacking in Healthcare',
  ],
}

// ── Achievement Badge Config ──────────────────────────────────────────────────
// One entry per module — maps a module title to the badge the user can earn.
// A badge is earned by scoring 70% or above on that module.
const MODULE_BADGES = [
  { title: 'Intro to Staying Safe',                    label: 'First Steps',          icon: '🌱' },
  { title: 'Password on Lock!',                        label: 'Keymaster Rookie',     icon: '🗝️' },
  { title: 'Password on Lock 2',                       label: 'Master of Passwords',  icon: '🔐' },
  { title: 'Shield against Phishers',                  label: 'Master Shield',        icon: '🛡️' },
  { title: 'No more Baiting',                          label: 'Hook, Line & Nope',    icon: '🎣' },
  { title: 'Ring Ring... Is It a Scam?',               label: 'Ring-Ring Rejector',   icon: '📞' },
  { title: 'Scroll Smart: Protecting Yourself Online', label: 'Scroll Sensei',        icon: '📱' },
  { title: 'Human Hacking in Healthcare',              label: 'Healthcare Superstar', icon: '⚕️' },
]

// ── Helper: compute badges ────────────────────────────────────────────────────
// Loops through the user's scores and works out which achievement badges
// they have earned (70%+ on the matching module).
function computeBadges(scores) {
  // Build a lookup: module title -> best percentage the user has scored on it
  const bestByTitle = {}

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i]
    const pct = s.score / s.total

    // Keep only the highest score for each module
    if (!bestByTitle[s.module_title] || pct > bestByTitle[s.module_title]) {
      bestByTitle[s.module_title] = pct
    }
  }

  // Map each badge config to an object that includes whether it has been earned
  return MODULE_BADGES.map(function(badge) {
    return {
      id:     badge.label,
      label:  badge.label,
      icon:   badge.icon,
      earned: (bestByTitle[badge.title] || 0) >= 0.7,
    }
  })
}

// ── Helper: calculate star rating ─────────────────────────────────────────────
// Returns 0, 1, 2, or 3 stars based on a decimal percentage (e.g. 0.85 = 85%).
function getStarRating(bestPct) {
  if (bestPct >= 0.9) return 3
  if (bestPct >= 0.7) return 2
  if (bestPct >= 0.4) return 1
  return 0
}

// ── Dashboard Component ───────────────────────────────────────────────────────
export default function Dashboard() {
  // scores   = the user's quiz attempt records from the server
  // modules  = all available (non-coming-soon) modules from the server
  // moduleInfoMap = lookup: module id -> { icon, level, category }
  const [scores, setScores]           = useState([])
  const [modules, setModules]         = useState([])
  const [moduleInfoMap, setModuleInfoMap] = useState({})
  const [loading, setLoading]         = useState(true)

  // Read the logged-in user from localStorage.
  // localStorage is synchronous so this is safe to do outside useEffect.
  const user     = JSON.parse(localStorage.getItem('auth_user') || 'null')
  const userRole = user ? user.role : 'learning'  // default to general public

  // ── Data fetching ───────────────────────────────────────────────────────────
  // Runs once when the dashboard first loads.
  useEffect(() => {
    async function loadData() {
      // 1. Fetch all module categories and their nested modules from the server
      const modulesResult = await apiGet('/api/modules')

      if (modulesResult.data) {
        // Flatten all categories into one list, skipping any "coming soon" modules
        const availableModules = []
        for (let i = 0; i < modulesResult.data.length; i++) {
          const category = modulesResult.data[i]
          for (let j = 0; j < category.modules.length; j++) {
            const mod = category.modules[j]
            if (!mod.coming_soon) {
              availableModules.push(mod)
            }
          }
        }
        setModules(availableModules)

        // Build a lookup map: module id -> { icon, level, category label }
        // This lets us quickly find a module's display info when building rows.
        const infoMap = {}
        for (let i = 0; i < modulesResult.data.length; i++) {
          const category = modulesResult.data[i]
          for (let j = 0; j < category.modules.length; j++) {
            const mod = category.modules[j]
            infoMap[mod.id] = {
              icon:     mod.icon,
              level:    mod.level,
              category: category.label,
            }
          }
        }
        setModuleInfoMap(infoMap)
      }

      // 2. Fetch this user's quiz scores
      if (user) {
        const scoresResult = await apiGet(`/api/scores/${user.id}`)
        if (scoresResult.data) {
          setScores(scoresResult.data)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // ── Derived values ──────────────────────────────────────────────────────────
  // Everything below is calculated from the state above — no extra fetching needed.

  // Work out which achievement badges the user has earned
  const badges = computeBadges(scores)

  // Count earned badges (needed for the progress bar in AchievementBadges)
  let earnedCount = 0
  for (let i = 0; i < badges.length; i++) {
    if (badges[i].earned) earnedCount++
  }

  // Overall badge progress percentage (0–100)
  const progressPct = (earnedCount / badges.length) * 100

  // Build a Set of module IDs the user has attempted at least once.
  // A Set automatically removes duplicates — useful since the user may retry modules.
  const completedModuleIdsSet = new Set()
  for (let i = 0; i < scores.length; i++) {
    completedModuleIdsSet.add(scores[i].module_id)
  }

  // Average score across all attempts (as a rounded percentage)
  let avgScore = 0
  if (scores.length > 0) {
    let totalPct = 0
    for (let i = 0; i < scores.length; i++) {
      totalPct += scores[i].score / scores[i].total
    }
    avgScore = Math.round((totalPct / scores.length) * 100)
  }

  // Overall module completion percentage
  let overallPct = 0
  if (modules.length > 0) {
    overallPct = Math.round((completedModuleIdsSet.size / modules.length) * 100)
  }

  // Build one summary row per module the user has attempted.
  // We group all attempts by module_id to find the best score and attempt count.
  const progressRowsMap = {}

  for (let i = 0; i < scores.length; i++) {
    const s   = scores[i]
    const pct = s.score / s.total

    if (!progressRowsMap[s.module_id]) {
      // First attempt for this module — create a new entry
      progressRowsMap[s.module_id] = { attempts: 0, best: 0, title: s.module_title }
    }

    progressRowsMap[s.module_id].attempts += 1

    // Track the highest percentage scored across all attempts
    if (pct > progressRowsMap[s.module_id].best) {
      progressRowsMap[s.module_id].best = pct
    }
  }

  // Convert the map into a plain array so child components can loop over it
  const progressRows = []
  const moduleIds = Object.keys(progressRowsMap)

  for (let i = 0; i < moduleIds.length; i++) {
    const id = moduleIds[i]
    const { attempts, best, title } = progressRowsMap[id]
    const info = moduleInfoMap[Number(id)] || {}

    progressRows.push({
      moduleId: Number(id),
      title,
      icon:     info.icon     || '📚',
      category: info.category || '',
      level:    info.level    || '',
      bestPct:  best,
      stars:    getStarRating(best),
      attempts,
    })
  }

  // Total stars earned (each module gives 0–3 stars)
  let totalStarsEarned = 0
  for (let i = 0; i < progressRows.length; i++) {
    totalStarsEarned += progressRows[i].stars
  }
  const maxStars = modules.length * 3

  // Stats object passed down to the StatsRow component
  const stats = {
    completedCount: completedModuleIdsSet.size,
    totalModules:   modules.length,
    avgScore,
    totalStarsEarned,
    maxStars,
    overallPct,
  }

  // ── Personalised Learning Path ──────────────────────────────────────────────
  // Look up which module titles are required for this user's role.
  // Fall back to the general public path if the role is unrecognised (e.g. admin).
  const requiredTitles = LEARNING_PATHS[userRole] || LEARNING_PATHS['learning']

  // Match each required title to a real module object, then check if it's completed
  const pathModules = []
  for (let i = 0; i < requiredTitles.length; i++) {
    const title = requiredTitles[i]
    const found = modules.find(function(m) { return m.title === title })

    if (found) {
      pathModules.push({
        id:        found.id,
        title:     found.title,
        icon:      found.icon,
        path:      found.path,
        completed: completedModuleIdsSet.has(found.id),
      })
    }
  }

  // Count how many path modules the user has completed
  let pathCompletedCount = 0
  for (let i = 0; i < pathModules.length; i++) {
    if (pathModules[i].completed) pathCompletedCount++
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Show a loading screen while data is being fetched from the server
  if (loading) {
    return (
      <div className={styles.page}>
        <Header title="Welcome!" activePage="dashboard" />
        <div className={styles.loadingMessage}>Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Header title="Welcome!" activePage="dashboard" />

      <div className={styles.dashboard}>

        {/* Left column: stats, learning journey, and completed modules table */}
        <div className={styles.card}>
          <CurrentModules
            progressRows={progressRows}
            stats={stats}
            progressPct={progressPct}
            userRole={userRole}
            pathModules={pathModules}
            pathCompletedCount={pathCompletedCount}
          />
        </div>

        {/* Right column: achievement stars and recent quiz activity */}
        <div className={styles.rightColumn}>
          <AchievementBadges badges={badges} earnedCount={earnedCount} progressPct={progressPct} />
          <RecentActivity scores={scores} />
        </div>

      </div>
    </div>
  )
}
