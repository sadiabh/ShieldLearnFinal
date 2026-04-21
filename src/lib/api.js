// All API requests use relative paths. In dev, Vite proxies /api → :3001
// (see vite.config.js). On Vercel, /api is served by the same origin.
const API_URL = ''

// ── GET request ──────────────────────────────────────────────────────────────
// Use this to FETCH data from the server, e.g. get a list of modules.
// Returns: { data, error } — one of them will always be null.
export async function apiGet(path) {
  try {
    // fetch() sends a request to the server and waits for a response
    const response = await fetch(`${API_URL}${path}`)

    // .json() reads the response body and converts it from JSON text to a JS object
    const data = await response.json()

    // response.ok is false when the server returns an error code (e.g. 404, 500)
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Request failed' } }
    }

    // All good — return the data with no error
    return { data, error: null }
  } catch {
    // fetch itself failed — most likely the server is not running
    return { data: null, error: { message: 'Cannot reach server. Make sure it is running.' } }
  }
}

// ── POST request ─────────────────────────────────────────────────────────────
// Use this to SEND new data to the server, e.g. login or register.
export async function apiPost(path, body) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Tell the server we are sending JSON
      body: JSON.stringify(body), // Convert the JS object into a JSON string
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Request failed' } }
    }

    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Cannot reach server. Make sure it is running.' } }
  }
}

// ── PATCH request ────────────────────────────────────────────────────────────
// Use this to UPDATE existing data on the server, e.g. editing a profile.
export async function apiPatch(path, body) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Request failed' } }
    }

    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Cannot reach server. Make sure it is running.' } }
  }
}

// ── PUT request ──────────────────────────────────────────────────────────────
// Use this to REPLACE an entire record on the server, e.g. updating a module.
// PUT replaces the whole resource; PATCH only updates specific fields.
export async function apiPut(path, body) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) return { data: null, error: { message: data.error || 'Request failed' } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Cannot reach server.' } }
  }
}

// ── DELETE request ────────────────────────────────────────────────────────────
// Use this to REMOVE a record from the server, e.g. deleting a forum post.
// No body is needed — the resource to delete is identified by the URL path.
export async function apiDelete(path) {
  try {
    const response = await fetch(`${API_URL}${path}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) return { data: null, error: { message: data.error || 'Request failed' } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Cannot reach server.' } }
  }
}
