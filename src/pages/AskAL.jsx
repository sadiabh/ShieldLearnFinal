// ─────────────────────────────────────────────────────────────────────────────
//  AskAL.jsx  —  AI Chatbot page for ShieldLearn
//
//  This page shows a chat interface where students can ask cybersecurity
//  questions and get answers from AL, our AI assistant.
//
//  The AI runs on the Express backend (server/chatbot.js) using the 'natural'
//  NLP library — tokenisation, stemming, and Naive Bayes classification.
//
//  React concepts used here:
//    • useState  — track messages and loading state
//    • useEffect — scroll to the latest message automatically
//    • useRef    — reference the chat window DOM element
//    • apiPost   — send the message to the Express API (same helper used across the app)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { apiPost } from '../lib/api'
import Header from '../components/Header'
import styles from './AskAL.module.css'

export default function AskAL() {
  // ── State ────────────────────────────────────────────────────────────────
  // 'messages' is an array of chat bubbles: { sender: 'user'|'al', text: '...' }
  const [messages, setMessages] = useState([
    {
      sender: 'al',
      text: "Hi! I'm AL, your cybersecurity assistant. Ask me anything about phishing, malware, passwords, 2FA, firewalls, or encryption!",
    },
  ])

  // 'input' holds whatever the user is currently typing
  const [input, setInput] = useState('')

  // 'loading' is true while we wait for the server to respond
  const [loading, setLoading] = useState(false)

  // ── Ref ───────────────────────────────────────────────────────────────────
  // We use a ref to scroll the chat window to the bottom after each message
  const chatEndRef = useRef(null)

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  // useEffect runs after every render. Whenever 'messages' changes, scroll down.
  useEffect(() => {
    // scrollIntoView moves the browser view to show the element
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = input.trim()

    // Don't send empty messages
    if (!trimmed || loading) return

    // Add the user's message to the chat immediately (feels responsive!)
    const userMessage = { sender: 'user', text: trimmed }
    setMessages(prev => [...prev, userMessage])
    setInput('')      // Clear the text box
    setLoading(true)  // Show the "AL is thinking..." indicator

    // Send the message to the Express backend — same apiPost helper used everywhere else
    const { data, error } = await apiPost('/api/chat', { message: trimmed })

    if (error) {
      // If the server is down or something goes wrong, show a friendly error
      setMessages(prev => [
        ...prev,
        { sender: 'al', text: "Sorry, I couldn't connect to the server. Make sure it's running!" },
      ])
    } else {
      // Add AL's reply to the chat
      setMessages(prev => [...prev, { sender: 'al', text: data.reply }])
    }

    setLoading(false)
  }

  // ── Handle Enter key ───────────────────────────────────────────────────────
  // Allow sending messages by pressing Enter (not just clicking the button)
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSend()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Shared navigation header — activePage='askal' highlights the button */}
      <Header title="Ask AL" activePage="askal" />

      <div className={styles.container}>
        {/* Page title and description */}
        <div className={styles.titleRow}>
          <span className={styles.icon}>🤖</span>
          <div>
            <h2 className={styles.title}>Ask AL</h2>
            <p className={styles.subtitle}>
              Your AI-powered cybersecurity assistant, powered by NLP (Natural Language Processing)
            </p>
          </div>
        </div>

        {/* ── How it works card ────────────────────────────────────────────── */}
        {/* This panel explains the AI for the final year project demonstration */}
        <div className={styles.infoCard}>
          <h3>How the AI works</h3>
          <p>
            AL uses <strong>Natural Language Processing (NLP)</strong>.
            The backend runs the natural library (JavaScript's equivalent of Python's NLTK):
          </p>
          <ol>
            <li><strong>Tokenisation</strong>: splits your message into individual words</li>
            <li><strong>Stemming</strong>: reduces words to their root (e.g. "phishing" → "phish")</li>
            <li><strong>Naive Bayes Classifier</strong>: a machine learning algorithm that detects the topic</li>
            <li><strong>Intent mapping</strong>: matches the topic to a pre-written educational response</li>
          </ol>
        </div>

        {/* ── Chat window ──────────────────────────────────────────────────── */}
        <div className={styles.chatBox}>
          {/* Render each message as a bubble */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={msg.sender === 'user' ? styles.userBubble : styles.alBubble}
            >
              {/* Show who sent the message */}
              <span className={styles.senderLabel}>
                {msg.sender === 'user' ? 'You' : '🤖 AL'}
              </span>
              {/* Preserve newlines in the response using pre-wrap */}
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          ))}

          {/* "AL is thinking..." typing indicator while waiting for response */}
          {loading && (
            <div className={styles.alBubble}>
              <span className={styles.senderLabel}>🤖 AL</span>
              <p className={styles.typing}>Thinking...</p>
            </div>
          )}

          {/* Invisible element at the bottom — used for auto-scroll */}
          <div ref={chatEndRef} />
        </div>

        {/* ── Input area ───────────────────────────────────────────────────── */}
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="text"
            placeholder="Ask me about phishing, malware, passwords..."
            value={input}
            onChange={e => setInput(e.target.value)}  // Update state as user types
            onKeyDown={handleKeyDown}                  // Send on Enter key
            disabled={loading}                         // Disable while loading
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={loading || !input.trim()}        // Disable if empty or loading
          >
            Send
          </button>
        </div>

        {/* Quick-question chips — lets users try the chatbot with one click */}
        <div className={styles.chips}>
          <span className={styles.chipsLabel}>Try asking:</span>
          {['What is phishing?', 'Explain malware', 'What is 2FA?', 'How does encryption work?'].map(q => (
            <button
              key={q}
              className={styles.chip}
              onClick={() => { setInput(q); }}  // Pre-fill the input with the question
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
