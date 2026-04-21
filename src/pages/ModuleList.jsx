import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { apiGet } from '../lib/api'
import styles from './ModuleList.module.css'

export default function ModuleList() {
  const navigate = useNavigate()

  // categories is an array of objects like: { id, label, icon, modules: [...] }
  const [categories, setCategories] = useState([])

  // Fetch the full module list from the server when this page loads
  useEffect(() => {
    async function loadModules() {
      const { data } = await apiGet('/api/modules')
      if (data) {
        setCategories(data)
      }
    }
    loadModules()
  }, [])

  // Called when the user clicks on a module card
  function handleModuleClick(mod) {
    if (mod.coming_soon) {
      alert('Still under development. Check back soon!')
    } else if (mod.path) {
      if (mod.path.endsWith('.html')) {
        window.location.href = mod.path // Standalone HTML page — full browser navigation
      } else {
        navigate(mod.path) // React route — client-side navigation
      }
    } else {
      alert('This module is coming soon!')
    }
  }

  // Capitalises the first letter of a word, e.g. "beginner" → "Beginner"
  function capitalise(text) {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  return (
    <div className={styles.page}>
      <Header title="All Available Modules" activePage="modules" />

      <div className={styles.container}>
        {/* Loop through each category (e.g. "Password Security") */}
        {categories.map((cat) => (
          <div key={cat.id} className={styles.category}>
            <div className={styles.categoryHeader}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </div>

            {/* Loop through each module inside this category */}
            <div className={styles.modulesGrid}>
              {cat.modules.map((mod) => (
                <div key={mod.id} className={styles.moduleCard} onClick={() => handleModuleClick(mod)}>
                  <div className={styles.moduleIcon}>{mod.icon}</div>
                  <div className={styles.moduleTitle}>{mod.title}</div>
                  <div className={styles.moduleDescription}>{mod.description}</div>
                  {/* The badge colour is controlled by styles[mod.level] e.g. styles.beginner */}
                  <span className={`${styles.moduleBadge} ${styles[mod.level]}`}>
                    {capitalise(mod.level)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
