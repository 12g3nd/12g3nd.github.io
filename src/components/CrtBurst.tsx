import './CrtBurst.css';

/* Full-viewport CRT overlay: heavy scanlines + a rolling refresh bar. The
   chromatic-aberration on the page content itself is driven by the
   `.crt-burst-active` class App puts on the container (see CrtBurst.css).
   Decorative only — never intercepts pointer events. */
export default function CrtBurst() {
  return <div className="crt-burst" aria-hidden="true" />;
}
