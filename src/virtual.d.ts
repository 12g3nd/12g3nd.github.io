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
