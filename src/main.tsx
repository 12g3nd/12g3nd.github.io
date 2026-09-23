import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/command-bar.css'
import App from './App.tsx'
import { preloadPostBody } from './data/postBodies'
// Last on purpose. CSS lands in the bundle in module-graph order, so anything
// imported before App.tsx is overridden by the page stylesheets App pulls in —
// and print.css exists to override exactly those. Importing it after App is
// what puts it at the end of the cascade instead of the beginning.
import './styles/print.css'

// Restore the (easter-egg) light theme before first paint to avoid a flash.
if (localStorage.getItem('sjsys_theme') === 'light') {
  document.documentElement.classList.add('theme-light')
}

// On a transmission, render once its body is in rather than before. The post's
// HTML already asked for that chunk with a modulepreload (see
// scripts/prerenderPlugin.ts), so this is usually a wait on a file that has
// arrived; rendering straight away would commit the nav and footer with nothing
// between them and drop the post in a frame later. Every other route resolves
// at once. A failure renders anyway, and the post's own load gets its turn to
// recover.
const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
preloadPostBody(window.location.pathname).then(render, render)
