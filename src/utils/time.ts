/** Visitor-local "late night" window: 1:00am–4:59am. Used by the boot sequence
   and the nav bar so the machine's caffeine warning is diegetically live. */
export function isLateNight(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 1 && h < 5;
}
