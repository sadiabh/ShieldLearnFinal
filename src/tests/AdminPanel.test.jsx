// ============================================================
//  AdminPanel.test.jsx
// ============================================================
//
//  WHAT THIS FILE TESTS:
//  The admin portal lets admins manage modules, categories,
//  questions, surveys, and forum posts.
//
//  This file tests:
//    • AdminLayout  — only admins can access; non-admins redirected
//    • AdminModules — view table, open add modal, edit pre-fills form,
//                     delete confirms before calling the API
//
//  KEY CONCEPT — role-based access:
//    AdminLayout checks user.role === 'admin'. Any other role
//    (or no user at all) triggers <Navigate to="/dashboard" />.
//
//  KEY CONCEPT — window.confirm:
//    Deleting a module calls window.confirm() to ask for confirmation.
//    We spy on it to control the return value without a real popup.
//
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLayout  from '../pages/admin/AdminLayout'
import AdminModules from '../pages/admin/AdminModules'

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mutable — tests change role to 'admin' or 'student' as needed
let mockUser = { id: 99, name: 'Admin User', role: 'admin', email: 'admin@test.com' }

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, loading: false, signOut: vi.fn() }),
}))

const mockApiGet    = vi.fn()
const mockApiPost   = vi.fn()
const mockApiPut    = vi.fn()
const mockApiDelete = vi.fn()

vi.mock('../lib/api', () => ({
  apiGet:    (...args) => mockApiGet(...args),
  apiPost:   (...args) => mockApiPost(...args),
  apiPut:    (...args) => mockApiPut(...args),
  apiDelete: (...args) => mockApiDelete(...args),
}))

// ── Fake data ─────────────────────────────────────────────────────────────────

const FAKE_MODULES = [
  { id: 1, title: 'Intro to Staying Safe', icon: '🔐', category_id: 1, category_label: 'General', level: 'beginner', path: '/modules/1', coming_soon: 0 },
]
const FAKE_CATEGORIES = [
  { id: 1, icon: '🔐', label: 'General Modules' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin/modules']}>
      <Routes>
        <Route path="/admin/modules" element={<AdminLayout><div>Admin content</div></AdminLayout>} />
        <Route path="/dashboard"     element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderAdminModules() {
  mockApiGet.mockImplementation((path) => {
    if (path === '/api/admin/modules')    return Promise.resolve({ data: FAKE_MODULES,    error: null })
    if (path === '/api/admin/categories') return Promise.resolve({ data: FAKE_CATEGORIES, error: null })
    return Promise.resolve({ data: [], error: null })
  })
  return render(<MemoryRouter><AdminModules /></MemoryRouter>)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Admin Panel — AdminLayout access control', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 99, name: 'Admin User', role: 'admin', email: 'admin@test.com' }
  })


  // TEST 1 — Admin sees the sidebar and their name
  it('renders the admin sidebar with the admin\'s name for role="admin"', () => {
    renderAdminLayout()

    expect(screen.getByText(/Admin Portal/i)).toBeInTheDocument()
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
  })


  // TEST 2 — All navigation links are in the sidebar
  it('shows nav links for Categories, Modules, Questions, Surveys, Forum', () => {
    renderAdminLayout()

    expect(screen.getByRole('link', { name: /categories/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /modules/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /questions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /surveys/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forum/i })).toBeInTheDocument()
  })


  // TEST 3 — Non-admin is redirected to the dashboard
  it('redirects a student (non-admin) to /dashboard', () => {
    mockUser = { id: 1, name: 'Student', role: 'student', email: 'student@test.com' }
    renderAdminLayout()

    // AdminLayout renders <Navigate to="/dashboard" /> for non-admins
    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })


  // TEST 4 — Unauthenticated user (no user at all) is also redirected
  it('redirects when there is no logged-in user', () => {
    mockUser = null
    renderAdminLayout()

    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })

})


describe('Admin Panel — AdminModules (CRUD)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 99, name: 'Admin User', role: 'admin', email: 'admin@test.com' }
  })


  // TEST 1 — Module list loads and shows titles
  it('shows module titles in the table after loading', async () => {
    renderAdminModules()

    expect(await screen.findByText('Intro to Staying Safe')).toBeInTheDocument()
  })


  // TEST 2 — "Add Module" opens the modal; empty title shows a validation error
  //  After the modal opens, both the heading AND the save button say "Add Module",
  //  so we use getByRole('heading') to target the heading specifically.
  it('opens the Add Module modal and shows a validation error on empty title', async () => {
    renderAdminModules()

    // Open modal — click the "+ Add Module" button in the page header
    fireEvent.click(await screen.findByRole('button', { name: /\+ add module/i }))

    // Heading confirms the modal opened
    expect(screen.getByRole('heading', { name: /add module/i })).toBeInTheDocument()

    // Try to save with no title — the save button is the primary button inside the modal footer
    const allAddBtns = screen.getAllByRole('button', { name: /add module/i })
    // The modal's save button is the last "Add Module" button
    fireEvent.click(allAddBtns[allAddBtns.length - 1])
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })


  // TEST 3 — Edit button pre-fills the modal with existing module data
  it('pre-fills the modal form with the module\'s existing data on Edit', async () => {
    renderAdminModules()

    await screen.findByText('Intro to Staying Safe')
    fireEvent.click(screen.getAllByRole('button', { name: /^edit$/i })[0])

    // Modal heading says "Edit Module" and the title input is pre-filled
    expect(screen.getByText('Edit Module')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Intro to Staying Safe')).toBeInTheDocument()
  })


  // TEST 4 — Delete calls window.confirm; confirming calls apiDelete
  it('asks for confirmation before deleting and calls apiDelete on confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)   // admin confirms
    mockApiDelete.mockResolvedValue({ error: null })

    renderAdminModules()
    await screen.findByText('Intro to Staying Safe')

    fireEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0])

    // Confirm dialog should mention the module title
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Intro to Staying Safe'))

    // apiDelete should be called with the correct URL
    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith('/api/admin/modules/1')
    })

    vi.restoreAllMocks()
  })

})
