import { useEffect, useRef, useState } from 'react';
import {
  FIGURE_PRIMARY,
  FIGURE_SECONDARY,
  MEDIUM,
  BASE_ALPHA,
  DISP_NORM,
  GLOW_THRESHOLD,
  layoutFigure,
  stepField,
  parseRgbTriple,
  clampFontSize,
  type Particle,
  type RGB,
  type Pointer,
} from './asciiRipple.engine';
import './AsciiRipple.css';

const CREAM: RGB = { r: 253, g: 246, b: 227 };
const CYAN: RGB = { r: 0, g: 229, b: 255 };

// Animate only with a real hovering cursor and no reduced-motion preference.
function queryInteractive(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

export default function AsciiRipple() {
  const [interactive, setInteractive] = useState(queryInteractive);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-decide if the user's motion preference or pointer capabilities change.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mqs = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(hover: hover) and (pointer: fine)'),
    ];
    const onChange = () => setInteractive(queryInteractive());
    mqs.forEach((mq) => mq.addEventListener('change', onChange));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', onChange));
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement as HTMLElement | null;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    let raf = 0;
    let running = false;
    let onscreen = true;
    let fieldP: Particle[] = [];
    let fieldS: Particle[] = [];
    let fsP = 12;
    let fsS = 10;
    let w = 0;
    let h = 0;

    const pointerClient = { x: -9999, y: -9999, has: false };
    const pointer: Pointer = { x: -9999, y: -9999, active: false };
    const palette = { cream: CREAM, cyan: CYAN };

    const readPalette = () => {
      const cs = getComputedStyle(canvas);
      palette.cream = parseRgbTriple(cs.getPropertyValue('--text-rgb'), CREAM);
      palette.cyan = parseRgbTriple(cs.getPropertyValue('--accent-rgb'), CYAN);
    };

    const build = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const vw = window.innerWidth;
      fsP = clampFontSize(vw, 0.012, 10, 18);
      fsS = clampFontSize(vw, 0.01, 8, 16);
      ctx.font = `${fsP}px 'Space Mono', monospace`;
      const cellP = ctx.measureText('⣿').width || fsP * 0.6;
      ctx.font = `${fsS}px 'Space Mono', monospace`;
      const cellS = ctx.measureText('⣿').width || fsS * 0.6;

      fieldP = layoutFigure(FIGURE_PRIMARY, {
        fontSize: fsP, cellW: cellP, anchorX: 0.55 * w, topY: 0.15 * h, anchor: 'center',
      });
      fieldS = layoutFigure(FIGURE_SECONDARY, {
        fontSize: fsS, cellW: cellS, anchorX: 0.95 * w, topY: 0, anchor: 'right',
      });
    };

    const drawField = (field: Particle[], fontSize: number, t: number) => {
      ctx.font = `${fontSize}px 'Space Mono', monospace`;
      for (const g of field) {
        const disp = Math.hypot(g.x - g.hx, g.y - g.hy);
        const k = Math.min(disp / DISP_NORM, 1);
        const breathing = 0.86 + 0.14 * Math.sin(t * 0.0015 + g.phase);
        const alpha = Math.min((BASE_ALPHA + k * 0.5) * breathing, 0.95);
        const col = k > 0.04 ? palette.cyan : palette.cream;
        if (k > GLOW_THRESHOLD) {
          ctx.shadowColor = `rgba(${palette.cyan.r},${palette.cyan.g},${palette.cyan.b},${k * 0.6})`;
          ctx.shadowBlur = 12 * k;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`;
        ctx.fillText(g.ch, g.x, g.y);
      }
      ctx.shadowBlur = 0;
    };

    const frame = (t: number) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      if (pointerClient.has) {
        pointer.x = pointerClient.x - rect.left;
        pointer.y = pointerClient.y - rect.top;
        pointer.active =
          pointer.x >= -40 && pointer.y >= -40 && pointer.x <= w + 40 && pointer.y <= h + 40;
      } else {
        pointer.active = false;
      }
      ctx.clearRect(0, 0, w, h);
      stepField(fieldP, pointer, MEDIUM);
      stepField(fieldS, pointer, MEDIUM);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawField(fieldP, fsP, t);
      drawField(fieldS, fsS, t);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !onscreen || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerClient.x = e.clientX;
      pointerClient.y = e.clientY;
      pointerClient.has = true;
    };
    const onPointerLeave = () => { pointerClient.has = false; };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(build, 150);
    };

    const io = new IntersectionObserver(
      (entries) => {
        onscreen = entries[0]?.isIntersecting ?? true;
        if (onscreen) start(); else stop();
      },
      { threshold: 0 },
    );
    const themeObs = new MutationObserver(readPalette);

    readPalette();
    build();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    io.observe(parent);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Fonts load async; remeasure once they're ready so cell widths line up.
    document.fonts?.ready.then(build).catch(() => {});
    start();

    return () => {
      stop();
      window.clearTimeout(resizeT);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
      themeObs.disconnect();
    };
  }, [interactive]);

  if (!interactive) {
    return (
      <>
        <div className="ascii-art-bg" aria-hidden="true">{FIGURE_PRIMARY}</div>
        <div className="ascii-art-secondary" aria-hidden="true">{FIGURE_SECONDARY}</div>
      </>
    );
  }
  return <canvas ref={canvasRef} className="ascii-ripple" aria-hidden="true" />;
}
