import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css' // Global CSS styles applied to the whole app

// Find the <div id="root"> in index.html and render our React app inside it.
// React.StrictMode is a helper that shows extra warnings during development.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
