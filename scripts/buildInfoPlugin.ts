// `virtual:build-info` — when this site was last actually changed.
//
// The footer's "last updated" stamp is a Web 1.0 fixture, and the version of it
// that everyone got wrong was `new Date()`, which says "updated today" every
// day forever and therefore says nothing. This reads the date off the last
// commit instead, so the stamp is a fact about the site rather than a fact
// about when you loaded it.
//
// Read at config time, not per-request: the value is baked into the bundle, so
// a long-running dev server shows the commit it started on. That is fine — the
// number that matters is the one in the deployed build.
//
// CI note: actions/checkout defaults to a depth-1 clone, which still has HEAD,
// which is all `git log -1` needs. If git is unavailable at all (a source
// tarball, a sandbox without the binary) it falls back to the build date and
// says so via `exact: false`, and the footer quietly drops the commit hash
// rather than printing a wrong one.

import type { Plugin } from 'vite';
import { execFileSync } from 'node:child_process';

const VIRTUAL_ID = 'virtual:build-info';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

type BuildInfo = {
  /** YYYY-MM-DD of the last commit, or of the build when git isn't there. */
  date: string;
  /** Short commit sha, or '' when unknown. */
  sha: string;
  /** False when this is the build date standing in for a commit date. */
  exact: boolean;
};

function read(): BuildInfo {
  try {
    const git = (args: string[]) =>
      execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    // %cI is the committer date in strict ISO 8601; the date part is all the
    // stamp shows, and slicing it avoids dragging a timezone into the footer.
    const date = git(['log', '-1', '--format=%cI']).slice(0, 10);
    const sha = git(['log', '-1', '--format=%h']);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`unexpected git date: ${date}`);
    return { date, sha, exact: true };
  } catch {
    return { date: new Date().toISOString().slice(0, 10), sha: '', exact: false };
  }
}

export default function buildInfoPlugin(): Plugin {
  let info: BuildInfo;

  return {
    name: 'sjsys-build-info',

    buildStart() {
      info = read();
      const when = info.exact ? `commit ${info.sha}` : 'build date (no git)';
      console.log(`[build-info] last updated ${info.date} — ${when}`);
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export const buildInfo = ${JSON.stringify(info)};`;
    },
  };
}
