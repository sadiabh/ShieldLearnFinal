import { useState, useEffect } from 'react'
import { apiGet } from '../../lib/api'
import styles from './Admin.module.css'
import chartStyles from './AdminSurveys.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function countBy(arr, key) {
  const map = {}
  arr.forEach(item => {
    const val = item[key]
    if (val != null) map[val] = (map[val] || 0) + 1
  })
  return map
}

function pct(count, total) {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={chartStyles.statCard} style={{ borderTop: `4px solid ${color}` }}>
      <div className={chartStyles.statIcon} style={{ background: `${color}18`, color }}>{icon}</div>
      <div className={chartStyles.statBody}>
        <div className={chartStyles.statValue}>{value}</div>
        <div className={chartStyles.statLabel}>{label}</div>
        {sub && <div className={chartStyles.statSub}>{sub}</div>}
      </div>
    </div>
  )
}

function HorizBars({ rows, color = '#7c3aed' }) {
  const maxCount = Math.max(...rows.map(r => r.count), 1)
  return (
    <div className={chartStyles.horizBars}>
      {rows.map(row => (
        <div key={row.label} className={chartStyles.barRow}>
          <div className={chartStyles.barLabel} title={row.label}>{row.label}</div>
          <div className={chartStyles.barTrack}>
            <div
              className={chartStyles.barFill}
              style={{ width: `${(row.count / maxCount) * 100}%`, background: color }}
            />
          </div>
          <div className={chartStyles.barMeta}>
            <span className={chartStyles.barCount}>{row.count}</span>
            <span className={chartStyles.barPct}>{row.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StarBars({ distribution, total }) {
  return (
    <div className={chartStyles.horizBars}>
      {[5, 4, 3, 2, 1].map(star => {
        const count = distribution[star] || 0
        const maxCount = Math.max(...Object.values(distribution), 1)
        return (
          <div key={star} className={chartStyles.barRow}>
            <div className={chartStyles.starBarLabel}>
              {'★'.repeat(star)}{'☆'.repeat(5 - star)}
            </div>
            <div className={chartStyles.barTrack}>
              <div
                className={chartStyles.barFill}
                style={{ width: `${(count / maxCount) * 100}%`, background: '#f59e0b' }}
              />
            </div>
            <div className={chartStyles.barMeta}>
              <span className={chartStyles.barCount}>{count}</span>
              <span className={chartStyles.barPct}>{pct(count, total)}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NpsChart({ distribution, total }) {
  const detractors = [1,2,3,4,5,6].reduce((s,v) => s + (distribution[v]||0), 0)
  const passives   = [7,8].reduce((s,v) => s + (distribution[v]||0), 0)
  const promoters  = [9,10].reduce((s,v) => s + (distribution[v]||0), 0)
  const npsScore   = total ? Math.round(((promoters - detractors) / total) * 100) : 0

  const npsColor = npsScore >= 50 ? '#22c55e' : npsScore >= 0 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      {/* NPS score badge */}
      <div className={chartStyles.npsScoreBadge}>
        <span className={chartStyles.npsScoreNum} style={{ color: npsColor }}>{npsScore}</span>
        <span className={chartStyles.npsScoreLabel}>NPS Score</span>
      </div>

      {/* Segment summary */}
      <div className={chartStyles.npsSegments}>
        <div className={chartStyles.npsSeg} style={{ background: '#fee2e2', borderColor: '#ef4444' }}>
          <div className={chartStyles.npsSegNum} style={{ color: '#dc2626' }}>{pct(detractors, total)}%</div>
          <div className={chartStyles.npsSegLabel}>Detractors</div>
          <div className={chartStyles.npsSegRange}>1 – 6</div>
        </div>
        <div className={chartStyles.npsSeg} style={{ background: '#fef3c7', borderColor: '#f59e0b' }}>
          <div className={chartStyles.npsSegNum} style={{ color: '#d97706' }}>{pct(passives, total)}%</div>
          <div className={chartStyles.npsSegLabel}>Passives</div>
          <div className={chartStyles.npsSegRange}>7 – 8</div>
        </div>
        <div className={chartStyles.npsSeg} style={{ background: '#dcfce7', borderColor: '#22c55e' }}>
          <div className={chartStyles.npsSegNum} style={{ color: '#16a34a' }}>{pct(promoters, total)}%</div>
          <div className={chartStyles.npsSegLabel}>Promoters</div>
          <div className={chartStyles.npsSegRange}>9 – 10</div>
        </div>
      </div>

      {/* Bar per value 1-10 */}
      <div className={chartStyles.npsValueBars}>
        {[1,2,3,4,5,6,7,8,9,10].map(v => {
          const count = distribution[v] || 0
          const maxCount = Math.max(...Object.values(distribution), 1)
          const barColor = v <= 6 ? '#ef4444' : v <= 8 ? '#f59e0b' : '#22c55e'
          return (
            <div key={v} className={chartStyles.npsValueCol}>
              <div className={chartStyles.npsValueBar}>
                <div
                  className={chartStyles.npsValueFill}
                  style={{ height: `${(count / maxCount) * 100}%`, background: barColor }}
                />
              </div>
              <div className={chartStyles.npsValueNum}>{v}</div>
              <div className={chartStyles.npsValueCount}>{count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminSurveys() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [moduleFilter, setModuleFilter] = useState('All')

  useEffect(() => {
    async function load() {
      const { data } = await apiGet('/api/admin/surveys')
      if (data) setResponses(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className={styles.loading}>Loading survey data…</div>

  // Module filter options
  const moduleNames = ['All', ...Array.from(new Set(responses.map(r => r.module_name))).sort()]
  const filtered = moduleFilter === 'All' ? responses : responses.filter(r => r.module_name === moduleFilter)
  const total = filtered.length

  if (total === 0) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Survey Results</h1>
        </div>
        <div className={styles.emptyState}>
          <p>No survey responses yet. Responses will appear here once users complete the survey.</p>
        </div>
      </div>
    )
  }

  // ── Aggregations ─────────────────────────────────────────────────────────

  // Q1 — star rating
  const ratings     = filtered.filter(r => r.q1_rating != null).map(r => r.q1_rating)
  const avgRating   = avg(ratings)
  const ratingDist  = countBy(filtered.filter(r => r.q1_rating != null), 'q1_rating')

  // Q2 — difficulty
  const diffDist = countBy(filtered.filter(r => r.q2_difficulty), 'q2_difficulty')
  const diffRows = Object.entries(diffDist)
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count)

  // Q3 — helpful (multi-select, flatten arrays)
  const helpfulCounts = {}
  filtered.forEach(r => {
    if (Array.isArray(r.q3_helpful)) {
      r.q3_helpful.forEach(item => {
        helpfulCounts[item] = (helpfulCounts[item] || 0) + 1
      })
    }
  })
  const helpfulRows = Object.entries(helpfulCounts)
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count)

  // Q4 — NPS
  const npsDist  = countBy(filtered.filter(r => r.q4_nps != null), 'q4_nps')
  const avgNps   = avg(filtered.filter(r => r.q4_nps != null).map(r => r.q4_nps))
  const promoters  = [9,10].reduce((s,v) => s + (npsDist[v]||0), 0)
  const detractors = [1,2,3,4,5,6].reduce((s,v) => s + (npsDist[v]||0), 0)
  const npsRaters  = filtered.filter(r => r.q4_nps != null).length
  const npsScore   = npsRaters ? Math.round(((promoters - detractors) / npsRaters) * 100) : 0

  // Q5 — text feedback (latest non-empty)
  const feedbackItems = filtered
    .filter(r => r.q5_feedback && r.q5_feedback.trim())
    .slice(0, 10)

  // Q6 — confidence
  const confDist = countBy(filtered.filter(r => r.q6_confidence), 'q6_confidence')
  const confRows = Object.entries(confDist)
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count)

  const npsColor = npsScore >= 50 ? '#22c55e' : npsScore >= 0 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Survey Results</h1>
        <select
          className={styles.formSelect}
          style={{ width: 220 }}
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
        >
          {moduleNames.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Summary stat cards */}
      <div className={chartStyles.statGrid}>
        <StatCard icon="🗳️" label="Total Responses" value={total}
          sub={moduleFilter !== 'All' ? moduleFilter : 'All modules'} color="#7c3aed" />
        <StatCard icon="⭐" label="Avg Star Rating" value={ratings.length ? avgRating.toFixed(1) + ' / 5.0' : 'N/A'}
          sub={`${ratings.length} rating${ratings.length !== 1 ? 's' : ''}`} color="#f59e0b" />
        <StatCard icon="📊" label="NPS Score" value={npsRaters ? npsScore : 'N/A'}
          sub="Promoters minus detractors" color={npsColor} />
        <StatCard icon="💬" label="Text Feedback" value={feedbackItems.length}
          sub="Written comments received" color="#3b82f6" />
      </div>

      {/* Row 1: Star rating + Difficulty */}
      <div className={chartStyles.chartGrid2}>
        <div className={chartStyles.chartCard}>
          <div className={chartStyles.chartHeader}>
            <span className={chartStyles.chartTitle}>⭐ Overall Rating</span>
            <span className={chartStyles.chartBadge} style={{ background: '#fef3c7', color: '#92400e' }}>
              Avg {avgRating.toFixed(1)} / 5.0
            </span>
          </div>
          <StarBars distribution={ratingDist} total={ratings.length} />
        </div>

        <div className={chartStyles.chartCard}>
          <div className={chartStyles.chartHeader}>
            <span className={chartStyles.chartTitle}>🎯 Difficulty Level</span>
            <span className={chartStyles.chartBadge} style={{ background: '#ede9fe', color: '#5b21b6' }}>
              {diffRows.length} options
            </span>
          </div>
          {diffRows.length
            ? <HorizBars rows={diffRows} color="#6366f1" />
            : <div className={styles.emptyState}><p>No responses yet</p></div>
          }
        </div>
      </div>

      {/* Row 2: Most Helpful + Confidence */}
      <div className={chartStyles.chartGrid2}>
        <div className={chartStyles.chartCard}>
          <div className={chartStyles.chartHeader}>
            <span className={chartStyles.chartTitle}>💡 What Helped Most</span>
            <span className={chartStyles.chartBadge} style={{ background: '#ede9fe', color: '#5b21b6' }}>
              Multi-select
            </span>
          </div>
          {helpfulRows.length
            ? <HorizBars rows={helpfulRows} color="#7c3aed" />
            : <div className={styles.emptyState}><p>No responses yet</p></div>
          }
        </div>

        <div className={chartStyles.chartCard}>
          <div className={chartStyles.chartHeader}>
            <span className={chartStyles.chartTitle}>😊 Confidence Level</span>
            <span className={chartStyles.chartBadge} style={{ background: '#dcfce7', color: '#166534' }}>
              After module
            </span>
          </div>
          {confRows.length
            ? <HorizBars rows={confRows} color="#22c55e" />
            : <div className={styles.emptyState}><p>No responses yet</p></div>
          }
        </div>
      </div>

      {/* Row 3: NPS full-width */}
      <div className={chartStyles.chartCard} style={{ marginBottom: 24 }}>
        <div className={chartStyles.chartHeader}>
          <span className={chartStyles.chartTitle}>📈 Likelihood to Recommend (NPS)</span>
          <span className={chartStyles.chartBadge} style={{ background: `${npsColor}18`, color: npsColor }}>
            Score: {npsRaters ? npsScore : 'N/A'}
          </span>
        </div>
        {npsRaters
          ? <NpsChart distribution={npsDist} total={npsRaters} />
          : <div className={styles.emptyState}><p>No responses yet</p></div>
        }
      </div>

      {/* Row 4: Text feedback */}
      {feedbackItems.length > 0 && (
        <div className={chartStyles.chartCard}>
          <div className={chartStyles.chartHeader}>
            <span className={chartStyles.chartTitle}>💬 Written Feedback</span>
            <span className={chartStyles.chartBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>
              Latest {feedbackItems.length}
            </span>
          </div>
          <div className={chartStyles.feedbackGrid}>
            {feedbackItems.map(r => (
              <div key={r.id} className={chartStyles.feedbackCard}>
                <div className={chartStyles.feedbackModule}>{r.module_name}</div>
                <div className={chartStyles.feedbackText}>"{r.q5_feedback}"</div>
                <div className={chartStyles.feedbackMeta}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  {r.q1_rating && <span className={chartStyles.feedbackStars}>{'★'.repeat(r.q1_rating)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
