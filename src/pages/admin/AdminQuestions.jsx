import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'
import styles from './Admin.module.css'

const QUESTION_TYPES = ['multiple-choice', 'true-false', 'select-all', 'scenario']

function blankForm() {
  return {
    type:          'multiple-choice',
    scenario:      '',
    question:      '',
    options:       ['', '', '', ''],
    correctAnswer: '',    // string for multiple-choice/scenario, bool string for true-false, array for select-all
    correctAnswers: [],   // used for select-all
    explanation:   '',
    order_index:   0,
  }
}

function hasOptions(type) {
  return type === 'multiple-choice' || type === 'select-all' || type === 'scenario'
}

function typeLabel(type) {
  const map = {
    'multiple-choice': 'Multiple Choice',
    'true-false':      'True / False',
    'select-all':      'Select All',
    'scenario':        'Scenario',
  }
  return map[type] || type
}

export default function AdminQuestions() {
  const [allModules, setAllModules]         = useState([])
  const [selectedMod, setSelectedMod]       = useState('')
  const [selectedModuleType, setSelectedModuleType] = useState('')
  const [questions, setQuestions]           = useState([])
  const [loadingMods, setLoadingMods]       = useState(true)
  const [loadingQs, setLoadingQs]           = useState(false)
  const [modalOpen, setModalOpen]           = useState(false)
  const [editing, setEditing]               = useState(null) // question row or null
  const [form, setForm]                     = useState(blankForm)
  const [formError, setFormError]           = useState('')
  const [saving, setSaving]                 = useState(false)
  const [jsonText, setJsonText]             = useState('')
  const [jsonError, setJsonError]           = useState('')

  // Load all modules once on mount
  useEffect(() => {
    async function fetchMods() {
      setLoadingMods(true)
      const { data, error } = await apiGet('/api/admin/modules')
      if (!error) setAllModules((data || []).filter((m) => m.module_type))
      setLoadingMods(false)
    }
    fetchMods()
  }, [])

  const loadQuestions = useCallback(async (moduleId) => {
    if (!moduleId) { setQuestions([]); return }
    setLoadingQs(true)
    const { data, error } = await apiGet(`/api/admin/questions/${moduleId}`)
    if (!error) setQuestions(data || [])
    setLoadingQs(false)
  }, [])

  useEffect(() => { loadQuestions(selectedMod) }, [selectedMod, loadQuestions])

  // ── Form helpers ───────────────────────────────────────────────────────────

  function formFromQuestion(q) {
    const d = q.data
    return {
      type:           d.type,
      scenario:       d.scenario ?? '',
      question:       d.question,
      options:        d.options ? [...d.options] : ['', '', '', ''],
      correctAnswer:  d.type === 'true-false'
                        ? String(d.correctAnswer)
                        : d.type === 'select-all'
                          ? ''
                          : d.correctAnswer ?? '',
      correctAnswers: d.type === 'select-all'
                        ? (Array.isArray(d.correctAnswer) ? [...d.correctAnswer] : [])
                        : [],
      explanation:    d.explanation ?? '',
      order_index:    q.order_index,
    }
  }

  function openAdd() {
    setEditing(null)
    const f = blankForm()
    f.order_index = questions.length
    setForm(f)
    setFormError('')
    // JSON editor template for non-quiz types
    if (selectedModuleType === 'phishing') {
      setJsonText(JSON.stringify({icon:'📧',scenario:'',attackText:'',question:'',email:null,sms:null,options:['','','',''],correctAnswer:'',explanation:''},null,2))
    } else if (selectedModuleType === 'scenario-call') {
      setJsonText(JSON.stringify({caller:'',number:'',question:'',correctAction:'refuse',redFlags:[],greenFlags:[],explanation:''},null,2))
    } else {
      setJsonText('{}')
    }
    setJsonError('')
    setModalOpen(true)
  }

  function openEdit(q) {
    setEditing(q)
    if (selectedModuleType !== 'quiz') {
      setJsonText(JSON.stringify(q.data, null, 2))
      setJsonError('')
      setFormError('')
      setModalOpen(true)
      return
    }
    setForm(formFromQuestion(q))
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFormError('')
  }

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function handleTypeChange(newType) {
    setForm((f) => ({
      ...f,
      type:           newType,
      correctAnswer:  newType === 'true-false' ? 'true' : '',
      correctAnswers: [],
      options:        hasOptions(newType) ? (f.options.length >= 2 ? f.options : ['', '', '', '']) : f.options,
    }))
  }

  function setOption(idx, val) {
    setForm((f) => {
      const opts = [...f.options]
      opts[idx] = val
      return { ...f, options: opts }
    })
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(idx) {
    setForm((f) => {
      const opts = f.options.filter((_, i) => i !== idx)
      // fix correctAnswer if it was this option
      const ca = f.correctAnswer === f.options[idx] ? '' : f.correctAnswer
      const cas = f.correctAnswers.filter((v) => v !== f.options[idx])
      return { ...f, options: opts, correctAnswer: ca, correctAnswers: cas }
    })
  }

  function toggleSelectAll(optVal) {
    setForm((f) => {
      const already = f.correctAnswers.includes(optVal)
      return {
        ...f,
        correctAnswers: already
          ? f.correctAnswers.filter((v) => v !== optVal)
          : [...f.correctAnswers, optVal],
      }
    })
  }

  // ── Build the data payload from form ──────────────────────────────────────

  function buildData() {
    const { type, scenario, question, options, correctAnswer, correctAnswers, explanation } = form
    const filteredOpts = options.map((o) => o.trim()).filter(Boolean)

    const base = { type, question: question.trim(), explanation: explanation.trim() }

    if (type === 'scenario' || (type !== 'true-false' && type !== 'select-all')) {
      base.options = filteredOpts
    }
    if (type === 'multiple-choice' || type === 'scenario') {
      base.correctAnswer = correctAnswer
    }
    if (type === 'true-false') {
      base.correctAnswer = correctAnswer === 'true'
    }
    if (type === 'select-all') {
      base.options = filteredOpts
      base.correctAnswer = correctAnswers
    }
    if (type === 'scenario' && scenario.trim()) {
      base.scenario = scenario.trim()
    }
    return base
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (selectedModuleType !== 'quiz') {
      // JSON editor save path
      let parsed
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        setFormError('Invalid JSON — please fix the syntax before saving.')
        return
      }
      setSaving(true)
      setFormError('')
      // Send the save request — either update an existing question or create a new one
      let result
      if (editing) {
        result = await apiPut(`/api/admin/questions/${editing.id}`, { order_index: editing.order_index, data: parsed })
      } else {
        result = await apiPost('/api/admin/questions', { module_id: Number(selectedMod), order_index: questions.length, data: parsed })
      }
      setSaving(false)
      const { error: jsonSaveError } = result
      if (jsonSaveError) { setFormError(jsonSaveError.message) } else { setModalOpen(false); loadQuestions(selectedMod) }
      return
    }

    const { type, question, options, correctAnswer, correctAnswers, explanation } = form

    if (!question.trim()) { setFormError('Question text is required.'); return }
    if (!explanation.trim()) { setFormError('Explanation is required.'); return }

    if (hasOptions(type)) {
      const filled = options.filter((o) => o.trim())
      if (filled.length < 2) { setFormError('At least 2 options are required.'); return }
    }
    if (type === 'multiple-choice' || type === 'scenario') {
      if (!correctAnswer) { setFormError('Select the correct answer.'); return }
    }
    if (type === 'select-all') {
      if (correctAnswers.length === 0) { setFormError('Select at least one correct answer.'); return }
    }

    setSaving(true)
    setFormError('')

    const data = buildData()

    // Send the save request — either update an existing question or create a new one
    let result
    if (editing) {
      result = await apiPut(`/api/admin/questions/${editing.id}`, {
        order_index: Number(form.order_index),
        data,
      })
    } else {
      result = await apiPost('/api/admin/questions', {
        module_id:   Number(selectedMod),
        order_index: Number(form.order_index),
        data,
      })
    }
    const { error } = result

    setSaving(false)
    if (error) {
      setFormError(error.message)
    } else {
      setModalOpen(false)
      loadQuestions(selectedMod)
    }
  }

  async function handleDelete(q) {
    if (!window.confirm('Delete this question? This cannot be undone.')) return
    await apiDelete(`/api/admin/questions/${q.id}`)
    loadQuestions(selectedMod)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const filledOptions = form.options.filter((o) => o.trim())

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Questions</h1>
        {selectedMod && (
          <button className={styles.addBtn} onClick={openAdd}>+ Add Question</button>
        )}
      </div>

      {/* Module selector */}
      <div className={styles.formGroup} style={{ maxWidth: 420, marginBottom: 28 }}>
        <label className={styles.formLabel}>Select Module</label>
        {loadingMods ? (
          <div className={styles.loading} style={{ padding: '12px 0' }}>Loading modules…</div>
        ) : (
          <select
            className={styles.formSelect}
            value={selectedMod}
            onChange={(e) => {
              setSelectedMod(e.target.value)
              const mod = allModules.find(m => String(m.id) === e.target.value)
              setSelectedModuleType(mod?.module_type || '')
            }}
          >
            <option value="">Choose a module</option>
            {allModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.title} [{m.module_type}]
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Questions list */}
      {selectedMod && (
        loadingQs ? (
          <div className={styles.loading}>Loading questions…</div>
        ) : questions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions yet for this module. Add your first one!</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className={styles.questionCard}>
              <div className={styles.questionCardHeader}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>
                    #{idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span className={styles.questionCardType}>{typeLabel(q.data.type)}</span>
                    <p className={styles.questionCardText} style={{ marginTop: 6, marginBottom: 0 }}>
                      {q.data.question}
                    </p>
                  </div>
                </div>
                <div className={styles.btnGroup} style={{ flexShrink: 0 }}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => openEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                    onClick={() => handleDelete(q)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )
      )}

      {!selectedMod && !loadingMods && (
        <div className={styles.emptyState}>
          <p>Select a module above to manage its questions.</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Edit Question' : 'Add Question'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {formError && <div className={styles.errorBanner}>{formError}</div>}

              {selectedModuleType === 'quiz' ? (
                <>
                  {/* Type */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Question Type</label>
                    <select
                      className={styles.formSelect}
                      value={form.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>{typeLabel(t)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Scenario text (only for scenario type) */}
                  {form.type === 'scenario' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Scenario / Context</label>
                      <textarea
                        className={styles.formTextarea}
                        value={form.scenario}
                        onChange={(e) => setField('scenario', e.target.value)}
                        placeholder="Set the scene for the question…"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Question text */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Question Text *</label>
                    <textarea
                      className={styles.formTextarea}
                      value={form.question}
                      onChange={(e) => setField('question', e.target.value)}
                      placeholder="Enter the question…"
                      rows={3}
                    />
                  </div>

                  {/* Options (multiple-choice, select-all, scenario) */}
                  {hasOptions(form.type) && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Options</label>
                      {form.options.map((opt, idx) => (
                        <div key={idx} className={styles.optionRow}>
                          <input
                            className={styles.formInput}
                            value={opt}
                            onChange={(e) => setOption(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                          />
                          {form.options.length > 2 && (
                            <button
                              type="button"
                              className={styles.removeOptBtn}
                              onClick={() => removeOption(idx)}
                              title="Remove option"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {form.options.length < 6 && (
                        <button type="button" className={styles.addOptBtn} onClick={addOption}>
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {/* Correct Answer */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Correct Answer *</label>

                    {/* multiple-choice / scenario → radio per option */}
                    {(form.type === 'multiple-choice' || form.type === 'scenario') && (
                      filledOptions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Fill in options above first.</p>
                      ) : (
                        filledOptions.map((opt) => (
                          <label key={opt} className={styles.radioRow} style={{ cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="correctAnswer"
                              className={styles.inlineCheck}
                              value={opt}
                              checked={form.correctAnswer === opt}
                              onChange={() => setField('correctAnswer', opt)}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#334155' }}>{opt}</span>
                          </label>
                        ))
                      )
                    )}

                    {/* true-false → True / False radios */}
                    {form.type === 'true-false' && (
                      <>
                        {['true', 'false'].map((val) => (
                          <label key={val} className={styles.radioRow} style={{ cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="correctAnswer"
                              className={styles.inlineCheck}
                              value={val}
                              checked={form.correctAnswer === val}
                              onChange={() => setField('correctAnswer', val)}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#334155', textTransform: 'capitalize' }}>{val}</span>
                          </label>
                        ))}
                      </>
                    )}

                    {/* select-all → checkboxes */}
                    {form.type === 'select-all' && (
                      filledOptions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Fill in options above first.</p>
                      ) : (
                        filledOptions.map((opt) => (
                          <label key={opt} className={styles.checkRow} style={{ cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              className={styles.inlineCheck}
                              checked={form.correctAnswers.includes(opt)}
                              onChange={() => toggleSelectAll(opt)}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#334155' }}>{opt}</span>
                          </label>
                        ))
                      )
                    )}
                  </div>

                  {/* Explanation */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Explanation *</label>
                    <textarea
                      className={styles.formTextarea}
                      value={form.explanation}
                      onChange={(e) => setField('explanation', e.target.value)}
                      placeholder="Explain why this is the correct answer…"
                      rows={3}
                    />
                  </div>

                  {/* Order index */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Order Index</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={form.order_index}
                      onChange={(e) => setField('order_index', e.target.value)}
                      min={0}
                      style={{ maxWidth: 120 }}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Question Data (JSON)</label>
                  <p style={{fontSize:'0.8rem',color:'#64748b',marginBottom:8}}>Edit the question data directly as JSON. Make sure your JSON is valid before saving.</p>
                  <textarea
                    className={styles.formTextarea}
                    value={jsonText}
                    onChange={(e) => { setJsonText(e.target.value); setJsonError('') }}
                    rows={16}
                    style={{fontFamily:'monospace',fontSize:'0.8rem'}}
                    spellCheck={false}
                  />
                  {jsonError && <div style={{color:'#ef4444',fontSize:'0.8rem',marginTop:4}}>{jsonError}</div>}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeModal}>Cancel</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
