// ============================================================
//  Gamification.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  ShieldLearn motivates users with stars, scores, and progress
//  tracking. These three components are tested here:
//
//    AchievementBadges  — earned / unearned stars per module
//    StatsRow           — four stat cards (modules, score, stars, %)
//    RecentActivity     — last 5 quiz attempts with icons and stars
//
//  KEY CONCEPT — pure components:
//    These components only take props and return JSX. They have
//    no API calls or async behaviour, so tests are simple and fast:
//    just render with props, then check what appears on screen.
//
// ============================================================

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementBadges from '../components/dashboard/AchievementBadges'
import StatsRow          from '../components/dashboard/StatsRow'
import RecentActivity    from '../components/dashboard/RecentActivity'

// ── AchievementBadges ─────────────────────────────────────────────────────────

describe('Gamification — AchievementBadges', () => {

  const BADGES = [
    { id: 'b1', label: 'First Steps',     icon: '🌱', earned: true  },
    { id: 'b2', label: 'Keymaster Rookie', icon: '🗝️', earned: true  },
    { id: 'b3', label: 'Master Shield',   icon: '🛡️', earned: false },
  ]

  // TEST 1 — All badge labels are shown (earned and unearned)
  //  Users must see ALL module badges so they know what to aim for,
  //  not just the ones they've already earned.
  it('displays all badge labels whether earned or not', () => {
    render(<AchievementBadges badges={BADGES} earnedCount={2} progressPct={66} />)

    expect(screen.getByText('First Steps')).toBeInTheDocument()
    expect(screen.getByText('Keymaster Rookie')).toBeInTheDocument()
    expect(screen.getByText('Master Shield')).toBeInTheDocument()
  })

  // TEST 2 — Progress text shows correct earned count
  //  "2 of 3 stars earned" tells the user exactly where they stand.
  it('shows "X of Y stars earned" with the correct numbers', () => {
    render(<AchievementBadges badges={BADGES} earnedCount={2} progressPct={66} />)
    expect(screen.getByText(/2 of 3 stars earned/i)).toBeInTheDocument()
  })

  // TEST 3 — 70% hint is shown
  //  New users need to understand the earning rule.
  it('shows the "Score 70% or above" earning hint', () => {
    render(<AchievementBadges badges={BADGES} earnedCount={2} progressPct={66} />)
    expect(screen.getByText(/score 70% or above/i)).toBeInTheDocument()
  })

  // TEST 4 — Zero stars state for a brand-new user
  it('shows "0 of 3 stars earned" when no badges have been earned yet', () => {
    const none = BADGES.map(b => ({ ...b, earned: false }))
    render(<AchievementBadges badges={none} earnedCount={0} progressPct={0} />)
    expect(screen.getByText(/0 of 3 stars earned/i)).toBeInTheDocument()
  })

})

// ── StatsRow ──────────────────────────────────────────────────────────────────

describe('Gamification — StatsRow (four stat cards)', () => {

  const STATS = { completedCount: 3, totalModules: 8, avgScore: 75, totalStarsEarned: 7, maxStars: 24, overallPct: 37 }

  // TEST 1 — Modules completed card
  it('shows modules completed as "3 / 8"', () => {
    render(<StatsRow {...STATS} />)
    expect(screen.getByText('3 / 8')).toBeInTheDocument()
    expect(screen.getByText(/modules completed/i)).toBeInTheDocument()
  })

  // TEST 2 — Average score card
  it('shows the average score percentage', () => {
    render(<StatsRow {...STATS} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText(/average score/i)).toBeInTheDocument()
  })

  // TEST 3 — Stars collected card
  it('shows stars collected as "7 / 24"', () => {
    render(<StatsRow {...STATS} />)
    expect(screen.getByText('7 / 24')).toBeInTheDocument()
    expect(screen.getByText(/stars collected/i)).toBeInTheDocument()
  })

  // TEST 4 — All four emoji icons are shown
  //  Each card has an emoji that acts as a quick visual identifier.
  it('renders the emoji icon for each stat card', () => {
    render(<StatsRow {...STATS} />)
    expect(screen.getByText('📚')).toBeInTheDocument()
    expect(screen.getByText('🎯')).toBeInTheDocument()
    expect(screen.getByText('⭐')).toBeInTheDocument()
    expect(screen.getByText('🔥')).toBeInTheDocument()
  })

})

// ── RecentActivity ────────────────────────────────────────────────────────────

describe('Gamification — RecentActivity', () => {

  const SCORES = [
    { module_id: 1, module_title: 'Intro to Staying Safe', score: 9, total: 10, passed: 1 },
    { module_id: 2, module_title: 'Password on Lock!',     score: 3, total: 10, passed: 0 },
  ]

  // TEST 1 — Empty state for new users
  it('shows "No activity yet" when there are no quiz attempts', () => {
    render(<RecentActivity scores={[]} />)
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
  })

  // TEST 2 — Module titles appear in the activity list
  it('lists the titles of recently completed modules', () => {
    render(<RecentActivity scores={SCORES} />)
    expect(screen.getByText(/Intro to Staying Safe/i)).toBeInTheDocument()
    expect(screen.getByText(/Password on Lock!/i)).toBeInTheDocument()
  })

  // TEST 3 — ✅ and ❌ icons for pass and fail
  //  The emojis live inside a div alongside other text (title, score, stars),
  //  so getByText('✅') fails because no element has ONLY that text.
  //  Checking document.body.textContent is the simplest reliable approach.
  it('shows ✅ for passed and ❌ for failed attempts', () => {
    render(<RecentActivity scores={SCORES} />)
    expect(document.body.textContent).toContain('✅')
    expect(document.body.textContent).toContain('❌')
  })

  // TEST 4 — Only the 5 most recent scores are shown
  //  The list is capped at 5 so it doesn't grow forever.
  it('shows only 5 scores even when there are more', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      module_id: i + 1, module_title: `Module ${i + 1}`, score: 5, total: 10, passed: 1,
    }))
    render(<RecentActivity scores={many} />)
    expect(screen.getByText(/Module 5/)).toBeInTheDocument()
    expect(screen.queryByText(/Module 6/)).not.toBeInTheDocument()
  })

})
