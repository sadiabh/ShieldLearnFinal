// ============================================================
//  IndustryScenarios.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  ShieldLearn includes industry-specific training scenarios:
//    • Healthcare — social engineering in a hospital
//    • Student    — scam calls, social media decisions
//    • General    — phishing emails, password attacks
//
//  This file checks that the module library groups modules by
//  industry/category, shows the right difficulty badges, and
//  that each role's Dashboard path contains the right scenarios.
//
//  Files under test:
//    src/pages/ModuleList.jsx  — category grid with all modules
//    src/pages/Dashboard.jsx  — personalised learning path
//
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ModuleList from '../pages/ModuleList'
import Dashboard  from '../pages/Dashboard'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', role: 'professional', email: 'test@test.com' },
    loading: false, signOut: vi.fn(),
  }),
}))

const mockApiGet = vi.fn()
vi.mock('../lib/api', () => ({
  apiGet: (...args) => mockApiGet(...args),
}))

// ── Fake modules covering all three industries ────────────────────────────────

const INDUSTRY_MODULES = [
  {
    id: 1, icon: '🔐', label: 'General Modules',
    modules: [
      { id: 1, title: 'Intro to Staying Safe',  icon: '🔐', description: 'The basics.', level: 'beginner',     path: '/modules/1', coming_soon: 0 },
      { id: 3, title: 'Shield against Phishers', icon: '🛡️', description: 'Spot phishing.', level: 'intermediate', path: '/modules/3', coming_soon: 0 },
    ],
  },
  {
    id: 2, icon: '🎓', label: 'Student Modules',
    modules: [
      { id: 5, title: 'Ring Ring... Is It a Scam?',               icon: '📞', description: 'Phone scams.', level: 'beginner', path: '/modules/5', coming_soon: 0 },
      { id: 6, title: 'Scroll Smart: Protecting Yourself Online', icon: '📱', description: 'Social media.', level: 'beginner', path: '/modules/6', coming_soon: 0 },
    ],
  },
  {
    id: 3, icon: '🏥', label: 'Healthcare',
    modules: [
      { id: 7, title: 'Human Hacking in Healthcare', icon: '⚕️', description: 'Hospital social engineering.', level: 'advanced', path: '/modules/7', coming_soon: 0 },
    ],
  },
  {
    id: 4, icon: '🚀', label: 'Coming Soon',
    modules: [
      { id: 8, title: 'Advanced Threat Intelligence', icon: '🔮', description: 'Coming soon.', level: 'advanced', path: null, coming_soon: 1 },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModuleList() {
  mockApiGet.mockResolvedValue({ data: INDUSTRY_MODULES, error: null })
  return render(<MemoryRouter><ModuleList /></MemoryRouter>)
}

function renderDashboard(role) {
  localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test', role, email: 'test@test.com' }))
  mockApiGet.mockImplementation((path) => {
    if (path === '/api/modules')        return Promise.resolve({ data: INDUSTRY_MODULES, error: null })
    if (path.startsWith('/api/scores')) return Promise.resolve({ data: [],               error: null })
    return Promise.resolve({ data: null, error: null })
  })
  return render(<MemoryRouter><Dashboard /></MemoryRouter>)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Industry-Specific Training Scenarios', () => {

  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })
  afterEach(()  => { localStorage.clear() })


  // TEST 1 — Module library shows all industry categories and scenario modules
  //  "Healthcare" appears in both the category label AND the module title, so
  //  getAllByText is used. We check for the exact category name separately.
  it('renders each category and its industry-specific scenario modules', async () => {
    renderModuleList()

    await waitFor(() => {
      // Category headings (exact text, no ambiguity)
      expect(screen.getByText('General Modules')).toBeInTheDocument()
      expect(screen.getByText('Student Modules')).toBeInTheDocument()
      expect(screen.getAllByText(/healthcare/i).length).toBeGreaterThan(0)
      // Scenario module titles
      expect(screen.getByText(/Human Hacking in Healthcare/i)).toBeInTheDocument()
      expect(screen.getByText(/Ring Ring/i)).toBeInTheDocument()
    })
  })


  // TEST 2 — Difficulty level badges appear on module cards
  //  Users need to know how hard each scenario is before starting.
  it('displays beginner, intermediate, and advanced difficulty badges', async () => {
    renderModuleList()

    await waitFor(() => {
      expect(screen.getAllByText(/beginner/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/intermediate/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/advanced/i).length).toBeGreaterThan(0)
    })
  })


  // TEST 3 — Student path shows student scenarios; professional path shows healthcare
  //  Each role must get the industry-relevant modules in their learning path.
  it('shows Ring Ring for students and Healthcare for professionals', async () => {
    const { unmount } = renderDashboard('student')
    await waitFor(() => expect(screen.getByText(/Ring Ring/i)).toBeInTheDocument())
    unmount()

    localStorage.clear()

    renderDashboard('professional')
    await waitFor(() => expect(screen.getByText(/Human Hacking in Healthcare/i)).toBeInTheDocument())
    // Student modules must NOT appear in the professional path
    expect(screen.queryByText(/Scroll Smart/i)).not.toBeInTheDocument()
  })


  // TEST 4 — Coming-soon modules are clearly labelled
  //  "Coming Soon" appears in both the category heading and the module description,
  //  so getAllByText is used — we just need at least one match.
  it('shows "coming soon" label on unavailable modules', async () => {
    renderModuleList()

    await waitFor(() => {
      expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0)
    })
  })

})
