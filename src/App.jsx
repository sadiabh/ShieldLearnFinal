// React Router imports - these help us navigate between pages
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// AuthProvider gives the whole app access to login info
// useAuth lets us read the current logged-in user
import { AuthProvider, useAuth } from './context/AuthContext'

// Page imports - each file is one screen/page of the app
import Splash from './pages/Splash'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ModuleList from './pages/ModuleList'
import Forum from './pages/Forum'
import Profile from './pages/Profile'
import HowTo from './pages/HowTo'
import ModulePlayer from './pages/modules/ModulePlayer'
import ModuleComplete from './pages/modules/ModuleComplete'
import Survey from './pages/Survey'
import AskAL from './pages/AskAL'

// Admin portal imports
import AdminLayout from './pages/admin/AdminLayout'
import AdminCategories from './pages/admin/AdminCategories'
import AdminModules from './pages/admin/AdminModules'
import AdminQuestions from './pages/admin/AdminQuestions'
import AdminSurveys from './pages/admin/AdminSurveys'
import AdminForum from './pages/admin/AdminForum'

// ProtectedRoute: only lets logged-in users see a page.
// If the user is not logged in, they get sent to /login instead.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Still checking if the user is logged in — show a simple loading message
  if (loading) {
    return <div>Loading...</div>
  }

  // User is logged in — show the page they asked for
  if (user) {
    return children
  }

  // User is NOT logged in — redirect them to the login page
  return <Navigate to="/login" />
}

// AdminRoute: only lets admin users see a page.
// Non-admins are redirected to /dashboard.
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (user && user.role === 'admin') {
    return children
  }

  return <Navigate to="/dashboard" replace />
}

// App is the root component. It sets up routing (which URL shows which page).
export default function App() {
  return (
    // BrowserRouter enables page navigation using the URL bar
    <BrowserRouter>
      {/* AuthProvider makes login state available to every component */}
      <AuthProvider>
        <Routes>
          {/* Public pages — anyone can visit these */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected pages — only logged-in users can visit these */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/modules" element={<ProtectedRoute><ModuleList /></ProtectedRoute>} />
          <Route path="/modules/:id" element={<ProtectedRoute><ModulePlayer /></ProtectedRoute>} />
          <Route path="/modules/complete" element={<ProtectedRoute><ModuleComplete /></ProtectedRoute>} />
          <Route path="/survey" element={<ProtectedRoute><Survey /></ProtectedRoute>} />
          <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/howto" element={<ProtectedRoute><HowTo /></ProtectedRoute>} />
          <Route path="/ask-al" element={<ProtectedRoute><AskAL /></ProtectedRoute>} />

          {/* Admin portal — only accessible to users with role === 'admin' */}
          <Route path="/admin" element={<Navigate to="/admin/categories" replace />} />
          <Route path="/admin/categories" element={<AdminRoute><AdminLayout><AdminCategories /></AdminLayout></AdminRoute>} />
          <Route path="/admin/modules" element={<AdminRoute><AdminLayout><AdminModules /></AdminLayout></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><AdminLayout><AdminQuestions /></AdminLayout></AdminRoute>} />
          <Route path="/admin/surveys" element={<AdminRoute><AdminLayout><AdminSurveys /></AdminLayout></AdminRoute>} />
          <Route path="/admin/forum" element={<AdminRoute><AdminLayout><AdminForum /></AdminLayout></AdminRoute>} />

          {/* Catch-all: any unknown URL goes back to the home/splash page */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
