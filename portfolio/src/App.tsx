import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Media from './pages/Media';
import Blog from './pages/Blog';
import Poetry from './pages/Poetry';
import BrutalistY2k from './pages/BrutalistY2k';
import Navigation from './components/Navigation';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/media" element={<Media />} />
        <Route path="/poetry" element={<Poetry />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/brutalist-y2k" element={<BrutalistY2k />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="container">
        <Navigation />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
