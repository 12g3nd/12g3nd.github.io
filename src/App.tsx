import { Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import BootSequence from './components/BootSequence';
// Pages are imported eagerly, and in this order, on purpose. The stylesheet is
// one file assembled in module-graph order, so this import list *is* the
// cascade — and src/styles/print.css, imported after App in main.tsx, only
// beats the page styles because they all come first. Route-level splitting was
// tried: it moved every page's CSS behind print.css, and saved about 15 kB
// gzipped over leaving the pages here, next to the ~40 kB that splitting out
// the post bodies (src/data/postBodies.ts) saves without touching the CSS.
import Home from './pages/Home';
import Projects from './pages/Projects';
import Business from './pages/Business';
import Media from './pages/Media';
import Blog from './pages/Blog';
import Poetry from './pages/Poetry';
import PoemPage from './pages/PoemPage';
import Guestbook from './pages/Guestbook';
import Sitemap from './pages/Sitemap';
import BlogPostPage from './pages/BlogPostPage';
import NotFound from './pages/NotFound';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import CrtBurst from './components/CrtBurst';
import CommandPalette from './components/CommandPalette';
import ScrollRestoration from './components/ScrollRestoration';
import useKonami from './hooks/useKonami';
import usePostPrefetch from './hooks/usePostPrefetch';

// The boot screen is switched off, not removed — it is coming back once it has
// been reworked. Flip this to restore it exactly as it was: once per browser
// session, never under reduced motion.
const BOOT_ENABLED = false;


function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* Keyed so each page gets a fresh boundary and one still arriving never
          blanks the one leaving. Only a transmission's body ever suspends, and
          main.tsx and usePostPrefetch mostly have it in hand before then. */}
      <Suspense key={location.pathname} fallback={null}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/business" element={<Business />} />
          <Route path="/media" element={<Media />} />
          <Route path="/poetry" element={<Poetry />} />
          <Route path="/poetry/:slug" element={<PoemPage />} />
          <Route path="/guestbook" element={<Guestbook />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  // Boot runs once per browser session, and never for reduced-motion users.
  const [booting, setBooting] = useState(() => {
    if (!BOOT_ENABLED || typeof window === 'undefined') return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem('sjsys_booted') === '1';
    return !reduced && !seen;
  });

  const finishBoot = () => {
    sessionStorage.setItem('sjsys_booted', '1');
    setBooting(false);
  };

  // Konami code → 15s CRT meltdown. Reduced-motion users get nothing.
  const [crt, setCrt] = useState(false);
  const triggerCrt = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setCrt(true);
    window.setTimeout(() => setCrt(false), 15000);
  }, []);
  useKonami(triggerCrt);
  usePostPrefetch();
  // Clicking the UofT crest on the Home page fires the same CRT burst.
  useEffect(() => {
    window.addEventListener('sjsys:crt', triggerCrt);
    return () => window.removeEventListener('sjsys:crt', triggerCrt);
  }, [triggerCrt]);

  // LazyMotion + `m` in place of `motion`: the site only fades, exits and
  // reveals on scroll, and `motion` ships drag, layout and shared-element code
  // on top of that to every visitor. `strict` makes a stray `motion.` throw
  // rather than quietly pull all of it back in.
  return (
    <LazyMotion features={domAnimation} strict>
      <Router>
        <ScrollRestoration />
        {booting && <BootSequence onDone={finishBoot} />}
        <div className={`container${crt ? ' crt-burst-active' : ''}`}>
          <Navigation />
          <AnimatedRoutes />
          <Footer />
        </div>
        {crt && <CrtBurst />}
        <CommandPalette />
      </Router>
    </LazyMotion>
  );
}

export default App;
