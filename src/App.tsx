import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BootSequence from './components/BootSequence';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Business from './pages/Business';
import Media from './pages/Media';
import Blog from './pages/Blog';
import Poetry from './pages/Poetry';
import Guestbook from './pages/Guestbook';
import BlogPostPage from './pages/BlogPostPage';
import NotFound from './pages/NotFound';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import CrtBurst from './components/CrtBurst';
import useKonami from './hooks/useKonami';


function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/business" element={<Business />} />
        <Route path="/media" element={<Media />} />
        <Route path="/poetry" element={<Poetry />} />
        <Route path="/guestbook" element={<Guestbook />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  // Boot runs once per browser session, and never for reduced-motion users.
  const [booting, setBooting] = useState(() => {
    if (typeof window === 'undefined') return false;
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
  // Clicking the UofT crest on the Home page fires the same CRT burst.
  useEffect(() => {
    window.addEventListener('sjsys:crt', triggerCrt);
    return () => window.removeEventListener('sjsys:crt', triggerCrt);
  }, [triggerCrt]);

  return (
    <Router>
      {booting && <BootSequence onDone={finishBoot} />}
      <div className={`container${crt ? ' crt-burst-active' : ''}`}>
        <Navigation />
        <AnimatedRoutes />
        <Footer />
      </div>
      {crt && <CrtBurst />}
    </Router>
  );
}

export default App;
