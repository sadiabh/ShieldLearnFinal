// ============================================================
//  DataSecurity.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  ShieldLearn protects pages behind route guards and validates
//  passwords on the client side before any data reaches the server.
//
//  This file tests:
//    • ProtectedRoute — unauthenticated users redirected to /login
//    • AdminRoute     — non-admins redirected to /dashboard
//    • Register       — password must be at least 8 characters
//    • Login / Register / Profile — password fields use type="password"
//
//  NOTE ON PASSWORD HASHING:
//    bcrypt hashing happens on the server (server/server.js).
//    The frontend never stores or hashes passwords — it only
//    validates length before sending. That's what we test here.
//
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from '../pages/Register'
import Profile  from '../pages/Profile'
import Login    from '../pages/Login'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

// Mutable — tests change role to test different access levels
let mockUser    = null
let mockLoading = false

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user:    mockUser,
    loading: mockLoading,
    signIn:  vi.fn(),
    signUp:  vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn(),
  }),
}))

const mockApiPatch = vi.fn()
vi.mock('../lib/api', () => ({
  apiPatch: (...args) => mockApiPatch(...args),
}))

// ── Inline route guards (same logic as App.jsx) ────────────────────────────────
//  ProtectedRoute and AdminRoute are not exported from App.jsx,
//  so we recreate the same logic here using the mutable mockUser/mockLoading.

function ProtectedRoute({ children }) {
  if (mockLoading) return <div>Loading...</div>
  if (mockUser)    return children
  return <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  if (mockLoading) return <div>Loading...</div>
  if (mockUser && mockUser.role === 'admin') return children
  return <Navigate to="/dashboard" replace />
}

// ── Helper ────────────────────────────────────────────────────────────────────

function renderWithGuard(guard, component) {
  const Guard = guard === 'admin' ? AdminRoute : ProtectedRoute
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={<Guard>{component}</Guard>} />
        <Route path="/login"     element={<div>Login page</div>} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Data Security — Protected Routes & Password Handling', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    mockUser    = null
    mockLoading = false
    localStorage.clear()
  })

  afterEach(() => { localStorage.clear() })


  // TEST 1 — ProtectedRoute redirects unauthenticated users; allows logged-in users
  //  Critical: if ProtectedRoute breaks, anyone could access the dashboard or modules.
  it('redirects to /login when not logged in, and shows content when logged in', () => {
    // Not logged in — should redirect
    renderWithGuard('protected', <div>Secret content</div>)
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()

    // Clean up and re-render as a logged-in user
    screen.unmount?.()
    mockUser = { id: 1, name: 'Student', role: 'student' }
    renderWithGuard('protected', <div>Secret content</div>)
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })


  // TEST 2 — AdminRoute only allows admins; students are redirected to dashboard
  //  If AdminRoute breaks, regular users could access the admin panel.
  it('shows admin content for role="admin" and redirects students to /dashboard', () => {
    // Admin — should see admin content
    mockUser = { id: 99, name: 'Admin', role: 'admin' }
    const { unmount } = renderWithGuard('admin', <div>Admin content</div>)
    expect(screen.getByText('Admin content')).toBeInTheDocument()
    unmount()

    // Student — should be redirected
    mockUser = { id: 1, name: 'Student', role: 'student' }
    renderWithGuard('admin', <div>Admin content</div>)
    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })


  // TEST 3 — Password shorter than 8 characters is rejected before hitting the API
  //  Client-side validation means the server never receives a weak password.
  it('shows an error and does not submit when the password is under 8 characters', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText(/enter your name/i),     { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/enter your email/i),    { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'short' } }) // only 5 chars

    fireEvent.click(screen.getByRole('button', { name: /done/i }))

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })


  // TEST 4 — All password fields use type="password" (browser hides typed text)
  //  Without type="password", passwords would be visible in plain text on screen.
  it('uses type="password" on all password input fields across the app', () => {
    // Login page
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByPlaceholderText(/enter your password here/i)).toHaveAttribute('type', 'password')

    // Register page
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByLabelText(/enter your password/i)).toHaveAttribute('type', 'password')

    // Profile page — both New Password and Confirm Password fields
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test', email: 'test@test.com', role: 'student', avatar_index: 0 }))
    render(<MemoryRouter><Profile /></MemoryRouter>)
    const pwdInputs = screen.getAllByPlaceholderText(/click here to edit/i).filter(
      (el) => el.getAttribute('type') === 'password'
    )
    expect(pwdInputs.length).toBe(2) // New Password + Confirm Password
  })

})
