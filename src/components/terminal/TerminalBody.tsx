import type { Terminal } from './useTerminal';

/**
 * The inside of the terminal: an idle typewriter line, or the command line it
 * becomes once someone opens it.
 *
 * Rendered twice from one useTerminal — in the nav's header box on desktop, and
 * in the row beneath it on mobile — because only one of the two is ever visible
 * and both need the same state. It emits no wrapper of its own, so the markup is
 * exactly what Navigation produced when this JSX was inline.
 */
export default function TerminalBody({ t }: { t: Terminal }) {
  if (!t.commandMode) {
    return (
      <>
        <span className="terminal-idle">
          <span className="terminal-text">{t.text}</span>
          <span className="terminal-cursor">_</span>
        </span>
        <span className="terminal-hint" aria-hidden="true">
          {t.nudge ? '▸ dbl-click & type `help`' : '▸ dbl-click'}
        </span>
      </>
    );
  }

  return (
    <div className={`terminal-cmd${t.block ? ' terminal-cmd--multiline' : ''}`}>
      <span className="terminal-prompt">srihith@sj.sys</span>
      <span className="terminal-prompt-sep">:~$</span>
      <input
        className="terminal-input"
        value={t.input}
        onChange={(e) => t.setInput(e.target.value)}
        onKeyDown={t.handleKeyDown}
        onBlur={t.closeCommandMode}
        spellCheck={false}
        autoComplete="off"
        aria-label="Terminal command input"
      />
      {/* Clickable `ls` listing — React nodes, not a string, so each entry
          navigates or runs its command on click. Always block, no expand. */}
      {t.outputNode && (
        <span className="terminal-output terminal-output--block">{t.outputNode}</span>
      )}
      {/* Collapsed: output first, then expand button */}
      {!t.outputNode && t.output && !t.expanded && !t.multiline && (
        <>
          <span className="terminal-output">{t.output}</span>
          <button
            type="button"
            className="terminal-expand-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => t.setExpanded(true)}
            aria-label="Expand output"
          >
            ▸ Expand
          </button>
        </>
      )}
      {/* Expanded: collapse button first (stays on row 1 with prompt+input), then output block */}
      {!t.outputNode && t.output && t.expanded && !t.multiline && (
        <>
          <button
            type="button"
            className="terminal-expand-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => t.setExpanded(false)}
            aria-label="Collapse output"
          >
            ▸ Collapse
          </button>
          <span className="terminal-output terminal-output--block">{t.output}</span>
        </>
      )}
      {/* Multiline output: always block, no expand button */}
      {!t.outputNode && t.output && t.multiline && (
        <span className="terminal-output terminal-output--block">{t.output}</span>
      )}
    </div>
  );
}
