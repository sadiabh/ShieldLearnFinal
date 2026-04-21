// ============================================================
//  Dashboard.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  The Dashboard fetches the user's scores and available modules,
//  then displays progress stats, a personalised learning path,
//  achievement badges, and recent quiz activity.
//
//  File under test: src/pages/Dashboard.jsx
//
//  KEY CONCEPT — localStorage:
//    Dashboard reads the logged-in user directly from localStorage
//    (not via AuthContext), so tests must set it up manually using
//    localStorage.setItem() before rendering.
//
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

// Header (child of Dashboard) calls useAuth() to show the user name
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user:    { id: 1, name: 'Test User', role: 'student', email: 'test@test.com' },
    loading: false,
    signOut: vi.fn(),
  }),
}))

const mockApiGet = vi.fn()
vi.mock('../lib/api', () => ({
  apiGet: (...args) => mockApiGet(...args),
}))

// ── Fake data ─────────────────────────────────────────────────────────────────

const FAKE_MODULES = [
  {
    label: 'General',
    modules: [
      { id: 1, title: 'Intro to Staying Safe',  icon: '🔐', level: 'beginner', coming_soon: 0 },
      { id: 2, title: 'Password on Lock!',       icon: '🔑', level: 'beginner', coming_soon: 0 },
    ],
  },
  {
    label: 'Student',
    modules: [
      { id: 5, title: 'Ring Ring... Is It a Scam?', icon: '📞', level: 'beginner', coming_soon: 0 },
    ],
  },
]

// score = correct answers, total = total questions
// Module 1: 9/10 = 90% → badge EARNED (≥ 70%)
// Module 2: 4/10 = 40% → badge NOT earned
const FAKE_SCORES = [
  { module_id: 1, module_title: 'Intro to Staying Safe', score: 9, total: 10, passed: 1 },
  { module_id: 2, module_title: 'Password on Lock!',      score: 4, total: 10, passed: 0 },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function renderDashboard({ role = 'student', scores = FAKE_SCORES } = {}) {
  localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test User', role, email: 'test@test.com' }))

  // Dashboard calls apiGet twice on mount:
  //   1. /api/modules      — all available modules
  //   2. /api/scores/:id   — this user's quiz history
  mockApiGet.mockImplementation((path) => {
    if (path === '/api/modules')        return Promise.resolve({ data: FAKE_MODULES, error: null })
    if (path.startsWith('/api/scores')) return Promise.resolve({ data: scores,       error: null })
    return Promise.resolve({ data: null, error: null })
  })

  return render(<MemoryRouter><Dashboard /></MemoryRouter>)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('User Dashboard — Progress, Scores, Achievements', () => {

  beforeEach(() => { vi.clearAllMocks() })
  afterEach(()  => { localStorage.clear() })


  // TEST 1 — Loading screen appears before data arrives
  //  Users should not see a blank page while waiting for the API.
  it('shows a loading message while data is being fetched', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})) // never resolves
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test', role: 'student' }))

    render(<MemoryRouter><Dashboard /></MemoryRouter>)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })


  // TEST 2 — All four stat cards appear after loading
  //  Modules Completed, Average Score, Stars Collected, and Overall Progress
  //  are the four key metrics shown at the top of the dashboard.
  it('renders all four stat card labels after data loads', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/modules completed/i)).toBeInTheDocument()
      expect(screen.getByText(/average score/i)).toBeInTheDocument()
      expect(screen.getByText(/stars collected/i)).toBeInTheDocument()
      expect(screen.getByText(/overall progress/i)).toBeInTheDocument()
    })
  })


  // TEST 3 — Achievement badges show correct earned count
  //  Module 1 (90%) earns a badge; Module 2 (40%) does not.
  //  The progress text should reflect this: "1 of 8 stars earned".
  it('shows the correct number of earned achievement stars', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/1 of 8 stars earned/i)).toBeInTheDocument()
    })
  })


  // TEST 4 — Recent Activity shows "No activity yet" for a new user
  //  A brand-new user with no quiz history should see an empty-state
  //  message rather than a blank or broken list.
  it('shows "No activity yet" for a user with no quiz history', async () => {
    renderDashboard({ scores: [] }) // empty scores array

    await waitFor(() => {
      expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
    })
  })

})
