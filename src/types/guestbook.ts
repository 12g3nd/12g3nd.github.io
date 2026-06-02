/** A single normalized point of a drawn signature (0–1 in both axes). */
export type StrokePoint = { x: number; y: number };

/** One approved guestbook entry, as returned by the Worker's GET /entries. */
export type GuestbookEntry = {
  id: number;
  first_name: string;
  last_name: string;
  description: string;
  /** Array of strokes; each stroke is an ordered array of {x, y} points. */
  stroke_data: StrokePoint[][];
  created_at: string;
};
