/* Modules that exist only at build time. See scripts/letterboxdPlugin.ts. */

declare module 'virtual:letterboxd' {
  export type Film = {
    title: string;
    year: string;
    rating: number;
    stars: string;
    link: string;
    poster: string | null;
    liked: boolean;
  };

  export const films: Film[];
}

declare module 'virtual:build-info' {
  /** See scripts/buildInfoPlugin.ts. */
  export const buildInfo: {
    /** YYYY-MM-DD of the last commit (or of the build, when git is absent). */
    date: string;
    /** Short commit sha, or '' when unknown. */
    sha: string;
    /** False when `date` is the build date standing in for a commit date. */
    exact: boolean;
  };
}
