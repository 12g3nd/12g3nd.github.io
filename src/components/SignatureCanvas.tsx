import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { StrokePoint } from '../types/guestbook';

// Paper-ink palette borrowed from the Poetry doc-pages — the signature is always
// drawn on a cream surface, so these read as pen-on-paper.
const INK = '#2a2418';
const PAPER = '#f5ecd6';
const LINE_WIDTH = 2;
const MS_PER_POINT = 8; // replay speed

interface SignatureCanvasProps {
  mode: 'draw' | 'replay';
  /** Replay mode only: the strokes to animate. */
  strokes?: StrokePoint[][];
  /** Draw mode only: fires with a fresh copy of all strokes after each one. */
  onChange?: (strokes: StrokePoint[][]) => void;
  width?: number;
  height?: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export default function SignatureCanvas({
  mode,
  strokes,
  onChange,
  width = 280,
  height = 100,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  // Draw-mode state lives in refs (drawing is high-frequency; no re-renders).
  const strokesRef = useRef<StrokePoint[][]>([]);
  const currentRef = useRef<StrokePoint[]>([]);
  const drawingRef = useRef(false);
  const rafRef = useRef(0);

  const isReplayEmpty = mode === 'replay' && (!strokes || strokes.length === 0);

  // (Re)configure the backing store at device resolution and return its context.
  const setupCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(dpr, dpr); // draw in CSS-pixel coordinates
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    return ctx;
  }, [width, height]);

  // Draw one stroke (or the leading `take` points of it) in normalized space.
  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: StrokePoint[], take = stroke.length) => {
      const n = Math.min(take, stroke.length);
      if (n <= 0) return;
      if (n === 1) {
        // A lone tap reads as a dot rather than a zero-length line.
        const p = stroke[0];
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, LINE_WIDTH / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * width, stroke[0].y * height);
      for (let i = 1; i < n; i++) {
        ctx.lineTo(stroke[i].x * width, stroke[i].y * height);
      }
      ctx.stroke();
    },
    [width, height]
  );

  // ── DRAW MODE ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'draw') return;
    const ctx = setupCtx();
    ctxRef.current = ctx;
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      strokesRef.current.forEach((s) => drawStroke(ctx, s));
    }
  }, [mode, setupCtx, drawStroke, width, height]);

  const getPoint = (e: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentRef.current = [getPoint(e)];
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw' || !drawingRef.current) return;
    e.preventDefault();
    const cur = currentRef.current;
    const prev = cur[cur.length - 1];
    const next = getPoint(e);
    cur.push(next);
    const ctx = ctxRef.current;
    if (ctx && prev) {
      ctx.beginPath();
      ctx.moveTo(prev.x * width, prev.y * height);
      ctx.lineTo(next.x * width, next.y * height);
      ctx.stroke();
    }
  };

  const finishStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw' || !drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false;
    const cur = currentRef.current;
    if (cur.length === 0) return;
    if (cur.length === 1 && ctxRef.current) drawStroke(ctxRef.current, cur);
    strokesRef.current = [...strokesRef.current, cur];
    currentRef.current = [];
    // Hand the parent a deep copy so it owns an immutable snapshot.
    onChange?.(strokesRef.current.map((s) => s.map((p) => ({ ...p }))));
  };

  const clear = () => {
    strokesRef.current = [];
    currentRef.current = [];
    drawingRef.current = false;
    const ctx = ctxRef.current;
    if (ctx) ctx.clearRect(0, 0, width, height);
    onChange?.([]);
  };

  // ── REPLAY MODE ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'replay') return;
    const canvas = canvasRef.current;
    const all = strokes ?? [];
    if (!canvas || all.length === 0) return;

    const total = all.reduce((sum, s) => sum + s.length, 0);
    if (total === 0) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Render the first `shown` points across the flattened sequence, respecting
    // stroke boundaries (so the pen "lifts" between strokes).
    const renderUpTo = (ctx: CanvasRenderingContext2D, shown: number) => {
      ctx.clearRect(0, 0, width, height);
      let remaining = shown;
      for (const stroke of all) {
        if (remaining <= 0) break;
        drawStroke(ctx, stroke, remaining);
        remaining -= stroke.length;
      }
    };

    const run = () => {
      const ctx = setupCtx();
      if (!ctx) return;
      if (reduce) {
        renderUpTo(ctx, total); // hold the final state, no animation
        return;
      }
      const start = performance.now();
      const frame = () => {
        const shown = Math.min(total, Math.floor((performance.now() - start) / MS_PER_POINT) + 1);
        renderUpTo(ctx, shown);
        if (shown < total) rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    };

    // Defer the replay until the signature scrolls into view (then once only).
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [mode, strokes, setupCtx, drawStroke, width, height]);

  if (isReplayEmpty) {
    return (
      <div
        className="sig-canvas sig-canvas--empty"
        style={{ width, height }}
        aria-label="No signature"
      >
        — no signature —
      </div>
    );
  }

  return (
    <div className="sig-canvas-wrap">
      <canvas
        ref={canvasRef}
        className={`sig-canvas sig-canvas--${mode}`}
        style={{ width, height, background: PAPER }}
        aria-label={mode === 'draw' ? 'Signature drawing area' : 'Visitor signature'}
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onPointerLeave={finishStroke}
      />
      {mode === 'draw' && (
        <button type="button" className="sig-canvas__clear" onClick={clear}>
          [ CLEAR ]
        </button>
      )}
    </div>
  );
}
