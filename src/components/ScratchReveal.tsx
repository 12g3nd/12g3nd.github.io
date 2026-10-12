import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

interface ScratchRevealProps {
  /** The address revealed underneath. */
  email: string;
  /** Printed on the foil. */
  label?: string;
}

/** Radius of the coin, in CSS pixels. */
const COIN = 24;
/** Share of the foil that has to be gone before the rest falls away. */
const CLEAR_AT = 0.45;
/** Sample every Nth pixel when measuring how much foil is left. */
const SAMPLE_STEP = 12;

/**
 * The email box as a scratch-and-win ticket.
 *
 * The address sits underneath a canvas of silver foil; dragging across the
 * foil scratches it away with destination-out, and once enough of it is gone
 * the remainder lifts off and the address becomes an ordinary mailto link.
 *
 * Until then the address underneath is aria-hidden and unfocusable, the same
 * as the old [ CLICK TO REVEAL ] button kept it out of view. The foil itself is
 * the control for everyone who can't scratch: it is focusable, labelled, and
 * Enter or Space clears it in one go.
 *
 * touch-action: pan-y, so a thumb dragging up the page still scrolls it — the
 * scratch is the side-to-side motion a real ticket gets anyway.
 */
export default function ScratchReveal({ email, label = '[ SCRATCH TO REVEAL ]' }: ScratchRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratching = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const { width, height } = box.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Silver foil: a cool metallic gradient with fine diagonal grain.
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, '#d9dde3');
    g.addColorStop(0.45, '#aab1bc');
    g.addColorStop(0.55, '#c3c8d0');
    g.addColorStop(1, '#8e96a3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    for (let x = -height; x < width; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.stroke();
    }

    const size = Math.max(24, Math.min(width / 11, 88));
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0a1320';
    ctx.fillText(label, width / 2, height / 2, width - 32);
  }, [label]);

  useEffect(() => {
    if (revealed) return;
    paintFoil();
    // Anton may land after the first paint; repaint once it has so the label
    // is set in the right face. Scratches made before then are rare and cheap
    // to lose.
    document.fonts?.ready.then(paintFoil).catch(() => {});
    const onResize = () => paintFoil();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paintFoil, revealed]);

  const clearedShare = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return 0;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * SAMPLE_STEP) {
      total++;
      if (data[i] === 0) clear++;
    }
    return total ? clear / total : 0;
  };

  const scratchTo = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // destination-out erases by the stroke's alpha, so it has to be opaque —
    // paintFoil leaves strokeStyle at the grain's 18%.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = COIN * 2;
    ctx.beginPath();
    const from = last.current ?? { x, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    last.current = { x, y };

    // Measuring the foil reads every pixel back, so only do it every few moves.
    if (++strokes.current % 6 === 0 && clearedShare() >= CLEAR_AT) setRevealed(true);
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    scratching.current = true;
    last.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    scratchTo(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (scratching.current) scratchTo(e);
  };

  const onPointerUp = () => {
    scratching.current = false;
    last.current = null;
    if (clearedShare() >= CLEAR_AT) setRevealed(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setRevealed(true);
    }
  };

  return (
    <div ref={boxRef} className={`email-box scratch-box${revealed ? ' scratch-box--revealed' : ''}`}>
      <a
        href={`mailto:${email}`}
        className="email-text scratch-box__email"
        aria-hidden={!revealed}
        tabIndex={revealed ? undefined : -1}
      >
        {email}
      </a>
      <canvas
        ref={canvasRef}
        className="scratch-box__foil"
        role="button"
        tabIndex={revealed ? -1 : 0}
        aria-label="Scratch to reveal email address. Press Enter to reveal it at once."
        aria-hidden={revealed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
