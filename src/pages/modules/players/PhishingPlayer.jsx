import { useState } from 'react'
import Header from '../../../components/Header'
import ProgressBar from '../../../components/ProgressBar'
import quizStyles from '../ModuleS1.module.css'

// ────────────────────────────────────────────────────────────────────────────
// Phishing module — shows a simulated email or SMS and asks the user to spot
// the scam. Tracks shield HP (wrong answers drain it) and a correct-streak.
//
// Note on inline styles: this module uses style={{ ... }} on individual elements
// rather than a separate CSS module file. This is intentional — the phishing UI
// has unique one-off components (email client, SMS bubble, shield bar) that would
// only add clutter to a CSS file. For general shared styles, CSS modules are better.
// Reference: https://react.dev/learn/javascript-in-jsx-with-curly-braces#using-objects-in-jsx
// ────────────────────────────────────────────────────────────────────────────
export default function PhishingPlayer({ moduleInfo, questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [hp, setHp] = useState(5)
  const [streak, setStreak] = useState(0)

  const q = questions[currentIndex]
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

  function handlePhishingSelect(opt) {
    if (answered) return
    setSelectedAnswer(opt)
  }

  function handlePhishingCheck() {
    if (!selectedAnswer || answered) return
    const correct = selectedAnswer === q.correctAnswer
    if (correct) {
      setScore(score + 1)
      setStreak(streak + 1)
    } else {
      setStreak(0)
      setHp(Math.max(0, hp - 1))
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

  return (
    <div className={quizStyles.page}>
      <Header title={moduleInfo.title} activePage="modules" />

      <ProgressBar current={currentIndex + 1} total={questions.length} accentColor={moduleInfo.accent_color} />

      {/* Stats bar */}
      <div style={{maxWidth:860,margin:'0 auto 16px',background:'rgba(255,255,255,0.85)',borderRadius:16,padding:'12px 20px',display:'flex',gap:20,alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>🛡️ Shield Strength: {hp} / 5</div>
          <div style={{height:8,background:'#e2e8f0',borderRadius:999,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(hp/5)*100}%`,background:hp<=1?'#ef4444':hp<=2?'#f59e0b':'linear-gradient(90deg,#6366f1,#7c3aed)',transition:'width 0.4s',borderRadius:999}} />
          </div>
        </div>
        <div style={{padding:'6px 14px',borderRadius:12,background:'rgba(99,102,241,0.08)',border:'1.5px solid rgba(99,102,241,0.2)',textAlign:'center'}}>
          <div style={{fontSize:'0.7rem',color:'#475569',fontWeight:600}}>🔥 Streak</div>
          <div style={{fontSize:'1.25rem',fontWeight:700,color:'#7c3aed',fontFamily:'monospace'}}>{streak}</div>
        </div>
      </div>

      <div className={quizStyles.questionContainer}>
        {/* Attack banner */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:12,background:'linear-gradient(135deg,#fff1f2,#fecaca)',border:'1.5px solid #fca5a5',marginBottom:14,fontSize:'0.8rem',fontWeight:600,color:'#991b1b'}}>
          <span style={{fontSize:'1.1rem'}}>💣</span>
          <span>{q.attackText || 'Incoming phishing attack! Can you spot it?'}</span>
        </div>

        <div className={quizStyles.questionNumber}>Question {currentIndex + 1}</div>

        {/* Scenario */}
        {q.scenario && (
          <div style={{background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',borderLeft:'5px solid #7c3aed',borderRadius:14,padding:'12px 16px',marginBottom:16,color:'#4c1d95',fontSize:'0.875rem',fontStyle:'italic',display:'flex',gap:10,alignItems:'flex-start'}}>
            <span>{q.icon}</span><span>{q.scenario}</span>
          </div>
        )}

        {/* Email prop */}
        {q.email && (
          <div style={{background:'white',border:'1.5px solid #e2e8f0',borderRadius:14,overflow:'hidden',marginBottom:16,fontSize:'0.8rem',boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}>
            <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'8px 14px',display:'flex',alignItems:'center',gap:8}}>
              {['#ef4444','#f59e0b','#22c55e'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}
              <span style={{color:'#94a3b8',fontSize:'0.7rem',marginLeft:6}}>📧 Inbox: New Message</span>
            </div>
            <div style={{padding:'12px 16px'}}>
              {q.email.from && <div style={{display:'flex',gap:6,marginBottom:4}}><span style={{color:'#64748b',fontWeight:700,minWidth:32}}>From:</span><span style={{color:q.email.from.sus?'#dc2626':'#1e293b',fontWeight:q.email.from.sus?700:'normal'}}>{q.email.from.val}</span></div>}
              {q.email.to && <div style={{display:'flex',gap:6,marginBottom:4}}><span style={{color:'#64748b',fontWeight:700,minWidth:32}}>To:</span><span style={{color:'#1e293b'}}>{q.email.to.val}</span></div>}
              {q.email.subject && <div style={{display:'flex',gap:6,marginBottom:4}}><span style={{color:'#64748b',fontWeight:700,minWidth:32}}>Re:</span><span style={{color:'#1e293b'}}>{q.email.subject.val}</span></div>}
              <hr style={{border:'none',borderTop:'1px solid #e2e8f0',margin:'8px 0'}}/>
              {/*
                dangerouslySetInnerHTML lets React render raw HTML strings.
                Normally React escapes HTML to prevent XSS attacks (Cross-Site Scripting).
                Here we use it intentionally because the email body data contains
                <strong> and <br/> tags that are part of the simulated phishing email.
                The data comes from our own server seed (not from user input), so it is safe.
                Reference: https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html
              */}
              <div style={{color:'#334155',lineHeight:1.6}} dangerouslySetInnerHTML={{__html:q.email.body}}/>
              {q.email.link && <a href="#" style={{display:'inline-block',marginTop:8,padding:'4px 12px',background:q.email.link.sus?'#dc2626':'#2563eb',color:'white',fontWeight:700,fontSize:'0.75rem',borderRadius:6,textDecoration:'none'}}>{q.email.link.text}</a>}
            </div>
          </div>
        )}

        {/* SMS prop */}
        {q.sms && (
          <div style={{background:'#f1f5f9',border:'1.5px solid #e2e8f0',borderRadius:18,overflow:'hidden',marginBottom:16,fontSize:'0.8rem',boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}>
            <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'8px 14px',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.8rem',flexShrink:0}}>?</div>
              <div><div style={{color:'#f1f5f9',fontSize:'0.8rem',fontWeight:600}}>{q.sms.sender}</div><div style={{color:'#94a3b8',fontSize:'0.7rem'}}>{q.sms.number}</div></div>
            </div>
            <div style={{padding:'12px 14px'}}>
              <div style={{background:'white',border:'1.5px solid #e2e8f0',borderRadius:'14px 14px 14px 4px',padding:'10px 14px',maxWidth:'85%',color:'#1e293b',lineHeight:1.6}} dangerouslySetInnerHTML={{__html:q.sms.message+(q.sms.link?`<br/><span style="color:${q.sms.link.sus?'#dc2626':'#2563eb'};font-weight:600;text-decoration:underline;word-break:break-all">${q.sms.link.text}</span>`:'')}}/>
              <div style={{fontSize:'0.7rem',color:'#94a3b8',marginTop:4}}>{q.sms.time}</div>
            </div>
          </div>
        )}

        <div className={quizStyles.questionText}>{q.question}</div>

        <div className={quizStyles.optionsContainer}>
          {q.options.map((opt, i) => {
            let cls = quizStyles.option
            if (answered) {
              if (opt === q.correctAnswer) cls = `${quizStyles.option} ${quizStyles.correct}`
              else if (opt === selectedAnswer) cls = `${quizStyles.option} ${quizStyles.incorrect}`
            } else if (selectedAnswer === opt) {
              cls = `${quizStyles.option} ${quizStyles.selected}`
            }
            return (
              <div key={opt} className={cls} onClick={() => handlePhishingSelect(opt)}>
                <div className={quizStyles.optionCheckbox} style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.8rem'}}>{LABELS[i]}</div>
                {opt}
              </div>
            )
          })}
        </div>

        {answered && (
          <div className={quizStyles.explanation}>
            <div className={quizStyles.explanationTitle}>💡 Phishing Intel</div>
            <div>{q.explanation}</div>
          </div>
        )}

        <div className={quizStyles.buttonContainer}>
          <div className={quizStyles.scoreDisplay}>Score: {score}/{questions.length}</div>
          {!answered
            ? <button className={quizStyles.btnPrimary} onClick={handlePhishingCheck} disabled={!selectedAnswer}>🛡️ Check Answer</button>
            : <button className={quizStyles.btnPrimary} onClick={handleNext}>{currentIndex < questions.length - 1 ? 'Next Attack →' : 'Finish Mission'}</button>
          }
        </div>
      </div>
    </div>
  )
}
