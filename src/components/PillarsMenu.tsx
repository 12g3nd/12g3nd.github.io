import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import './PillarsMenu.css';

/**
 * The hero's PILLARS button: one button that opens the three pillar pages,
 * each tagged with its line colour from the nav.
 *
 * A menu button in the ARIA sense: arrow keys move through the items, Escape
 * closes and hands focus back to the button, and a click anywhere else or
 * tabbing away closes it.
 */

const PILLARS = [
  // Same pairs as the nav (Navigation.tsx): the line, and the ink that reads on it.
  { to: '/business', label: 'Business', line: 'var(--line-business)', onLine: 'var(--on-line-dark)' },
  { to: '/projects', label: 'Projects', line: 'var(--line-projects)', onLine: 'var(--on-line-dark)' },
  { to: '/poetry', label: 'Poetry', line: 'var(--line-poetry)', onLine: 'var(--on-line-light)' },
] as const;

export default function PillarsMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const button = useRef<HTMLButtonElement | null>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const focusItem = (i: number) => {
    const n = PILLARS.length;
    items.current[((i % n) + n) % n]?.focus();
  };

  const openAt = (i: number) => {
    setOpen(true);
    // The items mount with the menu; focus them on the next frame.
    requestAnimationFrame(() => focusItem(i));
  };

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); openAt(0); }
    if (e.key === 'ArrowUp') { e.preventDefault(); openAt(PILLARS.length - 1); }
  };

  const onMenuKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = items.current.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(PILLARS.length - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); button.current?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={`pillars${open ? ' is-open' : ''}`} ref={wrap}>
      <button
        ref={button}
        type="button"
        className="btn-primary pillars__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKey}
      >
        PILLARS <span className="pillars__caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="pillars__menu" id={menuId} role="menu" aria-label="Pillars" onKeyDown={onMenuKey}>
          {PILLARS.map((p, i) => (
            <li key={p.to} role="none" style={{ '--line': p.line, '--on-line': p.onLine, '--i': i } as CSSProperties}>
              <Link
                ref={(el) => { items.current[i] = el; }}
                to={p.to}
                role="menuitem"
                className="pillars__item"
                onClick={() => setOpen(false)}
              >
                <span className="pillars__label">{p.label}</span>
                <span className="pillars__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
