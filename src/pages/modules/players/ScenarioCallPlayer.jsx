import { useState } from 'react'
import Header from '../../../components/Header'
import ProgressBar from '../../../components/ProgressBar'
import quizStyles from '../ModuleS1.module.css'

// Scenario-call module — user receives a suspicious phone call and must choose
// whether to refuse/hang up or comply. Uses inline styles for the one-off
// phone UI (caller card, speech bubble, red/green flag boxes).
export default function ScenarioCallPlayer({ moduleInfo, questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)

  const scenario = questions[currentIndex]
  const isCorrect = answered && selectedAnswer === scenario.correctAction

  function handleCallAction(action) {
    if (answered) return
    setSelectedAnswer(action)
    if (action === scenario.correctAction) setScore(score + 1)
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

  return (
    <div className={quizStyles.page}>
      <Header title={moduleInfo.title} activePage="modules" />

      <ProgressBar current={currentIndex + 1} total={questions.length} accentColor={moduleInfo.accent_color} />

      <div className={quizStyles.questionContainer} style={{padding:0,overflow:'hidden'}}>
        {/* Phone interface */}
        <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'24px 28px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(circle,rgba(239,68,68,0.08) 0%,transparent 70%)'}}/>
          <div style={{position:'relative',display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:70,height:70,background:'linear-gradient(135deg,#052e5e,#a869f0)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,boxShadow:'0 0 20px rgba(255,0,0,0.5)',flexShrink:0}}>📞</div>
            <div>
              <div style={{fontSize:'1.2rem',fontWeight:700,color:'white',marginBottom:4}}>{scenario.caller}</div>
              <div style={{fontSize:'0.8rem',color:'#cbd5e1',marginBottom:6}}>{scenario.number}</div>
              <span style={{background:'rgba(239,68,68,0.3)',color:'#fecaca',padding:'3px 12px',borderRadius:20,fontSize:'0.7rem',fontWeight:700}}>⚠️ SUSPICIOUS CALL</span>
            </div>
          </div>
        </div>

        <div style={{padding:'24px 28px'}}>
          {/* Speech bubble */}
          <div style={{background:'white',borderRadius:20,padding:20,marginBottom:20,boxShadow:'0 4px 15px rgba(0,0,0,0.08)',position:'relative',border:'2px solid #e2e8f0'}}>
            <div style={{position:'absolute',top:-10,left:28,width:0,height:0,borderLeft:'10px solid transparent',borderRight:'10px solid transparent',borderBottom:'10px solid white'}}/>
            <div style={{fontSize:'1.1rem',color:'#1e293b',lineHeight:1.6,fontStyle:'italic'}}>"{scenario.question}"</div>
          </div>

          {/* Action buttons — always visible; styled after answering to show result */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            {[
              { action:'refuse', icon:'🛡️', label:'Refuse & Hang Up',       sub:'Protect yourself' },
              { action:'comply', icon:'⚠️', label:'Provide Information', sub:'Answer their request' },
            ].map(({ action, icon, label, sub }) => {
              const isSelected = answered && selectedAnswer === action
              const isThisCorrect = scenario.correctAction === action

              let border = '3px solid #5759c0'
              let bg = 'white'
              let opacity = 1
              let cursor = answered ? 'default' : 'pointer'

              if (answered) {
                if (isSelected && isThisCorrect)  { border = '3px solid #22c55e'; bg = '#f0fdf4' }
                else if (isSelected && !isThisCorrect) { border = '3px solid #ef4444'; bg = '#fef2f2' }
                else if (!isSelected && isThisCorrect) { border = '3px solid #22c55e'; bg = '#f0fdf4'; opacity = 0.6 }
                else { opacity = 0.35 }
              }

              return (
                <button
                  key={action}
                  onClick={() => handleCallAction(action)}
                  disabled={answered}
                  style={{padding:'18px 16px',border,borderRadius:14,background:bg,cursor,fontSize:'0.95rem',fontWeight:600,display:'flex',alignItems:'center',gap:12,color:'#1e293b',transition:'all 0.2s',opacity,textAlign:'left'}}
                >
                  <span style={{fontSize:28}}>{icon}</span>
                  <span>{label}<br/><small style={{fontWeight:400,color:'#64748b'}}>{sub}</small></span>
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div style={{background:isCorrect?'linear-gradient(135deg,#dcfce7,#bbf7d0)':'linear-gradient(135deg,#fee2e2,#fecaca)',borderLeft:`5px solid ${isCorrect?'#22c55e':'#ef4444'}`,borderRadius:14,padding:'18px 20px',marginBottom:20}}>
              <div style={{fontSize:'1rem',fontWeight:700,color:isCorrect?'#15803d':'#991b1b',marginBottom:8}}>{isCorrect?'✅ Correct! Well Done!':'❌ Not Quite!'}</div>
              <div style={{fontSize:'0.9rem',color:'#1e293b',lineHeight:1.6,marginBottom:12}}>{scenario.explanation}</div>
              {scenario.redFlags && (
                <div style={{background:'rgba(239,68,68,0.1)',borderLeft:'4px solid #ef4444',padding:'12px 14px',borderRadius:8}}>
                  <div style={{fontWeight:700,color:'#dc2626',marginBottom:6,fontSize:'0.8rem'}}>🚩 Red Flags in This Call:</div>
                  <ul style={{listStyle:'none',padding:0,margin:0}}>
                    {scenario.redFlags.map(f=><li key={f} style={{padding:'3px 0',color:'#1e293b',fontSize:'0.85rem'}}>• {f}</li>)}
                  </ul>
                </div>
              )}
              {scenario.greenFlags && (
                <div style={{background:'rgba(34,197,94,0.1)',borderLeft:'4px solid #22c55e',padding:'12px 14px',borderRadius:8}}>
                  <div style={{fontWeight:700,color:'#15803d',marginBottom:6,fontSize:'0.8rem'}}>✅ Green Flags in This Call:</div>
                  <ul style={{listStyle:'none',padding:0,margin:0}}>
                    {scenario.greenFlags.map(f=><li key={f} style={{padding:'3px 0',color:'#1e293b',fontSize:'0.85rem'}}>• {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className={quizStyles.buttonContainer}>
            <div className={quizStyles.scoreDisplay}>Scams Detected: {score}/{questions.length}</div>
            {answered && (
              <button className={quizStyles.btnPrimary} onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Scenario →' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
