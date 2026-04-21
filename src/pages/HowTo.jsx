import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
// Plain CSS import — no 'styles' object, just use className="name" strings directly
import './HowTo.css'

// HowTo is shown both to new visitors (before registering) and to users
// who have just registered — after registration, they land here before the dashboard.
export default function HowTo() {
  // useAuth gives us the currently logged-in user (or null if not logged in)
  const { user } = useAuth()

  // Each role card shown in the "Your Learning Path" section
  const rolePaths = [
    {
      icon:    '🎓',
      role:    'Student',
      colour:  '#3b82f6',
      bg:      '#eff6ff',
      modules: ['Intro to Staying Safe', 'Ring Ring... Is It a Scam?', 'Scroll Smart: Protecting Yourself Online'],
    },
    {
      icon:    '🌐',
      role:    'General Public',
      colour:  '#7c3aed',
      bg:      '#f5f3ff',
      modules: ['Intro to Staying Safe', 'Password on Lock!', 'Password on Lock 2', 'Shield against Phishers', 'No more Baiting'],
    },
    {
      icon:    '🏥',
      role:    'Professional',
      colour:  '#0284c7',
      bg:      '#f0f9ff',
      modules: ['Intro to Staying Safe', 'Password on Lock!', 'Shield against Phishers', 'No more Baiting', 'Human Hacking in Healthcare'],
    },
  ]

  // Each feature shown in the "Dashboard & Progress" section
  const dashboardFeatures = [
    { icon: '📊', label: 'Stats row',         desc: 'See how many modules you have completed, your average score, and total stars.' },
    { icon: '🗺️', label: 'Learning path',     desc: 'A personalised checklist showing your required modules and how far you have got.' },
    { icon: '🏆', label: 'Achievement stars', desc: 'Score 70% or above on a module to earn its achievement star.' },
    { icon: '⏱️', label: 'Recent activity',   desc: 'Your last 5 quiz attempts with scores and star ratings at a glance.' },
  ]

  return (
    <div className="body">
      <div className="container">

        {/* ── Card 1: Welcome ─────────────────────────────────────────────── */}
        <div className="card">
          <div className="shieldLogo">
            <img src="/images/logo.png" alt="ShieldLearn logo" />
          </div>

          <h1>Welcome to ShieldLearn 👋</h1>

          <div className="section">
            {/* Welcome message for a newly registered user */}
            <p>
              You are all set! Here is a quick guide to everything ShieldLearn has to offer
              so you can hit the ground running.
            </p>
          </div>

          {/* Big green dashboard button — the main action on this page */}
          <div className="actions">
            {user ? (
              // Logged-in user (just registered) — send them to their dashboard
              <Link to="/dashboard" className="btnDashboard">Go to My Dashboard</Link>
            ) : (
              // Visitor who hasn't registered yet
              <>
                <Link to="/register" className="btnPrimary">Get Started</Link>
                <Link to="/login" className="btnSecondary">Already have an account?</Link>
              </>
            )}
          </div>
        </div>

        {/* ── Card 2: Your Personalised Learning Path ────────────────────── */}
        <div className="card">
          <div className="shieldLogo">
            <img src="/images/logo.png" alt="ShieldLearn logo" />
          </div>

          <h1>Your Learning Path 🗺️</h1>

          <div className="section">
            <p>
              When you register, you pick a role. ShieldLearn uses that to build a
              <strong> personalised list of modules</strong> just for you, shown on your Dashboard.
              All paths start with the same foundation module.
            </p>
          </div>

          {/* Show one card per role with the modules they will be assigned */}
          {rolePaths.map(function(path) {
            return (
              <div
                key={path.role}
                className="roleCard"
                style={{ borderColor: path.colour, background: path.bg }}
              >
                {/* Role title row */}
                <div className="roleTitle" style={{ color: path.colour }}>
                  {path.icon} {path.role}
                </div>

                {/* List the modules for this role */}
                <ul className="moduleList">
                  {path.modules.map(function(mod, i) {
                    return (
                      <li key={i} className="moduleItem">
                        {/* First module is always "Intro" so we mark it as the foundation */}
                        {i === 0
                          ? <span className="foundationTag">Foundation</span>
                          : <span className="moduleDot" style={{ background: path.colour }} />
                        }
                        {mod}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ── Card 3: Modules & Stars ─────────────────────────────────────── */}
        <div className="card">
          <div className="shieldLogo">
            <img src="/images/logo.png" alt="ShieldLearn logo" />
          </div>

          <h1>Modules &amp; Stars ★</h1>

          <div className="section">
            <div className="sectionHeader">Module Types</div>
            <p>Modules use different formats to keep learning engaging:</p>

            {/* Each module format explained */}
            <div className="typeGrid">
              <div className="typeItem">
                <span className="typeIcon">❓</span>
                <div>
                  <strong>Quiz</strong>
                  <p>Multiple choice, true/false, and scenario questions to test your knowledge.</p>
                </div>
              </div>
              <div className="typeItem">
                <span className="typeIcon">📜</span>
                <div>
                  <strong>Scroll &amp; Decide</strong>
                  <p>Simulate a social media feed and decide what is safe or unsafe to interact with.</p>
                </div>
              </div>
              <div className="typeItem">
                <span className="typeIcon">🔑</span>
                <div>
                  <strong>Password Game</strong>
                  <p>Drag-and-drop keys into padlocks to learn what makes a password strong.</p>
                </div>
              </div>
              <div className="typeItem">
                <span className="typeIcon">🏥</span>
                <div>
                  <strong>Scenarios</strong>
                  <p>Real-world situations where you decide how to protect sensitive data.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="sectionHeader">How Stars Are Earned</div>
            <p>Each module awards up to <strong>3 stars</strong> based on your score:</p>

            {/* Star tier table */}
            <div className="starTiers">
              <div className="starRow">
                <span className="starDisplay" style={{ color: '#f59e0b' }}>★☆☆</span>
                <span className="starThreshold">40% or above</span>
                <span className="starLabel">Good start!</span>
              </div>
              <div className="starRow">
                <span className="starDisplay" style={{ color: '#f59e0b' }}>★★☆</span>
                <span className="starThreshold">70% or above</span>
                <span className="starLabel">Well done!</span>
              </div>
              <div className="starRow">
                <span className="starDisplay" style={{ color: '#f59e0b' }}>★★★</span>
                <span className="starThreshold">90% or above</span>
                <span className="starLabel">Expert!</span>
              </div>
            </div>

            <p style={{ marginTop: 10 }}>
              Scoring <strong>70% or above</strong> also earns you that module's
              <strong> Achievement Star</strong>, shown on your Dashboard.
              You can retry any module to improve your score.
            </p>
          </div>
        </div>

        {/* ── Card 4: AL Chatbot, Forum & Dashboard ──────────────────────── */}
        <div className="card">
          <div className="shieldLogo">
            <img src="/images/logo.png" alt="ShieldLearn logo" />
          </div>

          <h1>Features to Explore 🔍</h1>

          {/* AL AI Chatbot section */}
          <div className="section">
            <div className="sectionHeader">🤖 Ask AL: Your AI Assistant</div>
            <div className="alBox">
              <p>
                <strong>AL</strong> is ShieldLearn's built-in AI chatbot, available any time from the
                navigation bar. AL is powered by <strong>Natural Language Processing (NLP)</strong>
                and can answer your cybersecurity questions in plain English.
              </p>
              <p style={{ marginTop: 8 }}>Try asking AL things like:</p>
              {/* Example questions for the chatbot */}
              <ul className="alExamples">
                <li>"What is phishing?"</li>
                <li>"How do I create a strong password?"</li>
                <li>"What should I do if I get a suspicious call?"</li>
              </ul>
            </div>
          </div>

          {/* Community Forum section */}
          <div className="section">
            <div className="sectionHeader">💬 Community Forum</div>
            <p>
              The Forum is a place to share what you have learned, ask questions, and
              connect with other learners. You can post in categories like General,
              Tips, or Questions. Posts can be liked by the community.
            </p>
          </div>

          {/* Dashboard features section */}
          <div className="section">
            <div className="sectionHeader">📊 Your Dashboard</div>
            <p style={{ marginBottom: 10 }}>Your Dashboard is your personal progress hub. It shows:</p>

            {/* Loop through each dashboard feature */}
            <div className="featureList">
              {dashboardFeatures.map(function(feature) {
                return (
                  <div key={feature.label} className="featureItem">
                    <span className="featureIcon">{feature.icon}</span>
                    <div>
                      <strong>{feature.label}</strong>
                      <p>{feature.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
