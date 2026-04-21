// ============================================================
//  ALChatbot.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  AL is ShieldLearn's AI cybersecurity assistant. Users type
//  questions and AL replies via the Express backend NLP engine.
//
//  File under test: src/pages/AskAL.jsx
//
//  KEY CONCEPT — mocking the api module:
//    AskAL sends messages using apiPost from lib/api.js (same as every
//    other page). We replace the whole module with vi.mock() so no real
//    network request is made and we can control what the server replies.
//
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AskAL from '../pages/AskAL'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'student' }, loading: false, signOut: vi.fn() }),
}))

// AskAL now uses apiPost from lib/api.js (same as every other page).
// We replace the whole module with a fake so no real network request is made.
const mockApiPost = vi.fn()
vi.mock('../lib/api', () => ({
  apiPost: (...args) => mockApiPost(...args),
}))

// Helper — makes the fake apiPost instantly return AL's reply
function mockApiResponse(reply) {
  mockApiPost.mockResolvedValue({ data: { reply }, error: null })
}

function renderAskAL() {
  return render(<MemoryRouter><AskAL /></MemoryRouter>)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AI Chatbot Assistant (AL)', () => {

  beforeEach(() => { vi.clearAllMocks() })


  // TEST 1 — Initial greeting and disabled Send button
  //  On load, AL should greet the user and the Send button must be
  //  disabled until something is typed (prevents empty messages).
  it('shows AL\'s greeting on load and disables Send when input is empty', () => {
    renderAskAL()

    expect(screen.getByText(/Hi! I'm AL, your cybersecurity assistant/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })


  // TEST 2 — Sending a message shows it in the chat and clears the input
  //  We use a custom message that doesn't match any chip button, so
  //  getByText finds exactly one match (the chat bubble).
  it('shows the user\'s message in the chat and clears the input after Send', async () => {
    mockApiResponse('Encryption protects your data.')
    renderAskAL()

    const input = screen.getByPlaceholderText(/ask me about phishing/i)
    // Use a message that does NOT match any quick-question chip button
    fireEvent.change(input, { target: { value: 'Tell me about network security' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByText('Tell me about network security')).toBeInTheDocument()
    expect(input.value).toBe('') // input cleared after send
  })


  // TEST 3 — "Thinking..." appears while loading; AL's reply appears after
  //  Between the user sending and the reply arriving, a loading indicator
  //  must show. We verify it appears by making apiPost never resolve.
  it('shows "Thinking..." while loading', async () => {
    // Return a Promise that never resolves — keeps the loading state on screen
    mockApiPost.mockReturnValue(new Promise(() => {}))
    renderAskAL()

    fireEvent.change(screen.getByPlaceholderText(/ask me about phishing/i), { target: { value: 'Explain malware' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // While waiting for a reply, the loading indicator should be visible
    await waitFor(() => expect(screen.getByText(/thinking/i)).toBeInTheDocument())
  })


  // TEST 4 — Quick-question chips pre-fill the input; Enter key also sends
  //  After clicking a chip and pressing Enter, the same text appears in BOTH
  //  the chip button and the chat bubble — so getAllByText checks for >= 2.
  it('pre-fills input when a chip is clicked and sends on Enter key', async () => {
    mockApiResponse('A firewall filters network traffic.')
    renderAskAL()

    // Click a chip — it should pre-fill the input
    fireEvent.click(screen.getByText(/What is phishing\?/i))
    const input = screen.getByPlaceholderText(/ask me about phishing/i)
    expect(input.value).toBe('What is phishing?')

    // Press Enter to send; text now appears in chip AND chat bubble
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(screen.getAllByText('What is phishing?').length).toBeGreaterThanOrEqual(2)
  })

})
