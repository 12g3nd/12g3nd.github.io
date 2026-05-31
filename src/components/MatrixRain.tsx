import { useEffect, useRef } from 'react';
import './MatrixRain.css';

/* `matrix` terminal command payload. A short cyan digital-rain pass over the
   whole viewport. Self-contained canvas; the caller controls how long it
   stays mounted. */
export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const fontSize = 16;
    const chars = 'アイウエオカキクケコ0123456789SJ.SYS<>/{}[]'.split('');
    let drops = new Array(Math.ceil(width / fontSize))
      .fill(0)
      .map(() => Math.random() * -50);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      drops = new Array(Math.ceil(width / fontSize))
        .fill(0)
        .map(() => Math.random() * -50);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      if (t - last > 33) {
        last = t;
        ctx.fillStyle = 'rgba(10, 19, 32, 0.18)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#00E5FF';
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
          const ch = chars[(Math.random() * chars.length) | 0];
          ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="matrix-rain" aria-hidden="true" />;
}
