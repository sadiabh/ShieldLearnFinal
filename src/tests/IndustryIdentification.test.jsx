// ============================================================
//  IndustryIdentification.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  Users pick their background (Professional / Student / General
//  Learner) during registration. That choice is saved and controls
//  which learning-path modules appear on the Dashboard.
//
//  Files under test:
//    src/pages/Register.jsx   — role radio buttons
//    src/pages/Dashboard.jsx  — role-based learning path
//
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

// mockSignUp lets us inspect what role was passed to the server
const mockSignUp = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signUp: mockSignUp, user: null, loading: false }),
}))

// mockApiGet controls what the Dashboard "receives" from the API
const mockApiGet = vi.fn()
vi.mock('../lib/api', () => ({
  apiGet: (...args) => mockApiGet(...args),
}))

// ── Fake modules — covers all three learning paths ────────────────────────────
const FAKE_MODULES = [
  {
    label: 'General',
    modules: [
      { id: 1, title: 'Intro to Staying Safe',  icon: '🔐', level: 'beginner',     path: '/modules/1', coming_soon: 0 },
      { id: 3, title: 'Shield against Phishers', icon: '🛡️', level: 'intermediate', path: '/modules/3', coming_soon: 0 },
    ],
  },
  {
    label: 'Student',
    modules: [
      { id: 5, title: 'Ring Ring... Is It a Scam?',               icon: '📞', level: 'beginner', path: '/modules/5', coming_soon: 0 },
      { id: 6, title: 'Scroll Smart: Protecting Yourself Online', icon: '📱', level: 'beginner', path: '/modules/6', coming_soon: 0 },
    ],
  },
  {
    label: 'Healthcare',
    modules: [
      { id: 7, title: 'Human Hacking in Healthcare', icon: '⚕️', level: 'advanced', path: '/modules/7', coming_soon: 0 },
    ],
  },
]

// ── Helper: render Dashboard with a specific user role ────────────────────────
function renderDashboardWithRole(role) {
  localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test User', role, email: 'test@test.com' }))
  mockApiGet.mockImplementation((path) => {
    if (path === '/api/modules')        return Promise.resolve({ data: FAKE_MODULES, error: null })
    if (path.startsWith('/api/scores')) return Promise.resolve({ data: [],           error: null })
    return Promise.resolve({ data: null, error: null })
  })
  return render(<MemoryRouter><Dashboard /></MemoryRouter>)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('User Industry Identification', () => {

  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })
  afterEach(()  => { localStorage.clear() })


  // TEST 1 — All three role radio buttons appear on the registration form
  //  Users must be able to see and pick their background before submitting.
  it('shows Professional, Student, and General Learner role options on the form', () => {
    render(<MemoryRouter><Register /></MemoryRouter>)

    // getByDisplayValue finds an <input> whose value attribute matches
    expect(screen.getByDisplayValue('professional')).toBeInTheDocument()
    expect(screen.getByDisplayValue('student')).toBeInTheDocument()
    expect(screen.getByDisplayValue('learning')).toBeInTheDocument()
  })


  // TEST 2 — Selecting a role ticks that radio and unticks the others
  //  Only one role can be active at a time (standard radio-group behaviour).
  it('ticks the clicked role and deselects the previous one', () => {
    render(<MemoryRouter><Register /></MemoryRouter>)

    const professional = screen.getByDisplayValue('professional')
    const student      = screen.getByDisplayValue('student')

    fireEvent.click(professional)
    expect(professional).toBeChecked()

    fireEvent.click(student)
    // student is now selected, professional must be deselected
    expect(student).toBeChecked()
    expect(professional).not.toBeChecked()
  })


  // TEST 3 — Selected role is passed to signUp on form submission
  //  The server needs the role to create the right account type.
  it('passes the selected role to signUp when the form is submitted', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    render(<MemoryRouter><Register /></MemoryRouter>)

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/enter your name/i),     { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/enter your email/i),    { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByDisplayValue('professional'))
    fireEvent.click(screen.getByRole('button', { name: /done/i }))

    // waitFor keeps retrying until the async signUp call completes
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        expect.objectContaining({ role: 'professional' })
      )
    })
  })


  // TEST 4 — Dashboard shows the right modules based on the saved role
  //  A student sees Ring Ring and Scroll Smart; a professional sees Healthcare.
  it('shows student-specific modules for a student and hides them for a professional', async () => {
    // Render as a student first
    const { unmount } = renderDashboardWithRole('student')
    await waitFor(() => expect(screen.getByText(/Ring Ring/i)).toBeInTheDocument())
    unmount()

    localStorage.clear()

    // Re-render as a professional — student modules should be absent
    renderDashboardWithRole('professional')
    await waitFor(() => expect(screen.getByText(/Human Hacking in Healthcare/i)).toBeInTheDocument())
    expect(screen.queryByText(/Ring Ring/i)).not.toBeInTheDocument()
  })

})
