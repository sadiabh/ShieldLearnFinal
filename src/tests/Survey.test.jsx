// ============================================================
//  Survey.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  After finishing a module, users fill in a 6-question survey.
//  Questions are shown one at a time with Back/Next navigation.
//
//  File under test: src/pages/Survey.jsx
//
//  KEY CONCEPT — location.state:
//    Survey reads the module name/icon from React Router's
//    location.state (set when ModuleComplete navigates to /survey).
//    We pass fake state via MemoryRouter's initialEntries.
//
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Survey from '../pages/Survey'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'student' }, loading: false, signOut: vi.fn() }),
}))

// mockApiPost lets us check whether the survey was submitted to the server
const mockApiPost = vi.fn()
vi.mock('../lib/api', () => ({
  apiPost: (...args) => mockApiPost(...args),
}))

// ── Helper ────────────────────────────────────────────────────────────────────

function renderSurvey(state = { moduleName: 'Password on Lock!', moduleIcon: '🔑' }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/survey', state }]}>
      <Routes><Route path="/survey" element={<Survey />} /></Routes>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Survey and Feedback Collection', () => {

  beforeEach(() => { vi.clearAllMocks() })


  // TEST 1 — Module name shown and first question displayed
  //  Users must see which module they're rating and start at question 1.
  //  "Question 1 of 6" appears in both the progress bar span and the question
  //  number div, so getAllByText is used to avoid "multiple elements" error.
  it('shows the module name and the first star-rating question on load', () => {
    renderSurvey()

    expect(screen.getByText('Password on Lock!')).toBeInTheDocument()
    expect(screen.getAllByText(/Question 1 of 6/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/rate this module overall/i)).toBeInTheDocument()
  })


  // TEST 2 — Back disabled on Q1; required question blocks "Next" without an answer
  //  There's no previous question on Q1 (Back must be disabled).
  //  Required questions must be answered before advancing.
  it('disables Back on Q1 and alerts when Next is clicked without a star rating', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderSurvey()

    // Back button is disabled on the first question
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()

    // Clicking Next without answering triggers a validation alert
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(alertSpy).toHaveBeenCalledWith('Please give a star rating.')

    alertSpy.mockRestore()
  })


  // TEST 3 — Answering Q1 advances to Q2; Back returns to Q1
  //  Navigation must work in both directions.
  it('advances to Q2 after selecting a star rating, and Back returns to Q1', () => {
    renderSurvey()

    // Click the 4th star
    fireEvent.click(screen.getAllByText('★')[3])
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getAllByText(/Question 2 of 6/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/difficulty level/i)).toBeInTheDocument()

    // Go back — should return to Q1
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getAllByText(/Question 1 of 6/i).length).toBeGreaterThan(0)
  })


  // TEST 4 — Submitting calls apiPost and shows the thank-you screen
  //  After all 6 questions, the data should be sent to the server
  //  and a thank-you confirmation screen should appear.
  it('calls apiPost with survey data and shows the thank-you screen on submit', async () => {
    mockApiPost.mockResolvedValue({ data: {}, error: null })
    renderSurvey()

    // Q1: star rating
    fireEvent.click(screen.getAllByText('★')[3])
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Q2: difficulty
    fireEvent.click(screen.getByText(/just right/i))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Q3: helpful parts (optional — skip)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Q4: NPS score
    await waitFor(() => screen.getByText(/recommend/i))
    fireEvent.click(screen.getByText('8'))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Q5: improvement (optional — skip)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Q6: confidence — then submit
    await waitFor(() => screen.getAllByText(/Question 6 of 6/i))
    fireEvent.click(screen.getByText(/fairly confident/i))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    // API should have been called with the module name
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/surveys',
        expect.objectContaining({ moduleName: 'Password on Lock!' })
      )
    })

    // Thank-you message should appear
    expect(await screen.findByText(/thank you for your feedback/i)).toBeInTheDocument()
  })

})
