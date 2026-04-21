// ─────────────────────────────────────────────────────────────────────────────
//  server.js  —  ShieldLearn Backend API (Supabase edition)
//
//  Express server that exposes REST endpoints used by the React frontend.
//  Data lives in Supabase (Postgres). Auth is still our own bcrypt + users
//  table (we did NOT switch to Supabase Auth in this migration).
//
//  References:
//    Express docs:        https://expressjs.com/en/5x/api.html
//    bcryptjs:            https://github.com/dcodeIO/bcrypt.js
//    @supabase/supabase-js: https://supabase.com/docs/reference/javascript
//    CORS explained:      https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
//    REST API intro:      https://developer.mozilla.org/en-US/docs/Glossary/REST
//
//  Schema lives in supabase/schema.sql. Initial data was migrated once via
//  server/migrate-to-supabase.js — neither needs to run again.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path')
const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Load env vars from .env.local (repo root). On Vercel, env vars come from
// the project dashboard so this is a no-op there.
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { getResponse } = require('./chatbot')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// The service-role key bypasses Row Level Security — use it only on the
// server, NEVER in the browser.
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const PORT = process.env.PORT || 3001

// ── Helper: fail fast on Supabase errors ─────────────────────────────────────
// Every Supabase query returns { data, error }. If error is set, we send a 500.
function send500(res, err) {
  console.error(err)
  res.status(500).json({ error: err.message || 'Database error' })
}

// ── App ────────────────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, phone, role, avatarIndex } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  // Check if the email is already taken before inserting
  const { data: existing, error: lookupErr } = await sb
    .from('users').select('id').eq('email', email).maybeSingle()
  if (lookupErr) return send500(res, lookupErr)
  if (existing) return res.status(400).json({ error: 'Email already registered' })

  const id = crypto.randomUUID()
  const password_hash = bcrypt.hashSync(password, 10)

  const { error } = await sb.from('users').insert({
    id,
    email,
    password_hash,
    name: name ?? null,
    phone: phone ?? null,
    role: role ?? null,
    avatar_index: avatarIndex ?? null,
  })
  if (error) return send500(res, error)

  res.json({ user: { id, email, name, phone, role, avatar_index: avatarIndex } })
})

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const { data: user, error } = await sb
    .from('users').select('*').eq('email', email).maybeSingle()
  if (error) return send500(res, error)

  // Same generic error whether the email or password is wrong — prevents
  // attackers from probing which accounts exist (user enumeration).
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(400).json({ error: 'Invalid email or password' })
  }

  const { password_hash, ...safeUser } = user
  res.json({ user: safeUser })
})

// GET /api/modules  — returns categories with nested modules
app.get('/api/modules', async (_req, res) => {
  // Supabase nested-select: `categories(*, modules(*))` returns each category
  // with its modules array attached. The foreignTable order keeps modules
  // sorted by id within each category.
  const { data, error } = await sb
    .from('categories')
    .select('*, modules(*)')
    .order('id', { ascending: true })
    .order('id', { foreignTable: 'modules', ascending: true })
  if (error) return send500(res, error)
  res.json(data)
})

// GET /api/modules/:id  — single module info
app.get('/api/modules/:id', async (req, res) => {
  const { data: mod, error } = await sb
    .from('modules').select('*').eq('id', req.params.id).maybeSingle()
  if (error) return send500(res, error)
  if (!mod) return res.status(404).json({ error: 'Module not found' })
  res.json(mod)
})

// GET /api/modules/:id/questions  — questions for a module, ordered
app.get('/api/modules/:id/questions', async (req, res) => {
  const { data, error } = await sb
    .from('questions').select('data')
    .eq('module_id', req.params.id)
    .order('order_index', { ascending: true })
  if (error) return send500(res, error)
  // 'data' is JSONB now — Supabase already returns it as a JS object, no JSON.parse needed.
  res.json(data.map((r) => r.data))
})

// POST /api/scores  — save a score after completing a module
app.post('/api/scores', async (req, res) => {
  const { userId, moduleId, score, total, passed, badge } = req.body
  if (!userId || !moduleId) return res.status(400).json({ error: 'userId and moduleId are required' })

  const { error } = await sb.from('scores').insert({
    user_id: userId,
    module_id: moduleId,
    score,
    total,
    passed: passed ? 1 : 0,
    badge: badge ?? null,
  })
  if (error) return send500(res, error)

  res.json({ ok: true })
})

// PATCH /api/users/:id  — update profile fields
app.patch('/api/users/:id', async (req, res) => {
  const { name, avatarIndex, phone, password, linkedin } = req.body

  const { data: user, error: getErr } = await sb
    .from('users').select('*').eq('id', req.params.id).maybeSingle()
  if (getErr) return send500(res, getErr)
  if (!user) return res.status(404).json({ error: 'User not found' })

  let newPasswordHash = user.password_hash
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
    newPasswordHash = bcrypt.hashSync(password, 10)
  }

  const { error: updErr } = await sb.from('users').update({
    name: name ?? user.name,
    phone: phone !== undefined ? phone : user.phone,
    linkedin: linkedin !== undefined ? linkedin : (user.linkedin ?? null),
    avatar_index: avatarIndex !== undefined ? avatarIndex : user.avatar_index,
    password_hash: newPasswordHash,
  }).eq('id', req.params.id)
  if (updErr) return send500(res, updErr)

  const { data: updated, error: selErr } = await sb
    .from('users')
    .select('id, email, name, phone, role, avatar_index, linkedin')
    .eq('id', req.params.id).maybeSingle()
  if (selErr) return send500(res, selErr)

  res.json({ user: updated })
})

// GET /api/scores/:userId  — get all scores for a user
app.get('/api/scores/:userId', async (req, res) => {
  // Joined select: pull the related module's title and path alongside each score.
  const { data, error } = await sb
    .from('scores')
    .select('*, modules(title, path)')
    .eq('user_id', req.params.userId)
    .order('completed_at', { ascending: false })
  if (error) return send500(res, error)
  // Flatten the nested modules object into module_title / module_path
  // so the frontend gets a flat row instead of `{ ..., modules: { title, path } }`.
  res.json(data.map(({ modules, ...s }) => ({
    ...s,
    module_title: modules?.title ?? null,
    module_path:  modules?.path  ?? null,
  })))
})

// ── Admin API ─────────────────────────────────────────────────────────────────

app.get('/api/admin/categories', async (_req, res) => {
  const { data, error } = await sb.from('categories').select('*').order('id')
  if (error) return send500(res, error)
  res.json(data)
})

app.post('/api/admin/categories', async (req, res) => {
  const { icon, label } = req.body
  if (!label) return res.status(400).json({ error: 'Label is required' })
  const { data, error } = await sb.from('categories')
    .insert({ icon: icon ?? '📁', label })
    .select().single()
  if (error) {
    // 23505 = unique_violation in Postgres
    if (error.code === '23505') return res.status(400).json({ error: 'Label must be unique' })
    return send500(res, error)
  }
  res.json(data)
})

app.put('/api/admin/categories/:id', async (req, res) => {
  const { icon, label } = req.body
  const { error } = await sb.from('categories')
    .update({ icon: icon ?? '📁', label })
    .eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

app.delete('/api/admin/categories/:id', async (req, res) => {
  const { error } = await sb.from('categories').delete().eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

app.get('/api/admin/modules', async (_req, res) => {
  const { data, error } = await sb
    .from('modules')
    .select('*, categories(label)')
    .order('id')
  if (error) return send500(res, error)
  res.json(data.map(({ categories, ...m }) => ({
    ...m,
    category_label: categories?.label ?? null,
  })))
})

app.post('/api/admin/modules', async (req, res) => {
  const { category_id, icon, title, description, level, path: modPath, coming_soon, module_type, badge, accent_color } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })
  const { data, error } = await sb.from('modules').insert({
    category_id,
    icon: icon ?? '📚',
    title,
    description: description ?? null,
    level: level ?? 'beginner',
    path: modPath ?? null,
    coming_soon: coming_soon ? 1 : 0,
    module_type: module_type ?? null,
    badge: badge ?? null,
    accent_color: accent_color ?? null,
  }).select().single()
  if (error) return send500(res, error)
  res.json(data)
})

app.put('/api/admin/modules/:id', async (req, res) => {
  const { category_id, icon, title, description, level, path: modPath, coming_soon, module_type, badge, accent_color } = req.body
  const { error } = await sb.from('modules').update({
    category_id,
    icon: icon ?? '📚',
    title,
    description: description ?? null,
    level: level ?? 'beginner',
    path: modPath ?? null,
    coming_soon: coming_soon ? 1 : 0,
    module_type: module_type ?? null,
    badge: badge ?? null,
    accent_color: accent_color ?? null,
  }).eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

app.delete('/api/admin/modules/:id', async (req, res) => {
  const { error } = await sb.from('modules').delete().eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

app.get('/api/admin/questions/:moduleId', async (req, res) => {
  const { data, error } = await sb.from('questions')
    .select('*')
    .eq('module_id', req.params.moduleId)
    .order('order_index')
  if (error) return send500(res, error)
  // 'data' is already a JS object (JSONB) — no JSON.parse needed.
  res.json(data)
})

app.post('/api/admin/questions', async (req, res) => {
  const { module_id, order_index, data: qData } = req.body
  const { data, error } = await sb.from('questions')
    .insert({ module_id, order_index, data: qData })
    .select().single()
  if (error) return send500(res, error)
  res.json(data)
})

app.put('/api/admin/questions/:id', async (req, res) => {
  const { order_index, data: qData } = req.body
  const { error } = await sb.from('questions')
    .update({ order_index, data: qData })
    .eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

app.delete('/api/admin/questions/:id', async (req, res) => {
  const { error } = await sb.from('questions').delete().eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

// POST /api/surveys — save a survey response
app.post('/api/surveys', async (req, res) => {
  const { moduleName, q1, q2, q3, q4, q5, q6 } = req.body
  if (!moduleName) return res.status(400).json({ error: 'moduleName is required' })
  const { data, error } = await sb.from('surveys').insert({
    module_name:   moduleName,
    q1_rating:     q1 ?? null,
    q2_difficulty: q2 ?? null,
    q3_helpful:    q3 ?? null,    // JSONB — pass the array directly
    q4_nps:        q4 ?? null,
    q5_feedback:   q5 || null,
    q6_confidence: q6 ?? null,
  }).select().single()
  if (error) return send500(res, error)
  res.json(data)
})

// GET /api/admin/surveys — all survey responses for the admin dashboard
app.get('/api/admin/surveys', async (_req, res) => {
  const { data, error } = await sb.from('surveys').select('*').order('created_at', { ascending: false })
  if (error) return send500(res, error)
  // q3_helpful is JSONB — already a JS array (or null). Default to [] for the UI.
  res.json(data.map((r) => ({ ...r, q3_helpful: r.q3_helpful ?? [] })))
})

// ── Chatbot API ───────────────────────────────────────────────────────────────

// POST /api/chat — receives a user message and returns the bot's reply.
app.post('/api/chat', (req, res) => {
  const { message } = req.body
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Please provide a message.' })
  }
  const reply = getResponse(message.trim())
  res.json({ reply })
})

// ── Forum API ─────────────────────────────────────────────────────────────────

// GET /api/forum — all posts, newest first
app.get('/api/forum', async (_req, res) => {
  const { data, error } = await sb.from('forum_posts').select('*').order('created_at', { ascending: false })
  if (error) return send500(res, error)
  res.json(data)
})

// POST /api/forum — student submits a new post
app.post('/api/forum', async (req, res) => {
  const { user_id, author, avatar, category, title, body } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' })
  const { data, error } = await sb.from('forum_posts').insert({
    user_id:  user_id  ?? null,
    author:   author   || 'Anonymous',
    avatar:   avatar   || '👤',
    category: category || '💬 General',
    title,
    body,
  }).select().single()
  if (error) return send500(res, error)
  res.json(data)
})

// ── Admin Forum API ───────────────────────────────────────────────────────────

app.get('/api/admin/forum', async (_req, res) => {
  const { data, error } = await sb.from('forum_posts').select('*').order('created_at', { ascending: false })
  if (error) return send500(res, error)
  res.json(data)
})

app.post('/api/admin/forum', async (req, res) => {
  const { author, avatar, category, title, body } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' })
  const { data, error } = await sb.from('forum_posts').insert({
    author:   author   || 'Admin',
    avatar:   avatar   || '👤',
    category: category || '💬 General',
    title,
    body,
  }).select().single()
  if (error) return send500(res, error)
  res.json(data)
})

app.put('/api/admin/forum/:id', async (req, res) => {
  const { author, avatar, category, title, body } = req.body
  const { error } = await sb.from('forum_posts').update({
    author,
    avatar:   avatar   || '👤',
    category: category || '💬 General',
    title,
    body,
  }).eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

app.delete('/api/admin/forum/:id', async (req, res) => {
  const { error } = await sb.from('forum_posts').delete().eq('id', req.params.id)
  if (error) return send500(res, error)
  res.json({ ok: true })
})

// ── Start ──────────────────────────────────────────────────────────────────────
// Only bind a local port when run directly (npm run server). On Vercel the
// serverless wrapper imports `app` and handles requests without listen().
if (require.main === module) {
  app.listen(PORT, () => console.log(`ShieldLearn API running on http://localhost:${PORT}`))
}

module.exports = app
