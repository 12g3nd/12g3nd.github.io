import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must run before the React plugin (enforce: 'pre') so the JSX it emits
    // is handed to @vitejs/plugin-react for the JSX transform + Fast Refresh.
    // Blog posts live in src/content/*.mdx — see src/pages/BlogPostPage.tsx.
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  base: '/',
})
