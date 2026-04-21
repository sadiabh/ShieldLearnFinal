import { useState } from 'react'
import Header from '../../../components/Header'
import ProgressBar from '../../../components/ProgressBar'
import healthStyles from '../ModuleP1.module.css'

// Healthcare clinical-decision module — NHS-themed "comply or refuse" scenarios.
export default function HealthcarePlayer({ moduleInfo, questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)

  const scenario = questions[currentIndex]
  const isCorrect = selectedAnswer === scenario.correctAction

  function handleAction(action) {
    if (answered) return
    setSelectedAnswer(action)
    if (action === scenario.correctAction) {
      setScore(score + 1)
    }
    setAnswered(true)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      onComplete(score)
    }
  }

  // Determine CSS classes for the action buttons
  function getComplyClass() {
    if (selectedAnswer !== 'comply') return `${healthStyles.actionBtn} ${healthStyles.safe}`
    if (scenario.correctAction === 'comply') return `${healthStyles.actionBtn} ${healthStyles.safe} ${healthStyles.selectedCorrect}`
    return `${healthStyles.actionBtn} ${healthStyles.safe} ${healthStyles.selectedWrong}`
  }

  function getRefuseClass() {
    if (selectedAnswer !== 'refuse') return `${healthStyles.actionBtn} ${healthStyles.danger}`
    if (scenario.correctAction === 'refuse') return `${healthStyles.actionBtn} ${healthStyles.danger} ${healthStyles.selectedCorrect}`
    return `${healthStyles.actionBtn} ${healthStyles.danger} ${healthStyles.selectedWrong}`
  }

  // Returns the CSS class for the Next button — primary blue or green on the last scenario
  function getNextButtonClass() {
    if (currentIndex < questions.length - 1) {
      return `${healthStyles.btn} ${healthStyles.btnPrimary}`
    }
    return `${healthStyles.btn} ${healthStyles.btnSuccess}`
  }

  return (
    <div className={healthStyles.page}>
      <Header title={moduleInfo.title} activePage="modules" />

      <ProgressBar current={currentIndex + 1} total={questions.length} accentColor={moduleInfo.accent_color} />

      <div className={healthStyles.gameContainer}>
        <div className={healthStyles.scoreDisplay}>
          Correct Responses: <span className={healthStyles.scoreNumber}>{score}/{questions.length}</span>
        </div>

        <div className={healthStyles.badgeHeader}>
          <div className={healthStyles.hospitalLogo}>🏥</div>
          <div>
            <div className={healthStyles.badgeTitle}>NHS Staff: Clinical Decision</div>
            <div className={healthStyles.badgeSubtitle}>Scenario {currentIndex + 1} of {questions.length}</div>
          </div>
        </div>

        <div className={healthStyles.contextBox}>
          <div className={healthStyles.contextLabel}>📋 Scenario</div>
          <div className={healthStyles.contextText}>{scenario.context}</div>
        </div>

        <div className={healthStyles.interactionBox}>
          <div className={healthStyles.interactionMeta}>
            <span className={healthStyles.interactionIcon}>{scenario.interaction.icon}</span>
            <span className={healthStyles.interactionFrom}>{scenario.interaction.from}</span>
            <span className={healthStyles.interactionVia}>{scenario.interaction.via}</span>
          </div>
          <div className={healthStyles.interactionMessage}>"{scenario.interaction.message}"</div>
        </div>

        <div className={healthStyles.questionText}>{scenario.question}</div>

        <div className={healthStyles.actionButtons}>
          <div className={getComplyClass()} onClick={() => handleAction('comply')}>
            <span className={healthStyles.actionIcon}>✅</span>
            <span className={healthStyles.actionLabel}>Proceed Safely</span>
          </div>
          <div className={getRefuseClass()} onClick={() => handleAction('refuse')}>
            <span className={healthStyles.actionIcon}>🛡️</span>
            <span className={healthStyles.actionLabel}>Report / Refuse</span>
          </div>
        </div>

        {/* Feedback shown after answering */}
        {answered && (
          <div className={`${healthStyles.feedback} ${isCorrect ? healthStyles.correct : healthStyles.incorrect}`}>
            <div className={healthStyles.feedbackTitle}>
              {isCorrect ? '✅ Correct clinical response!' : '❌ Not the safest choice'}
            </div>
            <div className={healthStyles.feedbackText}>{scenario.explanation}</div>
            <div className={healthStyles.insightsBox}>
              <div className={healthStyles.insightsTitle}>🏥 Clinical Insights</div>
              <ul className={healthStyles.insightsList}>
                {scenario.insights.map((insight) => <li key={insight}>{insight}</li>)}
              </ul>
            </div>
          </div>
        )}

        <div className={healthStyles.buttonContainer}>
          <button
            className={getNextButtonClass()}
            onClick={handleNext}
            disabled={!answered}
          >
            {currentIndex < questions.length - 1 ? 'Next Scenario →' : 'Finish Module'}
          </button>
        </div>
      </div>
    </div>
  )
}
