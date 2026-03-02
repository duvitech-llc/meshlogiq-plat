import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// If you're using React 18+ and want to handle uncaught errors:
if (import.meta.env.DEV) {
  console.log('Development mode')
}