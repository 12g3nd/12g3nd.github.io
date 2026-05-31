import { Link, useLocation } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './NotFound.css';

/* Any unmounted route resolves here. Framed as a kernel panic so a dead link
   stays in character instead of dumping the user out of the OS. */
export default function NotFound() {
  const location = useLocation();
  useDocumentMeta(
    '404 // KERNEL PANIC',
    "That route isn't mounted on SJ.SYS."
  );

  return (
    <PageTransition>
      <section className="section panic-section">
        <div className="panic-box">
          <h2 className="panic-title"><ScrambleText text="KERNEL_PANIC" /></h2>
          <p className="panic-code">ERR 0x194 — route not mounted</p>

          <pre className="panic-log">{`> requested .................. ${location.pathname}
> resolving mount point ...... [FAILED]
> the path you asked for is not part of this system.`}</pre>

          <div className="panic-mounts">
            <span className="panic-mounts__label">// MOUNTED VOLUMES</span>
            <div className="panic-mounts__list">
              <Link to="/">/home</Link>
              <Link to="/projects">/projects</Link>
              <Link to="/media">/media</Link>
              <Link to="/poetry">/poetry</Link>
              <Link to="/blog">/blog</Link>
            </div>
          </div>

          <Link to="/" className="panic-return">[ REBOOT → / ]</Link>
        </div>
      </section>
    </PageTransition>
  );
}
