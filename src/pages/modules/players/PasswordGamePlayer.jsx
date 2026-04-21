import { useState } from 'react'
import Header from '../../../components/Header'
import ProgressBar from '../../../components/ProgressBar'
import pgStyles from '../ModuleGm2.module.css'

// Password-game module — drag-and-drop (or click) the correct "key" onto a padlock
// to answer each question. Wrong keys shake the padlock; the right key opens it.
export default function PasswordGamePlayer({ moduleInfo, questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [draggedKey, setDraggedKey] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const question = questions[currentIndex]
  const isCorrect = answered && selectedAnswer === question.correctAnswer

  // Called when the user drops or clicks a key onto the padlock
  function handleKeyTryLock(opt) {
    if (answered) return
    setSelectedAnswer(opt)
    if (opt === question.correctAnswer) setScore(score + 1)
    setAnswered(true)
    setIsDraggingOver(false)
    setDraggedKey(null)
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

  function getPadlockClass() {
    if (!answered) {
      return isDraggingOver
        ? `${pgStyles.padlockZone} ${pgStyles.draggingOver}`
        : pgStyles.padlockZone
    }
    return isCorrect
      ? `${pgStyles.padlockZone} ${pgStyles.padlockOpen}`
      : `${pgStyles.padlockZone} ${pgStyles.padlockShake}`
  }

  function getKeyClass(opt) {
    if (!answered) {
      return draggedKey === opt
        ? `${pgStyles.keyCard} ${pgStyles.keyDragging}`
        : pgStyles.keyCard
    }
    if (opt === question.correctAnswer) return `${pgStyles.keyCard} ${pgStyles.keyCorrect}`
    if (opt === selectedAnswer) return `${pgStyles.keyCard} ${pgStyles.keyWrong}`
    return `${pgStyles.keyCard} ${pgStyles.keyNeutral}`
  }

  return (
    <div className={pgStyles.page}>
      <Header title={moduleInfo.title} activePage="modules" />

      <ProgressBar current={currentIndex + 1} total={questions.length} accentColor="#f59e0b" />

      <div className={pgStyles.gameContainer}>
        <div className={pgStyles.scoreDisplay}>
          Locks Cracked: <span className={pgStyles.scoreNumber}>{score} / {questions.length}</span>
        </div>

        {/* Question card */}
        <div className={pgStyles.questionCard}>
          {question.scenario && (
            <div className={pgStyles.scenarioBox}>{question.scenario}</div>
          )}
          <div className={pgStyles.questionText}>{question.question}</div>
        </div>

        {/* Padlock — drag target or result indicator */}
        <div
          className={getPadlockClass()}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => { e.preventDefault(); if (draggedKey) handleKeyTryLock(draggedKey) }}
        >
          <span className={pgStyles.padlockEmoji}>
            {answered && isCorrect ? '🔓' : '🔒'}
          </span>
          {!answered && (
            <span className={pgStyles.padlockLabel}>Drag key here</span>
          )}
          {answered && (
            <span className={pgStyles.padlockLabel}>
              {isCorrect ? 'Unlocked!' : 'Wrong key!'}
            </span>
          )}
        </div>

        {/* Answer keys — draggable and clickable */}
        <div className={pgStyles.keysContainer}>
          {question.options.map((opt) => (
            <div
              key={opt}
              className={getKeyClass(opt)}
              draggable={!answered}
              onDragStart={() => setDraggedKey(opt)}
              onDragEnd={() => { if (!answered) setDraggedKey(null) }}
              onClick={() => handleKeyTryLock(opt)}
            >
              <span className={pgStyles.keyIcon}>🗝️</span>
              <span className={pgStyles.keyText}>{opt}</span>
            </div>
          ))}
        </div>

        {/* Feedback shown after answering */}
        {answered && (
          <>
            <div className={`${pgStyles.resultBanner} ${isCorrect ? pgStyles.resultCorrect : pgStyles.resultWrong}`}>
              {isCorrect ? '✅ Correct! The lock is open!' : '❌ Wrong key! The lock held firm.'}
            </div>
            <div className={pgStyles.explanation}>
              <div className={pgStyles.explanationTitle}>💡 Key Insight</div>
              {question.explanation}
            </div>
            <div className={pgStyles.buttonContainer}>
              <button className={pgStyles.nextBtn} onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Lock →' : 'Finish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
