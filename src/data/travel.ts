/**
 * Everywhere on the Travel page, in one place.
 *
 * Three kinds of place, kept apart because they mean different things:
 *   - stations: stops on the Transmundane Subway Journey, in the order they
 *     were reached. `code` is the station number (TM-01, TM-02 …) and never
 *     changes once given, even if a stop is later moved or removed.
 *   - homes:    places lived in, with the stretches lived there.
 *   - visits:   everywhere else — before the TSJ, beside it, and after it.
 *
 * Toronto is the line's terminus, not a station: every journey leaves from it
 * and the line closes back on it. It appears here once, as a home.
 *
 * Coordinates are city centres, rounded, and never the spot a photograph was
 * taken. Dates are display strings, written the way they should read.
 *
 * Adding a stop: append to `stations` with the next code, and drop the scanned
 * print at public/travel/tm-NN.jpg (resized like the other site images). A
 * station with no `print` shows a pending frame until there is one.
 */

export type Place = {
  /** Stable key, kebab-case. */
  id: string;
  city: string;
  /** Province, state or region, where it helps tell places apart. */
  region?: string;
  country: string;
  lat: number;
  lng: number;
};

export type Visit = Place & {
  /** When, newest first. Free text: "Jul–Aug 2019", "too many times to date". */
  when: string[];
};

export type Home = Place & {
  /** Stretches lived there, oldest first. "present" for an open one. */
  lived: string[];
};

export type Station = Place & {
  /** Station number, 1-based. Rendered TM-01. */
  code: number;
  /** Month the stop was reached, e.g. "Oct 2026". */
  date: string;
  /** Path under public/ to the scanned print; omitted until it exists. */
  print?: string;
  printAlt?: string;
  /** Reserves the scan's space before its lazy image loads. */
  printSize?: { width: number; height: number };
  /** Rough notes written before the trip. */
  before?: string[];
  /** Rough notes written after it. */
  after?: {
    summary: string;
    days: { day: string; summary: string; notes: string[] }[];
  };
};

export const stationCode = (s: Pick<Station, 'code'>) => `TM-${String(s.code).padStart(2, '0')}`;

/** Where every journey starts and ends. */
export const TERMINUS_ID = 'toronto';

export const stations: Station[] = [
  {
    id: 'london-uk', code: 1, city: 'London', region: 'England', country: 'United Kingdom', lat: 51.51, lng: -0.13, date: 'Oct 2026',
    print: '/travel/tm-01.jpg',
    printSize: { width: 1200, height: 1888 },
    printAlt: 'Scanned travel card with a photo by Dad at Covent Garden, London, on 9 October 2026. Handwritten caption: First time Europe; with parents.',
    // Reconstructed from memory; replace if the original pre-trip note turns up.
    before: [
      'Not in a great mood.',
      'Failed the G test due to a stupid mistake.',
      'Going through a slump in general.',
      'Sick the last two weeks.',
      'Imposter syndrome; feel like I should be doing more.',
    ],
    after: {
      summary: 'Was able to do pretty much everything I wanted.',
      days: [
        {
          day: 'Friday',
          summary: 'Exploring modern London, reminiscent of proper downtown Toronto.',
          notes: [
            'Trafalgar Square, Covent Garden, etc.',
            'Tired, fatigued, tired.',
          ],
        },
        {
          day: 'Saturday',
          summary: 'All the super tourist destinations and Madame Tussaud’s (for my Mom) wax museum, which was cool.',
          notes: [
            'London Eye was kinda cool to be honest.',
            'Westminster station was insanely busy.',
            'Tesco Express was a lifesaver for White Monster, but can’t believe you have to be 16+ to buy.',
          ],
        },
        {
          day: 'Sunday',
          summary: 'We went to the Cotswolds villages (specifically Bibury), and that night I went to Liverpool.',
          notes: [
            'Felt bad for the villagers, but realized I was a tourist too.',
            'Liverpool station was busy, a lot of Eagles fans.',
            'Went to Old Blue Last, went way too early.',
            'Was awkward, stood near the bar, drinking some beer, leaning against the counter like a loser.',
            'Music (Saint Julian / Black Mask) was interesting and cool; I want to see things like that again.',
          ],
        },
        {
          day: 'Monday',
          summary: 'We checked out Windsor.',
          notes: [
            'There’s John Deere tractors even in Windsor.',
            'On the Virgin Atlantic flight back, they handed out some landing candy and made me put one back when I took two; pissed me off.',
          ],
        },
      ],
    },
  },
];

export const homes: Home[] = [
  { id: 'columbus', city: 'Columbus', region: 'Ohio', country: 'United States', lat: 39.96, lng: -83.0, lived: ['May 2007 – Feb 2011'] },
  { id: 'kitchener', city: 'Kitchener', region: 'Ontario', country: 'Canada', lat: 43.45, lng: -80.49, lived: ['Apr 2011 – Aug 2014'] },
  { id: 'oakville', city: 'Oakville', region: 'Ontario', country: 'Canada', lat: 43.47, lng: -79.69, lived: ['Sep 2014 – Jun 2025'] },
  { id: 'ajax', city: 'Ajax', region: 'Ontario', country: 'Canada', lat: 43.85, lng: -79.02, lived: ['Jul – Aug 2025', 'May – Aug 2026'] },
  { id: 'toronto', city: 'Toronto', region: 'Ontario', country: 'Canada', lat: 43.65, lng: -79.38, lived: ['Sep 2025 – Apr 2026', 'Sep 2026 – present'] },
];

// Returns belong in the chronology, while the map still gets one dot per home.
// Reference the display dates above rather than parsing them to guess the order.
export const homeTimeline = [
  { id: 'columbus', stay: 0 },
  { id: 'kitchener', stay: 0 },
  { id: 'oakville', stay: 0 },
  { id: 'ajax', stay: 0 },
  { id: 'toronto', stay: 0 },
  { id: 'ajax', stay: 1 },
  { id: 'toronto', stay: 1 },
].map(({ id, stay }) => {
  const home = homes.find((h) => h.id === id);
  const when = home?.lived[stay];
  if (!home || !when) throw new Error(`Missing home timeline stay: ${id} (${stay})`);
  return { home, when };
});

// The India summers: Guraja most years, the cities on the way most of those.
const INDIA_SUMMERS = ['Jul–Aug 2019', 'Jul–Aug 2017', 'Jul–Aug 2014', 'a few times before that'];
const GTA = ['too many times to date'];

export const visits: Visit[] = [
  // India
  // Guraja is a village in Mudinepalle mandal, Krishna district; the dot sits at the mandal.
  { id: 'guraja', city: 'Guraja', region: 'Andhra Pradesh', country: 'India', lat: 16.42, lng: 81.12, when: ['Jul–Aug 2025', ...INDIA_SUMMERS] },
  { id: 'vijayawada', city: 'Vijayawada', region: 'Andhra Pradesh', country: 'India', lat: 16.51, lng: 80.65, when: INDIA_SUMMERS },
  { id: 'hyderabad', city: 'Hyderabad', region: 'Telangana', country: 'India', lat: 17.39, lng: 78.49, when: INDIA_SUMMERS },
  { id: 'bengaluru', city: 'Bengaluru', region: 'Karnataka', country: 'India', lat: 12.97, lng: 77.59, when: INDIA_SUMMERS },

  // Canada
  { id: 'montreal', city: 'Montréal', region: 'Québec', country: 'Canada', lat: 45.5, lng: -73.57, when: ['Jul 2025', 'Sep 2022'] },
  { id: 'quebec-city', city: 'Québec City', region: 'Québec', country: 'Canada', lat: 46.81, lng: -71.21, when: ['Sep 2022'] },
  { id: 'ottawa', city: 'Ottawa', region: 'Ontario', country: 'Canada', lat: 45.42, lng: -75.7, when: ['Sep 2022'] },
  { id: 'kingston', city: 'Kingston', region: 'Ontario', country: 'Canada', lat: 44.23, lng: -76.49, when: ['visits through 2021–2025', 'Sep 2021'] },
  { id: 'london-on', city: 'London', region: 'Ontario', country: 'Canada', lat: 42.98, lng: -81.25, when: ['Sep 2026', 'Jan 2026'] },
  { id: 'waterloo', city: 'Waterloo', region: 'Ontario', country: 'Canada', lat: 43.46, lng: -80.52, when: GTA },
  { id: 'hamilton', city: 'Hamilton', region: 'Ontario', country: 'Canada', lat: 43.26, lng: -79.87, when: GTA },
  { id: 'burlington', city: 'Burlington', region: 'Ontario', country: 'Canada', lat: 43.33, lng: -79.8, when: GTA },
  { id: 'milton', city: 'Milton', region: 'Ontario', country: 'Canada', lat: 43.52, lng: -79.88, when: GTA },
  { id: 'mississauga', city: 'Mississauga', region: 'Ontario', country: 'Canada', lat: 43.59, lng: -79.64, when: GTA },
  { id: 'vaughan', city: 'Vaughan', region: 'Ontario', country: 'Canada', lat: 43.86, lng: -79.51, when: GTA },
  { id: 'pickering', city: 'Pickering', region: 'Ontario', country: 'Canada', lat: 43.84, lng: -79.09, when: GTA },
  { id: 'whitby', city: 'Whitby', region: 'Ontario', country: 'Canada', lat: 43.9, lng: -78.94, when: GTA },
  { id: 'oshawa', city: 'Oshawa', region: 'Ontario', country: 'Canada', lat: 43.9, lng: -78.87, when: GTA },

  // United States
  { id: 'buffalo', city: 'Buffalo', region: 'New York', country: 'United States', lat: 42.89, lng: -78.88, when: ['most recently Mar 2025'] },
  { id: 'new-york', city: 'New York City', region: 'New York', country: 'United States', lat: 40.71, lng: -74.01, when: ['Aug 2016'] },
  { id: 'philadelphia', city: 'Philadelphia', region: 'Pennsylvania', country: 'United States', lat: 39.95, lng: -75.17, when: ['Aug 2016'] },
  { id: 'boston', city: 'Boston', region: 'Massachusetts', country: 'United States', lat: 42.36, lng: -71.06, when: ['Oct 2022', 'Mar 2019'] },
  { id: 'cambridge', city: 'Cambridge', region: 'Massachusetts', country: 'United States', lat: 42.37, lng: -71.11, when: ['Mar 2019'] },
  { id: 'cleveland', city: 'Cleveland', region: 'Ohio', country: 'United States', lat: 41.5, lng: -81.69, when: ['Jul 2026'] },
  { id: 'chicago', city: 'Chicago', region: 'Illinois', country: 'United States', lat: 41.88, lng: -87.63, when: ['Apr 2026', 'Apr 2022'] },
  { id: 'naperville', city: 'Naperville', region: 'Illinois', country: 'United States', lat: 41.75, lng: -88.15, when: ['Apr 2026', 'Apr 2022'] },
  { id: 'orlando', city: 'Orlando', region: 'Florida', country: 'United States', lat: 28.54, lng: -81.38, when: ['Sep 2015'] },
  { id: 'dallas', city: 'Dallas', region: 'Texas', country: 'United States', lat: 32.78, lng: -96.8, when: ['Dec 2022'] },
  { id: 'los-angeles', city: 'Los Angeles', region: 'California', country: 'United States', lat: 34.05, lng: -118.24, when: ['Apr – May 2024'] },
  { id: 'anaheim', city: 'Anaheim', region: 'California', country: 'United States', lat: 33.84, lng: -117.91, when: ['Apr – May 2024'] },
];

/** Preset views, as longitude/latitude boxes; the page fits each to the map. */
export const regions = [
  { id: 'world', label: 'World', box: null },
  { id: 'north-america', label: 'N. America', box: { west: -124, east: -66, south: 24, north: 50 } },
  { id: 'ontario-quebec', label: 'Ont. & Qué.', box: { west: -82.2, east: -70.6, south: 41.9, north: 47.4 } },
  { id: 'gta', label: 'GTA', box: { west: -80.8, east: -78.6, south: 43.1, north: 44.1 } },
  { id: 'india', label: 'India', box: { west: 73.5, east: 84.5, south: 10.5, north: 19.5 } },
  { id: 'europe', label: 'Europe', box: { west: -12, east: 20, south: 40, north: 60 } },
] as const;

export type RegionId = (typeof regions)[number]['id'];
