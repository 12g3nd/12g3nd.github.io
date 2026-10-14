import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createScene, loadSurfer } from './surferGL';
import './Incubator.css';

/**
 * The hero's specimen: the surfer turning on a turntable in an open chamber.
 *
 * It turns on its own. A mouse resting on it brakes it to a stop; dragging
 * spins it by hand, and a flick carries on for a moment before it settles back
 * into the turn. Both work by steering one angular velocity toward a target —
 * zero while hovered, the idle speed otherwise — so every handover (hover,
 * release, leave) eases instead of snapping.
 *
 * Under reduced motion it draws a still frame at the three-quarter view and
 * never starts a loop; dragging still turns it, frame by frame, with no
 * carry-on and no return to spinning. That first frame is drawn synchronously,
 * not on rAF, because scripts/visual.mjs pauses the clock and a rAF frame
 * would never come.
 *
 * Without WebGL2 (or if the mesh fails to load) it shows public/surfer-still.webp
 * instead, a frame rendered from this same scene, so the hero never holds an
 * empty chamber. The image is only requested in that case.
 */

const IDLE = (Math.PI * 2) / 18; // rad/s: a turn every 18 seconds
const START_ANGLE = 0.75;
const RAD_PER_PX = 0.011;

// #00E5FF, the site's accent. On parchment it washes out, so the light theme
// takes it deeper, the way --accent-primary itself does.
const CYAN_DARK: [number, number, number] = [0, 0.898, 1];
const CYAN_LIGHT: [number, number, number] = [0, 0.6, 0.72];
const coolForTheme = () =>
  document.documentElement.classList.contains('theme-light') ? CYAN_LIGHT : CYAN_DARK;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Incubator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  // Shared between the pointer handlers and the render loop.
  const ctl = useRef({ hovered: false, dragging: false, lastX: 0, lastT: 0, angle: START_ANGLE, omega: IDLE, redraw: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = ctl.current;
    let cancelled = false;
    let raf = 0;
    let running = false;
    let onscreen = true;
    let cleanup = () => {};

    loadSurfer('/surfer.bin')
      .then((mesh) => {
        if (cancelled) return;
        const scene = createScene(canvas, mesh);
        if (!scene) {
          setFailed(true);
          return;
        }
        scene.setCool(coolForTheme());

        const still = reducedMotion();
        if (still) {
          c.redraw = () => scene.draw(c.angle, 0, 99, -99);
          c.redraw();
        }

        let last = 0, t0 = 0;
        const frame = (now: number) => {
          if (!running) return;
          if (!t0) t0 = last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          const t = (now - t0) / 1000;
          if (!c.dragging) {
            c.omega += ((c.hovered ? 0 : IDLE) - c.omega) * Math.min(dt * 2.2, 1);
            c.angle += c.omega * dt;
          }
          const reveal = -0.1 + t * 0.9;
          const scan = t < 2 ? -99 : -0.3 + ((t - 2) % 6) * 0.35;
          scene.draw(c.angle, t, reveal, scan);
          raf = requestAnimationFrame(frame);
        };
        const start = () => {
          if (still || running || !onscreen || document.hidden) return;
          running = true;
          raf = requestAnimationFrame(frame);
        };
        const stop = () => { running = false; cancelAnimationFrame(raf); };

        const io = new IntersectionObserver(([e]) => {
          onscreen = e?.isIntersecting ?? true;
          if (onscreen) start(); else stop();
        });
        io.observe(canvas);
        const ro = new ResizeObserver(() => { scene.resize(); if (still) c.redraw(); });
        ro.observe(canvas);
        const themeObs = new MutationObserver(() => { scene.setCool(coolForTheme()); if (still) c.redraw(); });
        themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVis);
        start();

        cleanup = () => {
          stop();
          io.disconnect();
          ro.disconnect();
          themeObs.disconnect();
          document.removeEventListener('visibilitychange', onVis);
          c.redraw = () => {};
          scene.dispose();
        };
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; cleanup(); };
  }, []);

  const c = ctl.current;
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    c.dragging = true;
    c.lastX = e.clientX;
    c.lastT = e.timeStamp;
    c.omega = 0;
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!c.dragging) return;
    const d = (e.clientX - c.lastX) * RAD_PER_PX;
    const dt = Math.max((e.timeStamp - c.lastT) / 1000, 1 / 240);
    c.angle += d;
    // Smoothed, so the flick on release is the hand's speed, not one event's.
    c.omega = c.omega * 0.6 + (d / dt) * 0.4;
    c.lastX = e.clientX;
    c.lastT = e.timeStamp;
    c.redraw();
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!c.dragging) return;
    c.dragging = false;
    // A hand that stopped before letting go should not fling it.
    if (e.timeStamp - c.lastT > 80) c.omega = 0;
    c.omega = Math.max(-12, Math.min(12, c.omega));
  };

  return (
    <figure className="incubator">
      <div className="incubator__cap" aria-hidden="true"><span className="incubator__emitter" /></div>
      <div
        className="incubator__chamber"
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') c.hovered = true; }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') c.hovered = false; }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <span className="incubator__beam" aria-hidden="true" />
        {failed ? (
          <img className="incubator__still" src="/surfer-still.webp" width="560" height="535" alt="A wireframe surfer on a turntable" />
        ) : (
          <canvas ref={canvasRef} className="incubator__canvas" role="img" aria-label="A wireframe surfer turning on a turntable; drag to spin it" />
        )}
      </div>
    </figure>
  );
}
