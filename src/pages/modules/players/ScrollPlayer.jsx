import { useState } from 'react'
import Header from '../../../components/Header'
import ProgressBar from '../../../components/ProgressBar'
import scrollStyles from '../ModuleS2.module.css'

// Renders the phone screen content for a scroll scenario.
// The scenario can be a social-media post, a direct message, or a profile.
function PhoneContent({ scenario }) {
  const type = scenario.type
  const content = scenario.content

  if (type === 'post') {
    return (
      <div>
        <div className={scrollStyles.postHeader}>
          <div className={scrollStyles.postAvatar}>{content.avatar}</div>
          <div className={scrollStyles.postInfo}>
            <div className={scrollStyles.postUsername}>{content.username}</div>
            <div className={scrollStyles.postTime}>{content.time}</div>
          </div>
        </div>
        <div className={scrollStyles.postContent}>{content.text}</div>
        {content.image && <div className={scrollStyles.postImage}>{content.image}</div>}
        <div className={scrollStyles.postActions}>
          <span>❤️ Like</span>
          <span>💬 Comment</span>
          <span>↗️ Share</span>
        </div>
      </div>
    )
  }

  if (type === 'dm') {
    return (
      <div className={scrollStyles.dmContainer}>
        <div className={scrollStyles.dmHeader}>
          <div className={scrollStyles.dmAvatar}>{content.avatar}</div>
          <div className={scrollStyles.dmSender}>{content.sender}</div>
        </div>
        <div className={scrollStyles.dmMessage}>{content.message}</div>
      </div>
    )
  }

  if (type === 'profile') {
    return (
      <div className={scrollStyles.profileHeader}>
        <div className={scrollStyles.profileAvatarLarge}>{content.avatar}</div>
        <div className={scrollStyles.profileUsername}>{content.username}</div>
        <div className={scrollStyles.profileBio}>{content.bio}</div>
      </div>
    )
  }

  return null
}

// Social-media scroll module — user decides whether each post / DM / profile is safe or suspicious.
export default function ScrollPlayer({ moduleInfo, questions, onComplete }) {
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

  // Determine the CSS class for each action button
  function getComplyClass() {
    if (selectedAnswer !== 'comply') return `${scrollStyles.actionBtn} ${scrollStyles.safe}`
    if (isCorrect) return `${scrollStyles.actionBtn} ${scrollStyles.safe} ${scrollStyles.selectedCorrect}`
    return `${scrollStyles.actionBtn} ${scrollStyles.safe} ${scrollStyles.selectedWrong}`
  }

  function getRefuseClass() {
    if (selectedAnswer !== 'refuse') return `${scrollStyles.actionBtn} ${scrollStyles.danger}`
    if (scenario.correctAction === 'refuse') return `${scrollStyles.actionBtn} ${scrollStyles.danger} ${scrollStyles.selectedCorrect}`
    return `${scrollStyles.actionBtn} ${scrollStyles.danger} ${scrollStyles.selectedWrong}`
  }

  // Returns the CSS class for the Next button — primary blue or green on the last scenario
  function getNextButtonClass() {
    if (currentIndex < questions.length - 1) {
      return `${scrollStyles.btn} ${scrollStyles.btnPrimary}`
    }
    return `${scrollStyles.btn} ${scrollStyles.btnSuccess}`
  }

  return (
    <div className={scrollStyles.page}>
      <Header title={moduleInfo.title} activePage="modules" />

      <ProgressBar current={currentIndex + 1} total={questions.length} accentColor={moduleInfo.accent_color} />

      <div className={scrollStyles.gameContainer}>
        <div className={scrollStyles.scoreDisplay}>
          Smart Decisions: <span className={scrollStyles.scoreNumber}>{score}/{questions.length}</span>
        </div>

        {/* Phone mockup showing the social media content */}
        <div className={scrollStyles.phoneMockup}>
          <div className={scrollStyles.phoneNotch} />
          <div className={scrollStyles.phoneScreen}>
            <PhoneContent scenario={scenario} />
          </div>
        </div>

        <div className={scrollStyles.questionSection}>
          <div className={scrollStyles.questionTitle}>{scenario.question}</div>
          <div className={scrollStyles.actionButtons}>
            <div className={getComplyClass()} onClick={() => handleAction('comply')}>
              <span className={scrollStyles.actionIcon}>✅</span>
              <span className={scrollStyles.actionLabel}>Looks Safe</span>
              <span className={scrollStyles.actionDesc}>I would proceed with this</span>
            </div>
            <div className={getRefuseClass()} onClick={() => handleAction('refuse')}>
              <span className={scrollStyles.actionIcon}>🛡️</span>
              <span className={scrollStyles.actionLabel}>Looks Suspicious</span>
              <span className={scrollStyles.actionDesc}>I would avoid this</span>
            </div>
          </div>
        </div>

        {/* Feedback shown after answering */}
        {answered && (
          <div className={`${scrollStyles.feedback} ${isCorrect ? scrollStyles.correct : scrollStyles.incorrect}`}>
            <div className={scrollStyles.feedbackTitle}>
              {isCorrect ? '✅ Great decision!' : '❌ Not quite right'}
            </div>
            <div className={scrollStyles.feedbackText}>{scenario.explanation}</div>
            <div className={scrollStyles.tipsBox}>
              <div className={scrollStyles.tipsTitle}>💡 Key Tips</div>
              <ul className={scrollStyles.tipsList}>
                {scenario.tips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          </div>
        )}

        <div className={scrollStyles.buttonContainer}>
          <button
            className={getNextButtonClass()}
            onClick={handleNext}
            disabled={!answered}
          >
            {currentIndex < questions.length - 1 ? 'Next Scenario →' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  )
}
