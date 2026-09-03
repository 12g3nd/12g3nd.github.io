import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/command-bar.css'
import App from './App.tsx'
// Last on purpose. CSS lands in the bundle in module-graph order, so anything
// imported before App.tsx is overridden by the page stylesheets App pulls in —
// and print.css exists to override exactly those. Importing it after App is
// what puts it at the end of the cascade instead of the beginning.
import './styles/print.css'

// Restore the (easter-egg) light theme before first paint to avoid a flash.
if (localStorage.getItem('sjsys_theme') === 'light') {
  document.documentElement.classList.add('theme-light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
