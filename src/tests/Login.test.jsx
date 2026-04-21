// ============================================================
//  Login.test.jsx — tests for the Login page
// ============================================================
//
//  WHAT IS A TEST FILE?
//  A test file checks that your component behaves the way you
//  expect. Instead of manually clicking around in the browser
//  every time you change code, these tests do it automatically.
//
//  HOW TO RUN THESE TESTS:
//    npx vitest
//
// ============================================================


// --- IMPORTS -------------------------------------------------
//
//  vitest gives us the core testing tools:
//    describe  — groups related tests together under one label
//    it        — defines a single test ("it should do X")
//    expect    — makes an assertion: "I expect this value to be Y"
//    vi        — lets us create mocks (fake versions of functions)
//    beforeEach— runs a piece of setup code before EVERY test
//
import { describe, it, expect, vi, beforeEach } from 'vitest'

//  @testing-library/react gives us tools to render components
//  and interact with them the same way a real user would:
//    render      — puts the component onto a virtual screen
//    screen      — lets us search that virtual screen for elements
//    fireEvent   — simulates user actions (typing, clicking, etc.)
//    waitFor     — waits until something appears / changes
//
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

//  MemoryRouter is a fake version of the browser's URL bar.
//  Our Login component uses <Link> and useNavigate (from react-router-dom),
//  which REQUIRE a Router to be present — MemoryRouter provides that
//  without needing a real browser.
//
import { MemoryRouter } from 'react-router-dom'

//  The actual component we are testing
import Login from '../pages/Login'


// --- MOCKS ---------------------------------------------------
//
//  A "mock" is a fake replacement for something real.
//  We use mocks here because:
//    1. We don't want our tests to make real network requests.
//    2. We want to control exactly what signIn returns (success or failure).
//    3. We want to check whether navigation happened without a real browser.
//
//  Think of mocks like stunt doubles in a movie — they stand in
//  for the real thing so the test stays fast and predictable.


// mockNavigate pretends to be the navigate() function from react-router-dom.
// vi.fn() creates an empty fake function that we can inspect later
// (e.g. "was it called?", "what argument was passed to it?").
const mockNavigate = vi.fn()

// vi.mock() replaces the entire 'react-router-dom' module during tests.
// We spread in the real module first (...actual) so everything still works,
// then override just useNavigate to return our fake mockNavigate.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()         // get the real module
  return { ...actual, useNavigate: () => mockNavigate } // swap just useNavigate
})


// mockSignIn pretends to be the signIn function from AuthContext.
// Each test can decide what it returns (success, failure, never resolves, etc.)
const mockSignIn = vi.fn()

// Replace the AuthContext module so useAuth() returns our fake signIn.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}))


// --- HELPER FUNCTION -----------------------------------------
//
//  renderLogin() is a small helper so we don't repeat the same
//  three lines of setup code inside every single test.
//  It wraps <Login /> in <MemoryRouter> because Login uses
//  react-router features that need a Router parent.
//
function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}


// --- TEST SUITE ----------------------------------------------
//
//  describe() groups all the Login tests together.
//  Everything inside this block is testing the Login component.
//
describe('Login component', () => {

  // beforeEach runs before EVERY test below.
  // vi.clearAllMocks() resets the fake functions so that calls
  // recorded in one test don't accidentally bleed into the next.
  beforeEach(() => {
    vi.clearAllMocks()
  })


  // ----------------------------------------------------------
  // TEST 1 — Does the form actually appear on screen?
  // ----------------------------------------------------------
  //  getByPlaceholderText() finds an input by its placeholder text.
  //  getByRole('button') finds a button by its accessible name.
  //  toBeInTheDocument() checks that the element exists on the page.
  //
  it('renders email input, password input, and login button', () => {
    renderLogin()

    expect(screen.getByPlaceholderText(/enter your email here/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password here/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })


  // ----------------------------------------------------------
  // TEST 2 — Does the lock icon switch to unlock when typing?
  // ----------------------------------------------------------
  //  getByAltText() finds an image by its alt="" attribute.
  //  fireEvent.change() simulates typing into an input field.
  //  After typing, the component's state changes, which causes
  //  React to re-render and update the image src — we check that.
  //
  it('shows lock icon by default and unlock icon after typing a password', () => {
    renderLogin()

    // Before typing — icon should show the locked padlock
    const icon = screen.getByAltText(/lock icon/i)
    expect(icon.src).toContain('lock.png')

    // Simulate typing a password into the password field
    fireEvent.change(screen.getByPlaceholderText(/enter your password here/i), {
      target: { value: 'secret' },   // target.value is what the input's value becomes
    })

    // After typing — icon should now show the unlocked padlock
    expect(icon.src).toContain('unlock.png')
  })


  // ----------------------------------------------------------
  // TEST 3 — Does a successful login take us to /dashboard?
  // ----------------------------------------------------------
  //  mockResolvedValue() makes mockSignIn return a resolved
  //  Promise with { error: null } — meaning "login worked".
  //
  //  async/await is needed here because handleLogin is async
  //  (it waits for the server response before navigating).
  //
  //  waitFor() keeps checking until the expect inside passes,
  //  or times out. We need it because navigation happens after
  //  an async operation finishes.
  //
  it('navigates to /dashboard on successful login', async () => {
    // Tell the fake signIn to pretend the login succeeded
    mockSignIn.mockResolvedValue({ error: null })

    renderLogin()

    // Fill in the form fields
    fireEvent.change(screen.getByPlaceholderText(/enter your email here/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/enter your password here/i), {
      target: { value: 'password123' },
    })

    // Click the login button to submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    // Wait until navigate('/dashboard') has been called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })


  // ----------------------------------------------------------
  // TEST 4 — Does a failed login show an error message?
  // ----------------------------------------------------------
  //  Here we tell mockSignIn to return an error object.
  //  The component reads error.message and displays it on screen.
  //
  //  findByText() is like getByText() but async — it waits for
  //  the element to appear (useful after async state updates).
  //
  //  not.toHaveBeenCalled() checks that navigate() was NEVER
  //  called — we should stay on the login page when login fails.
  //
  it('displays an error message when login fails', async () => {
    // Tell the fake signIn to pretend the login failed
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })

    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/enter your email here/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/enter your password here/i), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    // Wait for the error message to appear on screen
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()

    // Make sure we did NOT navigate anywhere
    expect(mockNavigate).not.toHaveBeenCalled()
  })


})
