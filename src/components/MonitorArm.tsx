/**
 * The articulated arm that holds the "What I'm up to" monitor: a wall plate at
 * the right edge of the page, a shoulder, an upper arm and a forearm with gas
 * struts, ending at a mount hidden behind the screen. Drawn in a 150 x 200 box
 * that home/cards.css positions so the plate sits on the page edge.
 *
 * Pure decoration, so it is hidden from assistive tech. Colours come from the
 * --arm-* custom properties, which change with the theme.
 */
export default function MonitorArm() {
  return (
    <svg className="monitor-arm" viewBox="0 0 150 200" aria-hidden="true" focusable="false">
      {/* The cable, slack between the screen and the plate. */}
      <path className="monitor-arm__cable" d="M22 132 C 40 190, 110 196, 136 150" />

      {/* Forearm, mount to elbow, with its strut alongside. */}
      <line className="monitor-arm__bar" x1="24" y1="120" x2="70" y2="48" />
      <line className="monitor-arm__shine" x1="24" y1="120" x2="70" y2="48" />
      <line className="monitor-arm__strut" x1="36" y1="126" x2="80" y2="58" />

      {/* Upper arm, elbow to shoulder. */}
      <line className="monitor-arm__bar" x1="70" y1="48" x2="126" y2="96" />
      <line className="monitor-arm__shine" x1="70" y1="48" x2="126" y2="96" />
      <line className="monitor-arm__strut" x1="76" y1="62" x2="122" y2="104" />

      {/* Wall plate with four bolts. */}
      <rect className="monitor-arm__plate" x="128" y="54" width="26" height="88" rx="4" />
      {[66, 130].map((y) => (
        <circle key={y} className="monitor-arm__bolt" cx="141" cy={y} r="2.6" />
      ))}

      {/* Joints: mount, elbow, shoulder. */}
      {[[24, 120], [70, 48], [126, 96]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle className="monitor-arm__joint" cx={cx} cy={cy} r="10" />
          <circle className="monitor-arm__cap" cx={cx} cy={cy} r="3.6" />
        </g>
      ))}
    </svg>
  );
}
