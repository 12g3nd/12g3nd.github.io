import { Link } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
  return (
    <nav className="brutalist-nav">
      <Link to="/" className="nav-brand">SRIHITH.SYS</Link>
      <div className="nav-links">
        <Link to="/projects">PROJECTS</Link>
        <Link to="/media">MEDIA</Link>
        <Link to="/blog">BLOG</Link>
      </div>
    </nav>
  );
}
