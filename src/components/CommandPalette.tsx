import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { applyTheme, getTheme } from '../utils/theme';
import './CommandPalette.css';

type Item = {
  id: string;
  label: string;
  hint: string;      // right-aligned tag, e.g. "route" / "fx"
  keywords?: string; // extra fuzzy-match fodder not shown in the label
  run: () => void;
};

/* Global ⌘K / Ctrl+K command palette. A Raycast-style filterable list that runs
   the same effects as the nav terminal — routes via navigate, theme via the
   shared util, and matrix/party via the site's existing CustomEvent idiom
   (Navigation listens for `sjsys:matrix` / `sjsys:party`, mirroring `sjsys:crt`).
   The deep text easter eggs stay terminal-only: they render output, which isn't
   what an action palette is for. Portaled to <body> to clear app stacking. */
export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  // Rebuilt every render (12 items — no memo needed) so the theme label always
  // reflects the live theme, however it was last flipped.
  const goto = (path: string) => () => {
    navigate(path);
    window.scrollTo(0, 0);
  };
  const theme = getTheme();
  const items: Item[] = [
    { id: 'home', label: 'Home', hint: 'route', keywords: '~ index start', run: goto('/') },
    { id: 'projects', label: 'Projects', hint: 'route', run: goto('/projects') },
    { id: 'business', label: 'Business', hint: 'route', keywords: 'xlsx finance', run: goto('/business') },
    { id: 'media', label: 'Media', hint: 'route', keywords: 'gallery art prints', run: goto('/media') },
    { id: 'poetry', label: 'Poetry', hint: 'route', keywords: 'writing poems', run: goto('/poetry') },
    { id: 'blog', label: 'Blog', hint: 'route', keywords: 'writing posts', run: goto('/blog') },
    { id: 'guestbook', label: 'Guestbook', hint: 'route', keywords: 'sign log visitors', run: goto('/guestbook') },
    {
      id: 'theme',
      label: theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
      hint: 'theme',
      keywords: 'mode color light dark',
      run: () => applyTheme(theme === 'light' ? 'dark' : 'light'),
    },
    {
      id: 'resume',
      label: 'Open résumé',
      hint: 'file',
      keywords: 'cv pdf download hire',
      run: () => {
        try { localStorage.setItem('sjsys_resume_unlocked', '1'); } catch { /* storage may be blocked */ }
        window.open('/resume.pdf', '_blank', 'noopener');
      },
    },
    { id: 'matrix', label: 'Matrix rain', hint: 'fx', keywords: 'green code rabbit', run: () => window.dispatchEvent(new CustomEvent('sjsys:matrix')) },
    { id: 'party', label: 'Party mode', hint: 'fx', keywords: 'rainbow confetti unicorn', run: () => window.dispatchEvent(new CustomEvent('sjsys:party')) },
    {
      id: 'email',
      label: 'Copy email',
      hint: 'action',
      keywords: 'contact mail reach',
      run: () => { void navigator.clipboard?.writeText('srihith.jarabana@mail.utoronto.ca'); },
    },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => `${it.label} ${it.keywords ?? ''} ${it.id}`.toLowerCase().includes(q))
    : items;

  // Global toggle. Fires before the browser's own Ctrl+K (search) via preventDefault.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setSel(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // On open: remember focus and move it to the input. On close: restore focus.
  // (Query/selection are reset in the toggle handler — resetting state inside an
  // effect triggers the cascading-render the react-hooks rule warns about.)
  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      restoreFocus.current?.focus?.();
    }
  }, [open]);

  if (!open) return null;

  const run = (it?: Item) => {
    if (!it) return;
    setOpen(false);
    it.run();
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    const n = filtered.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (n ? (s + 1) % n : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (n ? (s - 1 + n) % n : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(filtered[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const active = Math.min(sel, Math.max(0, filtered.length - 1));

  return createPortal(
    <div
      className="cmdk"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="cmdk__panel">
        <div className="cmdk__chrome">
          <span className="cmdk__chrome-label">SJ.SYS ▸ run</span>
          <span className="cmdk__chrome-esc">esc</span>
        </div>
        <div className="cmdk__inputrow">
          <span className="cmdk__prompt">&gt;</span>
          <input
            ref={inputRef}
            className="cmdk__input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSel(0); }}
            onKeyDown={onInputKey}
            placeholder="run a command or jump to…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Command palette input"
          />
        </div>
        <ul className="cmdk__list" role="listbox">
          {filtered.length === 0 && (
            <li className="cmdk__empty">no matches — try `projects`, `theme`, `resume`</li>
          )}
          {filtered.map((it, i) => (
            <li
              key={it.id}
              role="option"
              aria-selected={i === active}
              className={`cmdk__item${i === active ? ' cmdk__item--active' : ''}`}
              onMouseEnter={() => setSel(i)}
              onMouseDown={(e) => { e.preventDefault(); run(it); }}
            >
              <span className="cmdk__item-label">{it.label}</span>
              <span className="cmdk__item-hint">{it.hint}</span>
            </li>
          ))}
        </ul>
        <div className="cmdk__footer">↑/↓ select · ↵ run · esc close</div>
      </div>
    </div>,
    document.body
  );
}
