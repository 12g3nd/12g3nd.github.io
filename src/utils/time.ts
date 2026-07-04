/** Visitor-local "late night" window: 1:00am–4:59am. Used by the boot sequence
   and the nav bar so the machine's caffeine warning is diegetically live. */
export function isLateNight(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 1 && h < 5;
}

/** 2007-05-02. Single source of truth so no hardcoded "19" goes stale. */
const BIRTH_YEAR = 2007;
const BIRTH_MONTH = 4; // May (0-indexed)
const BIRTH_DAY = 2;

/** Current age in whole years, computed from the birth date above. */
export function age(d = new Date()): number {
  const beforeBirthday =
    d.getMonth() < BIRTH_MONTH ||
    (d.getMonth() === BIRTH_MONTH && d.getDate() < BIRTH_DAY);
  return d.getFullYear() - BIRTH_YEAR - (beforeBirthday ? 1 : 0);
}
