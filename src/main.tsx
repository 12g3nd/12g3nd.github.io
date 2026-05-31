import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Restore the (easter-egg) light theme before first paint to avoid a flash.
if (localStorage.getItem('sjsys_theme') === 'light') {
  document.documentElement.classList.add('theme-light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
