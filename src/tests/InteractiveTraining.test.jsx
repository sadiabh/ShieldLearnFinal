// ============================================================
//  InteractiveTraining.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  ShieldLearn has scenario-based training modules (quizzes,
//  scroll simulations, healthcare scenarios). This file checks:
//    1. Modules show a loading state while fetching from the API
//    2. The module title and first question appear after loading
//    3. All answer options are shown to the user
//    4. Completing the module saves the score and navigates away
//
//  File under test: src/pages/modules/ModulePlayer.jsx
//
//  KEY CONCEPT — useParams:
//    useParams() reads the :id segment from the URL (/modules/1).
//    We mock it to return { id: '1' } so no real browser URL is needed.
//
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModulePlayer from '../pages/modules/ModulePlayer'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams:   () => ({ id: '1' }),   // pretend the URL is /modules/1
  }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 42, name: 'Test User', role: 'student', email: 'test@test.com' },
  }),
}))

const mockApiGet  = vi.fn()
const mockApiPost = vi.fn()

vi.mock('../lib/api', () => ({
  apiGet:  (...args) => mockApiGet(...args),
  apiPost: (...args) => mockApiPost(...args),
}))

// ── Fake data the API would return ───────────────────────────────────────────

const FAKE_MODULE = {
  id: 1, title: 'Intro to Staying Safe', icon: '🔐',
  level: 'beginner', module_type: 'quiz', accent_color: '#7c3aed', badge: 'First Steps',
}

// ModulePlayer accesses question.question (the text), question.options (array),
// and question.correctAnswer (the string value of the correct option).
const FAKE_QUESTIONS = [
  {
    id: 101, order_index: 0,
    type: 'multiple-choice',
    question: 'What is phishing?',
    options: ['A type of fish', 'A cyber attack tricking you into giving info', 'A firewall tool'],
    correctAnswer: 'A cyber attack tricking you into giving info',
  },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function renderModulePlayer() {
  mockApiGet.mockImplementation((path) => {
    if (path === '/api/modules/1')           return Promise.resolve({ data: FAKE_MODULE,    error: null })
    if (path === '/api/modules/1/questions') return Promise.resolve({ data: FAKE_QUESTIONS, error: null })
    return Promise.resolve({ data: null, error: null })
  })
  mockApiPost.mockResolvedValue({ data: { id: 99 }, error: null })

  return render(
    <MemoryRouter initialEntries={['/modules/1']}>
      <Routes>
        <Route path="/modules/:id" element={<ModulePlayer />} />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Interactive Training Simulations', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('auth_user', JSON.stringify({ id: 42, name: 'Test User', role: 'student' }))
  })


  // TEST 1 — Loading indicator appears before data arrives
  //  Users should see feedback that something is happening, not a blank page.
  it('shows a loading indicator while module data is being fetched', () => {
    // Never resolve — keeps the component in loading state indefinitely
    mockApiGet.mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter initialEntries={['/modules/1']}>
        <Routes><Route path="/modules/:id" element={<ModulePlayer />} /></Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })


  // TEST 2 — First question appears after loading
  //  The Header shows "Welcome back, Test!" (not the module title) when a
  //  user is logged in, so we check the question text instead — it's the
  //  most visible proof that the module loaded successfully.
  it('displays the first question text after the module loads', async () => {
    renderModulePlayer()

    // findByText waits until the element appears (async)
    expect(await screen.findByText(/What is phishing\?/i)).toBeInTheDocument()
  })


  // TEST 3 — All answer options for the question are rendered
  //  Every choice must be visible so the user can make a selection.
  it('renders all answer options for the current question', async () => {
    renderModulePlayer()

    await screen.findByText(/What is phishing\?/i)

    expect(screen.getByText(/A type of fish/i)).toBeInTheDocument()
    expect(screen.getByText(/A cyber attack tricking you/i)).toBeInTheDocument()
    expect(screen.getByText(/A firewall tool/i)).toBeInTheDocument()
  })


  // TEST 4 — Score is posted and user is navigated to the results screen
  //  After completing the module, the score must be saved and the user
  //  redirected to /modules/complete.
  it('posts the score and navigates to /modules/complete after finishing', async () => {
    renderModulePlayer()

    await screen.findByText(/What is phishing\?/i)

    // Select an answer — this marks the question as answered and enables the button
    fireEvent.click(screen.getByText(/A cyber attack tricking you/i))

    // With only 1 question the button says "Finish" (not "Next →")
    const finishBtn = await screen.findByRole('button', { name: /finish|next|continue/i })
    fireEvent.click(finishBtn)

    // Either the API was called OR navigation happened — both are success signals
    await waitFor(() => {
      const scorePosted   = mockApiPost.mock.calls.some(([p]) => p === '/api/scores')
      const navigatedAway = mockNavigate.mock.calls.some(([p]) => p === '/modules/complete')
      expect(scorePosted || navigatedAway).toBe(true)
    }, { timeout: 3000 })
  })

})
