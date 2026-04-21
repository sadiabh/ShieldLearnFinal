// ============================================================
//  AvatarCustomisation.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  Users pick a profile avatar (icon image) when registering and
//  can update it later on the Profile page via a modal picker.
//
//  Files under test:
//    src/pages/Register.jsx  — icon grid during signup
//    src/pages/Profile.jsx   — modal picker + save to API
//
//  KEY CONCEPT — visual selection (no checkbox/radio):
//    Clicking an avatar div applies a CSS class. We verify
//    the selection works by checking that signUp / apiPatch
//    receives the correct avatarIndex value.
//
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'
import Profile  from '../pages/Profile'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockSignUp = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signUp:  mockSignUp,
    user:    { id: 1, name: 'Test User', role: 'student', email: 'test@test.com', avatar_index: 0 },
    loading: false,
    signOut: vi.fn(),
  }),
}))

const mockApiPatch = vi.fn()
vi.mock('../lib/api', () => ({
  apiPatch: (...args) => mockApiPatch(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>)
}

function renderProfile(user = {
  id: 1, name: 'Sadia Ahmed', email: 'sadia@test.com',
  role: 'student', avatar_index: 0, phone: '', linkedin: '',
}) {
  // Profile reads the user directly from localStorage (not AuthContext)
  localStorage.setItem('auth_user', JSON.stringify(user))
  return render(<MemoryRouter><Profile /></MemoryRouter>)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('User Avatar Customisation', () => {

  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })
  afterEach(()  => { localStorage.clear() })


  // TEST 1 — Register: icon grid is shown and clicking selects an icon
  //  All 8 icons must be visible so the user can choose their avatar.
  //  The selected index must be passed to signUp when the form is submitted.
  it('shows the icon grid on Register and passes the selected avatarIndex to signUp', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    renderRegister()

    // "Select an icon" label should appear
    expect(screen.getByText(/select an icon/i)).toBeInTheDocument()

    // Fill the form and select icon at index 1 (alt = "Graduation Cap")
    fireEvent.change(screen.getByLabelText(/enter your name/i),     { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/enter your email/i),    { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByDisplayValue('student'))
    fireEvent.click(screen.getByAltText('Graduation Cap'))
    fireEvent.click(screen.getByRole('button', { name: /done/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ avatarIndex: 1 })
      )
    })
  })


  // TEST 2 — Profile: clicking the avatar opens the icon picker modal
  //  The modal is hidden by default and must open on click.
  it('opens the icon picker modal when the profile avatar is clicked', () => {
    renderProfile()

    // Modal hidden initially
    expect(screen.queryByText(/choose your icon/i)).not.toBeInTheDocument()

    // Click the profile icon
    fireEvent.click(screen.getByAltText('Profile icon'))

    // Modal is now open
    expect(screen.getByText(/choose your icon/i)).toBeInTheDocument()
  })


  // TEST 3 — Profile: picking an icon in the modal closes it
  //  After selecting, the user should be back to the main form — no extra clicks.
  it('closes the modal and updates the icon when one is selected', () => {
    renderProfile()

    fireEvent.click(screen.getByAltText('Profile icon'))
    expect(screen.getByText(/choose your icon/i)).toBeInTheDocument()

    // Pick icon 3 (index 2)
    fireEvent.click(screen.getByAltText('Icon 3'))

    // Modal should close automatically
    expect(screen.queryByText(/choose your icon/i)).not.toBeInTheDocument()
  })


  // TEST 4 — Profile: Save sends the updated avatarIndex to the API
  //  The new avatar selection must be persisted via apiPatch on save.
  it('calls apiPatch with the new avatarIndex when Save Changes is clicked', async () => {
    mockApiPatch.mockResolvedValue({
      data:  { user: { id: 1, name: 'Sadia Ahmed', avatar_index: 4 } },
      error: null,
    })

    renderProfile()

    // Open modal and pick icon 5 (index 4)
    fireEvent.click(screen.getByAltText('Profile icon'))
    fireEvent.click(screen.getByAltText('Icon 5'))

    // Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({ avatarIndex: 4 })
      )
    })
  })

})
