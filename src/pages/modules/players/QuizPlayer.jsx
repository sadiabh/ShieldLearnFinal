import { useState } from 'react'
import Header from '../../../components/Header'
import ProgressBar from '../../../components/ProgressBar'
import quizStyles from '../ModuleS1.module.css'

// Standard multiple-choice quiz module.
// Supports three question sub-types: 'multiple-choice', 'select-all', 'true-false'.
export default function QuizPlayer({ moduleInfo, questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [selectedMultiple, setSelectedMultiple] = useState([])
  const [answered, setAnswered] = useState(false)

  const question = questions[currentIndex]
  const isSelectAll = question.type === 'select-all'
  const isTrueFalse = question.type === 'true-false'

  // For true/false, use fixed options. Otherwise use the options from the data.
  function getOptions() {
    if (isTrueFalse) return ['True', 'False']
    return question.options
  }

  // Returns true if the given answer is correct
  function checkCorrect(answer) {
    if (isSelectAll) {
      // Copy both arrays into new ones so we don't change the originals when sorting
      const givenCopy = []
      for (let i = 0; i < answer.length; i++) {
        givenCopy.push(answer[i])
      }
      givenCopy.sort() // Sort alphabetically so order doesn't affect the comparison

      const correctCopy = []
      for (let i = 0; i < question.correctAnswer.length; i++) {
        correctCopy.push(question.correctAnswer[i])
      }
      correctCopy.sort()

      // Convert both to comma-separated strings and compare
      return givenCopy.join(',') === correctCopy.join(',')
    }
    if (isTrueFalse) {
      return (answer === 'True') === question.correctAnswer
    }
    return answer === question.correctAnswer
  }

  // Returns true if a single option is one of the correct answers
  function isOptionCorrect(opt) {
    if (isSelectAll) return question.correctAnswer.includes(opt)
    if (isTrueFalse) return (opt === 'True') === question.correctAnswer
    return opt === question.correctAnswer
  }

  // Returns the CSS class for an option button based on whether it is selected / correct / wrong
  function getOptionClass(opt) {
    // Before answering: just highlight the selected option(s)
    if (!answered) {
      const isSelected = isSelectAll ? selectedMultiple.includes(opt) : selectedAnswer === opt
      if (isSelected) return `${quizStyles.option} ${quizStyles.selected}`
      return quizStyles.option
    }

    // After answering: colour correct options green, wrong selected ones red
    if (isOptionCorrect(opt)) {
      return `${quizStyles.option} ${quizStyles.correct}`
    }

    const wasSelected = isSelectAll ? selectedMultiple.includes(opt) : selectedAnswer === opt
    if (wasSelected) {
      return `${quizStyles.option} ${quizStyles.incorrect}`
    }

    return quizStyles.option
  }

  function handleOptionClick(opt) {
    if (answered) return

    if (isSelectAll) {
      // Toggle this option in/out of the selectedMultiple array
      if (selectedMultiple.includes(opt)) {
        // Remove this option — build a new array without it
        const newSelection = []
        for (let i = 0; i < selectedMultiple.length; i++) {
          if (selectedMultiple[i] !== opt) {
            newSelection.push(selectedMultiple[i])
          }
        }
        setSelectedMultiple(newSelection)
      } else {
        // Add this option — build a new array with it appended
        const newSelection = []
        for (let i = 0; i < selectedMultiple.length; i++) {
          newSelection.push(selectedMultiple[i])
        }
        newSelection.push(opt)
        setSelectedMultiple(newSelection)
      }
    } else {
      // Single-answer: select and immediately check
      setSelectedAnswer(opt)
      if (checkCorrect(opt)) {
        setScore(score + 1)
      }
      setAnswered(true)
    }
  }

  function handleSubmitMultiple() {
    if (answered) return
    if (checkCorrect(selectedMultiple)) {
      setScore(score + 1)
    }
    setAnswered(true)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setSelectedMultiple([])
      setAnswered(false)
    } else {
      onComplete(score)
    }
  }

  return (
    <div className={quizStyles.page}>
      <Header title={moduleInfo.title} activePage="modules" />

      <ProgressBar current={currentIndex + 1} total={questions.length} accentColor={moduleInfo.accent_color} />

      <div className={quizStyles.questionContainer}>
        <div className={quizStyles.questionNumber}>Question {currentIndex + 1}</div>
        {question.scenario && (
          <div className={quizStyles.scenarioBox}>
            {question.scenario}
          </div>
        )}
        <div className={quizStyles.questionText}>{question.question}</div>

        {/* Hint for select-all questions */}
        {isSelectAll && <p className={quizStyles.selectAllHint}>Select all that apply</p>}

        <div className={quizStyles.optionsContainer}>
          {getOptions().map((opt) => (
            <div
              key={opt}
              className={getOptionClass(String(opt))}
              onClick={() => handleOptionClick(String(opt))}
            >
              <div className={quizStyles.optionCheckbox} />
              {String(opt)}
            </div>
          ))}
        </div>

        {/* Submit button for select-all questions */}
        {isSelectAll && !answered && (
          <button
            className={quizStyles.submitBtn}
            onClick={handleSubmitMultiple}
            disabled={selectedMultiple.length === 0}
          >
            Submit Answer
          </button>
        )}

        {/* Explanation shown after answering */}
        {answered && (
          <div className={quizStyles.explanation}>
            <div className={quizStyles.explanationTitle}>💡 Explanation</div>
            <div>{question.explanation}</div>
          </div>
        )}

        <div className={quizStyles.buttonContainer}>
          <div className={quizStyles.scoreDisplay}>Score: {score}/{questions.length}</div>
          <button
            className={quizStyles.btnPrimary}
            onClick={handleNext}
            disabled={!answered}
          >
            {currentIndex < questions.length - 1 ? 'Next →' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  )
}
