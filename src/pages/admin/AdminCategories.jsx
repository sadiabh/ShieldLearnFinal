import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'
import styles from './Admin.module.css'

const EMPTY_FORM = { icon: '📁', label: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState(null) // category being edited, or null for new
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet('/api/admin/categories')
    if (!error) setCategories(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(cat) {
    setEditing(cat)
    setForm({ icon: cat.icon, label: cat.label })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFormError('')
  }

  async function handleSave() {
    if (!form.label.trim()) {
      setFormError('Label is required.')
      return
    }
    setSaving(true)
    setFormError('')

    // Send the save request — either update an existing category or create a new one
    let result
    if (editing) {
      result = await apiPut(`/api/admin/categories/${editing.id}`, {
        icon: form.icon,
        label: form.label.trim(),
      })
    } else {
      result = await apiPost('/api/admin/categories', {
        icon: form.icon,
        label: form.label.trim(),
      })
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

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.label}"? This cannot be undone.`)) return
    await apiDelete(`/api/admin/categories/${cat.id}`)
    load()
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Categories</h1>
        <button className={styles.addBtn} onClick={openAdd}>+ Add Category</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className={styles.tableWrap}>
          {categories.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No categories yet. Add your first one!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Icon</th>
                  <th>Label</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td style={{ fontSize: '1.3rem' }}>{cat.icon}</td>
                    <td>{cat.label}</td>
                    <td>
                      <div className={styles.btnGroup}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={() => openEdit(cat)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(cat)}
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
              <h2 className={styles.modalTitle}>{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {formError && <div className={styles.errorBanner}>{formError}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Icon (emoji)</label>
                <input
                  className={styles.formInput}
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="📁"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Label *</label>
                <input
                  className={styles.formInput}
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. General Modules"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeModal}>
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
