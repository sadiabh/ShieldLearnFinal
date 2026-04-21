import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'
import styles from './Admin.module.css'

// Categories students can assign to their posts — kept in sync with Forum.jsx
const CATEGORIES = [
  '💬 General',
  '🛡️ Security Tips',
  '🏥 Healthcare',
  '📚 Study Groups',
  '❓ Ask for Help',
]

const EMPTY_FORM = {
  author:   '',
  avatar:   '👤',
  category: '💬 General',
  title:    '',
  body:     '',
}

// Formats a DB timestamp into a readable date string for the admin table
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const d = new Date(dateString)
  return d.toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

export default function AdminForum() {
  const [posts, setPosts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null) // the post being edited, or null for a new post
  const [form, setForm]           = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving]       = useState(false)

  // Load all forum posts from the database
  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet('/api/admin/forum')
    if (!error) setPosts(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Open the modal to add a brand new post
  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  // Open the modal pre-filled with an existing post's data so we can edit it
  function openEdit(post) {
    setEditing(post)
    setForm({
      author:   post.author,
      avatar:   post.avatar   || '👤',
      category: post.category || '💬 General',
      title:    post.title,
      body:     post.body,
    })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFormError('')
  }

  // Helper to update a single field in the form without replacing the whole object
  function field(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  // Save a new post or update an existing one
  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('Title and body are both required.')
      return
    }
    setSaving(true)
    setFormError('')

    // Send the save request — either update an existing post or create a new one
    let result
    if (editing) {
      result = await apiPut(`/api/admin/forum/${editing.id}`, {
        author:   form.author.trim() || 'Anonymous',
        avatar:   form.avatar || '👤',
        category: form.category,
        title:    form.title.trim(),
        body:     form.body.trim(),
      })
    } else {
      result = await apiPost('/api/admin/forum', {
        author:   form.author.trim() || 'Anonymous',
        avatar:   form.avatar || '👤',
        category: form.category,
        title:    form.title.trim(),
        body:     form.body.trim(),
      })
    }
    const { error } = result

    setSaving(false)
    if (error) {
      setFormError(error.message)
    } else {
      setModalOpen(false)
      load() // Refresh the table so the change shows immediately
    }
  }

  // Ask for confirmation then permanently delete a post
  async function handleDelete(post) {
    if (!window.confirm(`Delete post "${post.title}"? This cannot be undone.`)) return
    await apiDelete(`/api/admin/forum/${post.id}`)
    load()
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Forum Posts</h1>
        <button className={styles.addBtn} onClick={openAdd}>+ Add Post</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className={styles.tableWrap}>
          {posts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No forum posts yet. Students will see them appear once you add some!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Body</th>
                  <th>Likes</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.id}</td>
                    <td>{post.avatar} {post.author}</td>
                    <td>{post.category}</td>
                    {/* Truncate long titles so the table doesn't stretch */}
                    <td title={post.title}>
                      {post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}
                    </td>
                    <td title={post.body}>
                      {post.body.length > 60 ? post.body.slice(0, 60) + '…' : post.body}
                    </td>
                    <td>{post.likes}</td>
                    <td>{formatDate(post.created_at)}</td>
                    <td>
                      <div className={styles.btnGroup}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={() => openEdit(post)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(post)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className={styles.modal}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing ? 'Edit Post' : 'Add Post'}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {/* Show any validation or server error above the form fields */}
              {formError && <div className={styles.errorBanner}>{formError}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Author name</label>
                <input
                  className={styles.formInput}
                  value={form.author}
                  onChange={field('author')}
                  placeholder="e.g. Alex_Cyber"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Avatar (emoji)</label>
                <input
                  className={styles.formInput}
                  value={form.avatar}
                  onChange={field('avatar')}
                  placeholder="👤"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select
                  className={styles.formInput}
                  value={form.category}
                  onChange={field('category')}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title *</label>
                <input
                  className={styles.formInput}
                  value={form.title}
                  onChange={field('title')}
                  placeholder="Post title..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Body *</label>
                <textarea
                  className={styles.formInput}
                  value={form.body}
                  onChange={field('body')}
                  rows={5}
                  placeholder="Post body..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
