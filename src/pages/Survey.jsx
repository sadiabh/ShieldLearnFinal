import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { apiPost } from '../lib/api'
import styles from './Survey.module.css'

const TOTAL = 6

const REQUIRED_QUESTIONS = new Set([1, 2, 4, 6])

const DIFFICULTY_OPTIONS = [
  'Too easy – I already knew most of this',
  'Just right – well-paced and clear',
  'Slightly challenging but manageable',
  'Too difficult – I found it hard to follow',
]

const HELPFUL_OPTIONS = [
  'Written explanations',
  'Real-world examples and scenarios',
  'Interactive quiz questions',
  'Tips and key takeaways',
  'AL (the AI assistant)',
]

const CONFIDENCE_OPTIONS = [
  '😎 Very confident – I feel well-prepared',
  '😊 Fairly confident – I learned a lot',
  '🤔 Somewhat confident – I may need to revisit it',
  '😟 Not very confident – I need more practice',
]

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export default function Survey() {
  const navigate = useNavigate()
  const location = useLocation()

  const moduleName = location.state?.moduleName || 'Module'
  const moduleIcon = location.state?.moduleIcon || '🛡️'

  const [current, setCurrent]               = useState(1)
  const [answers, setAnswers]               = useState({})
  const [submitted, setSubmitted]           = useState(false)
  const [starHover, setStarHover]           = useState(0)
  const [improvementText, setImprovementText] = useState('')

  const pct = submitted ? 100 : Math.round((current / TOTAL) * 100)

  function setAnswer(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function toggleCheckbox(option) {
    const existing = answers.q3 || []
    if (existing.includes(option)) {
      setAnswer('q3', existing.filter(o => o !== option))
    } else {
      setAnswer('q3', [...existing, option])
    }
  }

  function validate() {
    if (!REQUIRED_QUESTIONS.has(current)) return true
    if (current === 1 && !answers.q1) { alert('Please give a star rating.'); return false }
    if (current === 2 && !answers.q2) { alert('Please select an option.'); return false }
    if (current === 4 && !answers.q4) { alert('Please select a score.'); return false }
    if (current === 6 && !answers.q6) { alert('Please select an option.'); return false }
    return true
  }

  function handleNext() {
    if (!validate()) return
    setCurrent(c => c + 1)
  }

  function handleBack() {
    setCurrent(c => c - 1)
  }

  async function handleSubmit() {
    if (!validate()) return
    await apiPost('/api/surveys', {
      moduleName,
      q1: answers.q1 ?? null,
      q2: answers.q2 ?? null,
      q3: answers.q3 ?? [],
      q4: answers.q4 ?? null,
      q5: improvementText || null,
      q6: answers.q6 ?? null,
    })
    setSubmitted(true)
  }

  function renderQuestion() {
    const rating = answers.q1 || 0
    const hoverRating = starHover || rating

    if (current === 1) return (
      <div>
        <div className={styles.questionNumber}>Question 1 of {TOTAL}</div>
        <div className={styles.questionText}>
          How would you rate this module overall? <span className={styles.required}>*</span>
        </div>
        <div className={styles.starRating}>
          {[1, 2, 3, 4, 5].map(v => (
            <span
              key={v}
              className={`${styles.star} ${v <= hoverRating ? styles.starActive : ''}`}
              onMouseEnter={() => setStarHover(v)}
              onMouseLeave={() => setStarHover(0)}
              onClick={() => setAnswer('q1', v)}
            >★</span>
          ))}
        </div>
        <div className={styles.starLabel}>
          {rating ? `${STAR_LABELS[rating]} (${rating}/5)` : 'Click a star to rate'}
        </div>
      </div>
    )

    if (current === 2) return (
      <div>
        <div className={styles.questionNumber}>Question 2 of {TOTAL}</div>
        <div className={styles.questionText}>
          How did you find the difficulty level of this module? <span className={styles.required}>*</span>
        </div>
        <div className={styles.optionsList}>
          {DIFFICULTY_OPTIONS.map(opt => (
            <div
              key={opt}
              className={`${styles.optionItem} ${answers.q2 === opt ? styles.selected : ''}`}
              onClick={() => setAnswer('q2', opt)}
            >
              <div className={`${styles.optionRadio} ${answers.q2 === opt ? styles.radioSelected : ''}`} />
              <span className={styles.optionText}>{opt}</span>
            </div>
          ))}
        </div>
      </div>
    )

    if (current === 3) {
      const selected = answers.q3 || []
      return (
        <div>
          <div className={styles.questionNumber}>Question 3 of {TOTAL}</div>
          <div className={styles.questionText}>
            Which parts of the module did you find most helpful?
            <span className={styles.optionalNote}>(Select all that apply)</span>
          </div>
          <div className={styles.optionsList}>
            {HELPFUL_OPTIONS.map(opt => (
              <div
                key={opt}
                className={`${styles.checkboxItem} ${selected.includes(opt) ? styles.selected : ''}`}
                onClick={() => toggleCheckbox(opt)}
              >
                <div className={`${styles.checkboxBox} ${selected.includes(opt) ? styles.checkboxSelected : ''}`}>
                  {selected.includes(opt) ? '✓' : ''}
                </div>
                <span className={styles.optionText}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (current === 4) return (
      <div>
        <div className={styles.questionNumber}>Question 4 of {TOTAL}</div>
        <div className={styles.questionText}>
          How likely are you to recommend ShieldLearn to a friend or colleague? <span className={styles.required}>*</span>
        </div>
        <div className={styles.scaleRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
            <div
              key={v}
              className={`${styles.scaleBtn} ${answers.q4 === v ? styles.scaleBtnSelected : ''}`}
              onClick={() => setAnswer('q4', v)}
            >
              {v}
            </div>
          ))}
        </div>
        <div className={styles.scaleLabels}>
          <span>Not at all likely</span>
          <span>Extremely likely</span>
        </div>
      </div>
    )

    if (current === 5) return (
      <div>
        <div className={styles.questionNumber}>Question 5 of {TOTAL}</div>
        <div className={styles.questionText}>
          Is there anything you felt was missing or could be improved?
        </div>
        <textarea
          className={styles.surveyTextarea}
          rows={5}
          placeholder="Share your thoughts – your feedback helps us make ShieldLearn better for everyone..."
          maxLength={500}
          value={improvementText}
          onChange={e => setImprovementText(e.target.value)}
        />
        <div className={styles.charCount}>{improvementText.length} / 500</div>
      </div>
    )

    if (current === 6) return (
      <div>
        <div className={styles.questionNumber}>Question 6 of {TOTAL}</div>
        <div className={styles.questionText}>
          After completing this module, how confident do you feel about applying what you've learned? <span className={styles.required}>*</span>
        </div>
        <div className={styles.optionsList}>
          {CONFIDENCE_OPTIONS.map(opt => (
            <div
              key={opt}
              className={`${styles.optionItem} ${answers.q6 === opt ? styles.selected : ''}`}
              onClick={() => setAnswer('q6', opt)}
            >
              <div className={`${styles.optionRadio} ${answers.q6 === opt ? styles.radioSelected : ''}`} />
              <span className={styles.optionText}>{opt}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Thank-you screen after submitting
  if (submitted) {
    return (
      <div className={styles.page}>
        <Header title="Module Survey" activePage="modules" />
        <div className={styles.container}>
          <div className={styles.surveyCard}>
            <div className={styles.thankYou}>
              <span className={styles.thankYouIcon}>🎉</span>
              <h2>Thank you for your feedback!</h2>
              <p>
                Your responses help us improve ShieldLearn for everyone.<br />
                Keep learning and staying safe online!
              </p>
              <div className={styles.thankYouActions}>
                <button className={styles.btnDashboard} onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </button>
                <button className={styles.btnModules} onClick={() => navigate('/modules')}>
                  Explore More Modules
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Header title="Module Survey" activePage="modules" />

      <div className={styles.container}>
        {/* Module banner */}
        <div className={styles.moduleBanner}>
          <div className={styles.moduleIconBadge}>{moduleIcon}</div>
          <div className={styles.moduleInfo}>
            <h2>{moduleName}</h2>
            <p>Please take a moment to share your feedback on this module.</p>
          </div>
          <div className={styles.completionBadge}>✓ Module Complete</div>
        </div>

        {/* Progress */}
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span>Question {current} of {TOTAL}</span>
            <span>{pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Survey card */}
        <div className={styles.surveyCard}>
          {renderQuestion()}

          <div className={styles.surveyNav}>
            <button
              className={styles.btnBack}
              onClick={handleBack}
              disabled={current === 1}
            >
              ← Back
            </button>
            {current < TOTAL
              ? <button className={styles.btnNext} onClick={handleNext}>Next →</button>
              : <button className={styles.btnSubmit} onClick={handleSubmit}>✓ Submit Survey</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
