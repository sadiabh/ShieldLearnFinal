import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { apiPatch } from '../lib/api'
import styles from './Profile.module.css'

// Profile icon options — one for each available image
const PROFILE_ICONS = [
  { src: '/images/user-profiles/1.png', alt: 'Icon 1' },
  { src: '/images/user-profiles/2.png', alt: 'Icon 2' },
  { src: '/images/user-profiles/3.png', alt: 'Icon 3' },
  { src: '/images/user-profiles/4.png', alt: 'Icon 4' },
  { src: '/images/user-profiles/5.png', alt: 'Icon 5' },
  { src: '/images/user-profiles/6.png', alt: 'Icon 6' },
  { src: '/images/user-profiles/7.png', alt: 'Icon 7' },
  { src: '/images/user-profiles/8.png', alt: 'Icon 8' },
]

export default function Profile() {
  const navigate = useNavigate()

  // Load the saved user from localStorage
  const stored = JSON.parse(localStorage.getItem('auth_user') || 'null')

  // Split the stored full name into first and last parts.
  // e.g. "Sadia Ahmed" → nameParts = ["Sadia", "Ahmed"]
  const nameParts = (stored && stored.name) ? stored.name.split(' ') : []
  const storedFirstName = nameParts[0] || ''
  const storedLastName  = nameParts.slice(1).join(' ') // Everything after the first word

  // State for each editable field
  const [firstName, setFirstName] = useState(storedFirstName)
  const [lastName, setLastName] = useState(storedLastName)
  const [phone, setPhone] = useState((stored && stored.phone) ? stored.phone : '')
  const [linkedin, setLinkedin] = useState((stored && stored.linkedin) ? stored.linkedin : '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedIcon, setSelectedIcon] = useState((stored && stored.avatar_index != null) ? stored.avatar_index : 0)

  const [showModal, setShowModal] = useState(false) // Show/hide the icon picker modal
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Called when the user clicks "Save Changes"
  async function handleSave() {
    if (!stored || !stored.id) return

    setError('')
    setSuccess('')

    // Check passwords match if the user is trying to set a new one
    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // Build the full name from first + last name parts
    let fullName = stored.name // Fallback to the original name
    if (firstName || lastName) {
      fullName = (firstName + ' ' + lastName).trim()
    }

    // Build the data object to send to the server
    const body = {
      name: fullName,
      avatarIndex: selectedIcon,
      phone,
      linkedin,
    }

    // Only include password in the update if the user typed one
    if (newPassword) {
      body.password = newPassword
    }

    setSaving(true)
    const { data, error: err } = await apiPatch(`/api/users/${stored.id}`, body)
    setSaving(false)

    if (err) {
      setError(err.message || 'Failed to save changes.')
    } else {
      // Merge the updated fields into the locally stored user object
      const updated = { ...stored, ...data.user }
      localStorage.setItem('auth_user', JSON.stringify(updated))
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Changes saved!')
      // Hide the success message after 2.5 seconds
      setTimeout(() => setSuccess(''), 2500)
    }
  }

  return (
    <div className={styles.page}>
      <Header title="Profile" activePage="profile" />

      <div className={styles.container}>
        <div className={styles.card}>

          {/* Profile icon — click it to open the icon picker */}
          <div className={styles.profileSection}>
            <div className={styles.profileIcon} onClick={() => setShowModal(true)}>
              <img src={PROFILE_ICONS[selectedIcon].src} alt="Profile icon" />
              <div className={styles.editBadge}>
                {/* Pencil/edit SVG icon */}
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="white" width={16} height={16}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className={styles.profileLabel}>Edit Your Profile Icon</div>
          </div>

          <hr className={styles.divider} />

          {/* Editable form fields */}
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>First Name</label>
              <input type="text" placeholder="Click here to edit" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Last Name</label>
              <input type="text" placeholder="Click here to edit" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Email Address</label>
              {/* readOnly means the user cannot change their email here */}
              <input type="email" placeholder="Click here to edit" value={(stored && stored.email) ? stored.email : ''} readOnly className={styles.readOnly} />
            </div>
            <div className={styles.field}>
              <label>Phone Number</label>
              <input type="tel" placeholder="Click here to edit" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>New Password</label>
              <input type="password" placeholder="Click here to edit" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Confirm New Password</label>
              <input type="password" placeholder="Click here to edit" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Link Your LinkedIn Account Here</label>
              <input type="url" placeholder="Click here to edit" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
          </div>

          {/* Error and success messages */}
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.buttonGroup}>
            {/* navigate(-1) goes back to the previous page */}
            <button className={styles.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Icon picker modal — shown when showModal is true */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          {/* e.stopPropagation() stops the click from closing the modal when clicking inside it */}
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Choose your icon</h2>
            <div className={styles.iconGrid}>
              {PROFILE_ICONS.map((icon, i) => (
                <div
                  key={i}
                  className={`${styles.iconOption} ${selectedIcon === i ? styles.selected : ''}`}
                  onClick={() => { setSelectedIcon(i); setShowModal(false) }}
                >
                  <img src={icon.src} alt={icon.alt} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

