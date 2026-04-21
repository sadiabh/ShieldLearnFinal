// createContext  — creates a shared "box" of data that any component can read
// useContext     — lets a component read data from that shared box
// useEffect      — runs code after the component first appears on screen
// useState       — stores a value that can change; re-renders the component when it does
import { createContext, useContext, useEffect, useState } from 'react'
import { apiPost } from '../lib/api'

// Create the context with a default value of null (no user logged in yet)
const AuthContext = createContext(null)

// AuthProvider wraps our whole app so every component inside can access login info
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // The logged-in user object, or null
  const [loading, setLoading] = useState(true) // True while we are checking localStorage

  // When the app first loads, check if the user was already logged in before
  useEffect(() => {
    const saved = localStorage.getItem('auth_user')
    if (saved) {
      // JSON.parse turns the saved text back into a JavaScript object
      setUser(JSON.parse(saved))
    }
    setLoading(false) // Done checking — hide the loading screen
  }, []) // The [] means this only runs once, when the component first mounts

  // signIn: sends email + password to the server and saves the user if login succeeds
  async function signIn(email, password) {
    const { data, error } = await apiPost('/api/auth/login', { email, password })

    // Only save the user if there was no error AND the server sent back a user object
    if (!error && data && data.user) {
      // localStorage keeps the user logged in even after a page refresh
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      setUser(data.user)
    }

    return { data, error }
  }

  // signUp: creates a new account, then logs the user in automatically
  async function signUp(email, password, profile) {
    const { data, error } = await apiPost('/api/auth/register', {
      email,
      password,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      avatarIndex: profile.avatarIndex,
    })

    if (!error && data && data.user) {
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      setUser(data.user)
    }

    return { data, error }
  }

  // signOut: removes saved login data and sets user back to null
  async function signOut() {
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  // value is the object that every component can access by calling useAuth()
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// useAuth is a custom hook — call it inside any component to get the current user
export function useAuth() {
  return useContext(AuthContext)
}
