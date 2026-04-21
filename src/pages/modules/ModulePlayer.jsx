import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../../lib/api'
import QuizPlayer from './players/QuizPlayer'
import ScrollPlayer from './players/ScrollPlayer'
import HealthcarePlayer from './players/HealthcarePlayer'
import PhishingPlayer from './players/PhishingPlayer'
import ScenarioCallPlayer from './players/ScenarioCallPlayer'
import PasswordGamePlayer from './players/PasswordGamePlayer'

// Thin dispatcher — loads the module + its questions from the server, then picks
// the right player component based on module_type. Each player handles its own
// question-by-question state and calls onComplete(score) when the user finishes.
export default function ModulePlayer() {
  // useParams reads the :id from the URL, e.g. /modules/6 → id = "6"
  const { id } = useParams()
  const navigate = useNavigate()

  const [moduleInfo, setModuleInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch the module info and questions when the component loads
  useEffect(() => {
    async function loadModule() {
      const moduleResult = await apiGet(`/api/modules/${id}`)
      const questionsResult = await apiGet(`/api/modules/${id}/questions`)

      if (moduleResult.data) setModuleInfo(moduleResult.data)
      if (questionsResult.data) setQuestions(questionsResult.data)
      setLoading(false)
    }
    loadModule()
  }, [id])

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading module...</div>
  }

  if (!moduleInfo || questions.length === 0) {
    return <div style={{ padding: '2rem' }}>Module not found.</div>
  }

  // Called by the player when the user finishes the last question —
  // save the score to the server and navigate to the results page.
  async function handleComplete(score) {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
    const passed = score / questions.length >= 0.7

    if (user) {
      await apiPost('/api/scores', {
        userId: user.id,
        moduleId: Number(id),
        score,
        total: questions.length,
        passed,
        badge: moduleInfo.badge,
      })
    }

    navigate('/modules/complete', {
      state: {
        moduleName: moduleInfo.title,
        moduleIcon: moduleInfo.icon,
        score,
        total: questions.length,
        badge: moduleInfo.badge,
        passing: 0.7,
      },
    })
  }

  const playerProps = { moduleInfo, questions, onComplete: handleComplete }

  switch (moduleInfo.module_type) {
    case 'quiz':          return <QuizPlayer {...playerProps} />
    case 'scroll':        return <ScrollPlayer {...playerProps} />
    case 'healthcare':    return <HealthcarePlayer {...playerProps} />
    case 'phishing':      return <PhishingPlayer {...playerProps} />
    case 'scenario-call': return <ScenarioCallPlayer {...playerProps} />
    case 'password-game': return <PasswordGamePlayer {...playerProps} />
    default:
      return <div style={{ padding: '2rem' }}>Unknown module type: {moduleInfo.module_type}</div>
  }
}
