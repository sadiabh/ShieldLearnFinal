import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'
import styles from './Admin.module.css'

const EMPTY_FORM = {
  category_id:  '',
  icon:         '📚',
  title:        '',
  description:  '',
  level:        'beginner',
  path:         '',
  coming_soon:  false,
  module_type:  '',
  badge:        '',
  accent_color: '#7c3aed',
}

function levelClass(level) {
  if (level === 'intermediate') return styles.tagIntermediate
  if (level === 'advanced')     return styles.tagAdvanced
  return styles.tagBeginner
}

export default function AdminModules() {
  const [modules, setModules]       = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    // Promise.all fetches both lists at the same time instead of one after the other.
    // This makes the page load faster because both requests run in parallel.
    const [modsRes, catsRes] = await Promise.all([
      apiGet('/api/admin/modules'),
      apiGet('/api/admin/categories'),
    ])
    if (!modsRes.error) setModules(modsRes.data)
    if (!catsRes.error) setCategories(catsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(mod) {
    setEditing(mod)
    setForm({
      category_id:  mod.category_id,
      icon:         mod.icon,
      title:        mod.title,
      description:  mod.description ?? '',
      level:        mod.level,
      path:         mod.path ?? '',
      coming_soon:  !!mod.coming_soon,
      module_type:  mod.module_type ?? '',
      badge:        mod.badge ?? '',
      accent_color: mod.accent_color ?? '#7c3aed',
    })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFormError('')
  }

  function field(key) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [key]: val }))
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setFormError('Title is required.')
      return
    }
    if (!form.category_id) {
      setFormError('Category is required.')
      return
    }
    setSaving(true)
    setFormError('')

    const payload = {
      ...form,
      title:        form.title.trim(),
      description:  form.description.trim() || null,
      path:         form.path.trim() || null,
      module_type:  form.module_type.trim() || null,
      badge:        form.badge.trim() || null,
      accent_color: form.accent_color || null,
      category_id:  Number(form.category_id),
    }

    // Send the save request — either update an existing module or create a new one
    let result
    if (editing) {
      result = await apiPut(`/api/admin/modules/${editing.id}`, payload)
    } else {
      result = await apiPost('/api/admin/modules', payload)
    }
    const { error } = result

    setSaving(false)
    if (error) {
      setFormError(error.message)
    } else {
      setModalOpen(false)
      load()
    }
  }

  async function handleDelete(mod) {
    if (!window.confirm(`Delete module "${mod.title}"? This cannot be undone.`)) return
    await apiDelete(`/api/admin/modules/${mod.id}`)
    load()
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Modules</h1>
        <button className={styles.addBtn} onClick={openAdd}>+ Add Module</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className={styles.tableWrap}>
          {modules.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No modules yet. Add your first one!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Icon</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Level</th>
                  <th>Path</th>
                  <th>Coming Soon</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.id}>
                    <td>{mod.id}</td>
                    <td style={{ fontSize: '1.2rem' }}>{mod.icon}</td>
                    <td style={{ fontWeight: 500 }}>{mod.title}</td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillGray}`}>
                        {mod.category_label}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.tag} ${levelClass(mod.level)}`}>
                        {mod.level}
                      </span>
                    </td>
                    <td>
                      {mod.path ? (
                        <code style={{ fontSize: '0.78rem', color: '#6d28d9' }}>{mod.path}</code>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td>
                      {mod.coming_soon ? (
                        <span className={`${styles.pill} ${styles.pillAmber}`}>Yes</span>
                      ) : (
                        <span className={`${styles.pill} ${styles.pillGreen}`}>No</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.btnGroup}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={() => openEdit(mod)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(mod)}
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

      {modalOpen && (
        <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Edit Module' : 'Add Module'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {formError && <div className={styles.errorBanner}>{formError}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <select className={styles.formSelect} value={form.category_id} onChange={field('category_id')}>
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Icon</label>
                  <input className={styles.formInput} value={form.icon} onChange={field('icon')} placeholder="📚" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Title *</label>
                  <input className={styles.formInput} value={form.title} onChange={field('title')} placeholder="Module title" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={field('description')} placeholder="Short description…" rows={3} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Level</label>
                  <select className={styles.formSelect} value={form.level} onChange={field('level')}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Module Type</label>
                  <input className={styles.formInput} value={form.module_type} onChange={field('module_type')} placeholder="quiz / scroll / healthcare" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Path</label>
                <input className={styles.formInput} value={form.path} onChange={field('path')} placeholder="/modules/6 or /gm1.html" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Badge</label>
                  <input className={styles.formInput} value={form.badge} onChange={field('badge')} placeholder="Badge name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={form.accent_color} onChange={field('accent_color')} style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, padding: 2 }} />
                    <input className={styles.formInput} value={form.accent_color} onChange={field('accent_color')} placeholder="#7c3aed" />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkRow} style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className={styles.inlineCheck}
                    checked={form.coming_soon}
                    onChange={field('coming_soon')}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Coming Soon</span>
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeModal}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
