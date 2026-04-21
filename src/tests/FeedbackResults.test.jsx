// ============================================================
//  FeedbackResults.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  After a module is finished, the user lands on ModuleComplete —
//  a results screen showing their score, star rating, badge name,
//  and buttons to continue.
//
//  File under test: src/pages/modules/ModuleComplete.jsx
//
//  KEY CONCEPT — location.state:
//    ModuleComplete gets its data from React Router's location.state,
//    NOT from the API. ModulePlayer calls navigate('/modules/complete',
//    { state: { score, total, moduleName, ... } }) to pass the result.
//    We simulate this in tests using MemoryRouter's initialEntries.
//
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleComplete from '../pages/modules/ModuleComplete'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'student' }, loading: false, signOut: vi.fn() }),
}))

// ── Helper — render with custom result state ───────────────────────────────

function renderComplete(state = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/modules/complete', state }]}>
      <Routes>
        <Route path="/modules/complete" element={<ModuleComplete />} />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feedback and Results Summary', () => {

  beforeEach(() => { vi.clearAllMocks() })


  // TEST 1 — Pass vs fail heading
  //  8/10 = 80% → "Congratulations!";  3/10 = 30% → "Good Effort!"
  //  Tone matters — the app should stay encouraging on a fail.
  it('shows "Congratulations!" on pass and "Good Effort!" on fail', async () => {
    const { unmount } = renderComplete({ moduleName: 'Test Module', score: 8, total: 10, passing: 0.7 })
    await waitFor(() => expect(screen.getByText(/congratulations/i)).toBeInTheDocument())
    unmount()

    renderComplete({ moduleName: 'Test Module', score: 3, total: 10, passing: 0.7 })
    await waitFor(() => expect(screen.getByText(/good effort/i)).toBeInTheDocument())
  })


  // TEST 2 — Score and percentage are displayed
  //  Users need to see their actual numbers to understand how they did.
  it('displays the score (e.g. 7 / 10) and percentage (70%)', async () => {
    renderComplete({ moduleName: 'Test Module', score: 7, total: 10 })

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText(/\/ 10/)).toBeInTheDocument()
      expect(screen.getByText('70%')).toBeInTheDocument()
    })
  })


  // TEST 3 — Badge name shown on pass; retry message on fail
  //  'Intro to Staying Safe' maps to badge 'First Steps' in STAR_NAMES.
  it('shows the badge name on pass and a retry message on fail', async () => {
    // Pass case — badge should appear
    const { unmount } = renderComplete({ moduleName: 'Intro to Staying Safe', score: 9, total: 10, passing: 0.7 })
    await waitFor(() => {
      expect(screen.getByText(/badge earned/i)).toBeInTheDocument()
      expect(screen.getByText(/first steps/i)).toBeInTheDocument()
    })
    unmount()

    // Fail case — retry message should appear instead
    renderComplete({ moduleName: 'Test Module', score: 3, total: 10, passing: 0.7 })
    await waitFor(() => expect(screen.getByText(/70%/i)).toBeInTheDocument()) // retry message mentions 70%
  })


  // TEST 4 — Navigation buttons work correctly
  //  "Back to Dashboard" → /dashboard, "Give Feedback" → /survey with module data.
  it('navigates to /dashboard and to /survey with module data on button clicks', async () => {
    renderComplete({ moduleName: 'Password on Lock!', moduleIcon: '🔑', score: 8, total: 10 })

    const dashBtn = await screen.findByRole('button', { name: /back to dashboard/i })
    fireEvent.click(dashBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')

    const feedbackBtn = screen.getByRole('button', { name: /give feedback/i })
    fireEvent.click(feedbackBtn)
    expect(mockNavigate).toHaveBeenCalledWith(
      '/survey',
      expect.objectContaining({ state: expect.objectContaining({ moduleName: 'Password on Lock!' }) })
    )
  })

})
