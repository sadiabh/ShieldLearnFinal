import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { apiGet, apiPost } from '../lib/api'
import styles from './Forum.module.css'

// Permanent pinned post — always shown at the top to welcome new users
const PINNED_POST = {
  id:         'pinned',
  author:     'ShieldLearn Team',
  avatar:     '🛡️',
  category:   '💬 General',
  title:      '👋 Welcome to the ShieldLearn Community Forum!',
  body:       'This is your space to share what you have learned, ask questions, and support each other. To get started: introduce yourself below, share a tip from a module you have completed, or ask for help with anything cybersecurity related. Be kind, be curious, and stay safe online!',
  likes:      42,
  created_at: '2025-01-01 10:00:00',
}

// Fake seed posts — always visible so the forum never looks empty
const SEED_POSTS = [
  {
    id:         'seed-1',
    author:     'Alex_Cyber',
    avatar:     '🦊',
    category:   '🛡️ Security Tips',
    title:      'Just completed Password on Lock — here is what I learned!',
    body:       'I had no idea how weak my old passwords were. The drag-and-drop game really made it click for me. My tip: use a phrase instead of a single word — something like "MyDog$Loves2Run!" is way harder to crack!',
    likes:      18,
    created_at: '2025-01-10 14:22:00',
  },
  {
    id:         'seed-2',
    author:     'HealthcareHero',
    avatar:     '⚕️',
    category:   '🏥 Healthcare',
    title:      'The Human Hacking in Healthcare module was eye-opening',
    body:       'I work in the NHS and I was surprised how realistic the scenarios felt. Every healthcare professional should complete this module — it really makes you think twice before sharing patient info, even with colleagues.',
    likes:      31,
    created_at: '2025-01-12 09:05:00',
  },
  {
    id:         'seed-3',
    author:     'StudentSafe_2025',
    avatar:     '🎓',
    category:   '❓ Ask for Help',
    title:      'Has anyone else been targeted by the student loan scam?',
    body:       'Got a suspicious call last week claiming my loan would be cancelled unless I confirmed my details immediately. Hung up straight away after doing the Ring Ring module — recognised all the warning signs. Stay alert everyone!',
    likes:      24,
    created_at: '2025-01-14 16:48:00',
  },
  {
    id:         'seed-4',
    author:     'ScrollSmart_Sam',
    avatar:     '📱',
    category:   '🛡️ Security Tips',
    title:      'Quick tip: check your social media privacy settings today',
    body:       'After completing the Scroll Smart module I went through all my accounts and found my birthday, phone number, and location were all public. Changed everything to private in under 10 minutes. Highly recommend doing the same!',
    likes:      15,
    created_at: '2025-01-15 11:30:00',
  },
]

// Sidebar navigation links for the forum
const SIDEBAR_ITEMS = [
  { icon: '🏠', label: 'Home Feed', active: true },
  { icon: '🔥', label: 'Trending', badge: '5' },
  { icon: '📚', label: 'Study Groups' },
  { icon: '🛡️', label: 'Cybersecurity', dot: '#3b82f6' },
  { icon: '💬', label: 'General Chat', dot: '#22c55e' },
  { icon: '❓', label: 'Ask for Help', dot: '#f59e0b' },
]

// Available categories students can pick when writing a post
const CATEGORIES = [
  '💬 General',
  '🛡️ Security Tips',
  '🏥 Healthcare',
  '📚 Study Groups',
  '❓ Ask for Help',
]

// Helper: converts a DB timestamp like "2025-01-14 10:30:00" into "2h ago"
function timeAgo(dateString) {
  const now = new Date()
  const then = new Date(dateString)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1)  return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function Forum() {
  // All posts loaded from the database
  const [posts, setPosts] = useState([])

  // True while we're waiting for posts to load from the server
  const [loading, setLoading] = useState(true)

  // Error message if the fetch fails
  const [fetchError, setFetchError] = useState(null)

  // Whether the "write a new post" form is visible
  const [showComposer, setShowComposer] = useState(false)

  // Fields for the new post the user is typing
  const [newTitle, setNewTitle]       = useState('')
  const [newBody, setNewBody]         = useState('')
  const [newCategory, setNewCategory] = useState('💬 General')

  // Controls which tab is highlighted
  const [activeTab, setActiveTab] = useState('latest')

  // True while a post is being saved to the server
  const [submitting, setSubmitting] = useState(false)

  // Read the logged-in user once so we can use it anywhere in this component.
  // localStorage is synchronous — safe to call directly here.
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null')

  // Load all posts from the server when the page first opens
  useEffect(() => {
    loadPosts()
  }, [])

  // Fetches posts from the API and updates state
  async function loadPosts() {
    setLoading(true)
    const { data, error } = await apiGet('/api/forum')
    if (error) {
      setFetchError('Could not load posts. Is the server running?')
    } else {
      setPosts(data)
      setFetchError(null)
    }
    setLoading(false)
  }

  // Called when the user clicks "Post" — sends their new post to the server
  async function handleSubmitPost() {
    // Don't submit if either field is blank
    if (!newTitle.trim() || !newBody.trim()) return

    setSubmitting(true)
    const { data, error } = await apiPost('/api/forum', {
      user_id:  user ? user.id   : null,
      author:   user ? user.name : 'Anonymous',
      avatar:   '👤',
      category: newCategory,
      title:    newTitle.trim(),
      body:     newBody.trim(),
    })
    setSubmitting(false)

    if (error) {
      alert('Could not save your post. Please try again.')
      return
    }

    // Add the new post to the top of the list without re-fetching everything
    setPosts(function(prev) { return [data, ...prev] })

    // Reset and hide the composer form
    setNewTitle('')
    setNewBody('')
    setNewCategory('💬 General')
    setShowComposer(false)
  }

  // Work out which posts to show based on the active tab
  function getDisplayedPosts() {
    if (activeTab === 'popular') {
      // Sort a copy of posts by likes (highest first)
      return [...posts].sort(function(a, b) { return b.likes - a.likes })
    }
    if (activeTab === 'my posts') {
      // Show only posts written by the current user
      return posts.filter(function(p) {
        return user && (p.user_id === user.id || p.author === user.name)
      })
    }
    // Default tab: latest — server already returns posts newest first
    return posts
  }

  const displayedPosts = getDisplayedPosts()

  return (
    <div className={styles.page}>
      <Header title="ShieldLearn Forum" activePage="forum" />

      <div className={styles.layout}>

        {/* Sidebar navigation */}
        <div className={`${styles.card} ${styles.sidebar}`}>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`${styles.sidebarItem} ${item.active ? styles.active : ''}`}
            >
              {/* Coloured dot for channels that have activity, otherwise show emoji */}
              {item.dot
                ? <span className={styles.sidebarDot} style={{ background: item.dot }} />
                : <span>{item.icon}</span>
              }
              <span>{item.label}</span>
              {/* Badge shows how many new items are in that section */}
              {item.badge && <span className={styles.sidebarBadge}>{item.badge}</span>}
            </div>
          ))}
        </div>

        {/* Main feed */}
        <div className={styles.card}>
          <div className={styles.feedHeader}>
            <h2>Community Feed</h2>
            <button
              className={styles.newPostBtn}
              onClick={() => setShowComposer(!showComposer)}
            >
              + New Post
            </button>
          </div>

          {/* Tab bar — Latest / Popular / My Posts */}
          <div className={styles.tabs}>
            {['latest', 'popular', 'my posts'].map(tab => (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {/* Capitalise the first letter for display */}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* New post composer — only visible when the student clicks "+ New Post" */}
          {showComposer && (
            <div className={styles.composer}>
              <input
                type="text"
                placeholder="Post title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="What's on your mind?"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
              />
              {/* Category picker so posts can be filtered later */}
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className={styles.categorySelect}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className={styles.composerActions}>
                <button
                  className={styles.btnGhost}
                  onClick={() => setShowComposer(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSubmitPost}
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          )}

          {/* Loading / error states */}
          {loading && <p className={styles.statusMsg}>Loading posts...</p>}
          {fetchError && <p className={styles.statusMsg}>{fetchError}</p>}

          {/* Empty state — if there are no posts to show */}
          {!loading && !fetchError && displayedPosts.length === 0 && (
            <p className={styles.statusMsg}>
              {activeTab === 'my posts'
                ? "You haven't posted anything yet!"
                : 'No posts yet. Be the first to share something!'}
            </p>
          )}

          {/* Pinned welcome post — always shown at the top, never on "my posts" tab */}
          {activeTab !== 'my posts' && (
            <div className={`${styles.postCard} ${styles.pinnedCard}`}>
              <div className={styles.postAvatar}>{PINNED_POST.avatar}</div>
              <div>
                <div className={styles.postMeta}>
                  <span className={styles.postAuthor}>{PINNED_POST.author}</span>
                  <span className={styles.pinnedBadge}>📌 Pinned</span>
                  <span className={styles.postCategory}>{PINNED_POST.category}</span>
                </div>
                <div className={styles.postTitle}>{PINNED_POST.title}</div>
                <div className={styles.postBody}>{PINNED_POST.body}</div>
                <div className={styles.postActions}>
                  <span>❤️ {PINNED_POST.likes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Real posts from the database */}
          {displayedPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postAvatar}>{post.avatar || '👤'}</div>
              <div>
                <div className={styles.postMeta}>
                  <span className={styles.postAuthor}>{post.author}</span>
                  <span className={styles.postTime}>{timeAgo(post.created_at)}</span>
                  <span className={styles.postCategory}>{post.category}</span>
                </div>
                <div className={styles.postTitle}>{post.title}</div>
                <div className={styles.postBody}>{post.body}</div>
                <div className={styles.postActions}>
                  <span>❤️ {post.likes}</span>
                  <span>💬 0</span>
                </div>
              </div>
            </div>
          ))}

          {/* Seed posts — shown on latest and popular tabs to give the forum life */}
          {activeTab !== 'my posts' && SEED_POSTS.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postAvatar}>{post.avatar}</div>
              <div>
                <div className={styles.postMeta}>
                  <span className={styles.postAuthor}>{post.author}</span>
                  <span className={styles.postTime}>{timeAgo(post.created_at)}</span>
                  <span className={styles.postCategory}>{post.category}</span>
                </div>
                <div className={styles.postTitle}>{post.title}</div>
                <div className={styles.postBody}>{post.body}</div>
                <div className={styles.postActions}>
                  <span>❤️ {post.likes}</span>
                  <span>💬 0</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel — featured articles */}
        <div className={styles.card}>
          <h2>Featured Articles</h2>
          <div className={styles.articleCard}>
            <span className={styles.articleBadge}>🔐 Security Tips</span>
            <div className={styles.articleTitle}>Protecting Your Privacy on Social Media</div>
            <div className={styles.articleExcerpt}>
              Discover the best practices for maintaining privacy while staying connected...
            </div>
          </div>
          <div className={styles.articleCard}>
            <span className={styles.articleBadge}>🏥 Healthcare</span>
            <div className={styles.articleTitle}>Healthcare Security Compliance Guide</div>
            <div className={styles.articleExcerpt}>
              A comprehensive guide to protecting patient data and maintaining compliance...
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
