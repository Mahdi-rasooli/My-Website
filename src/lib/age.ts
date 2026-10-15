/** Whole years between an ISO birth date (YYYY-MM-DD) and `now`. */
export function getAge(birthISO: string, now: Date = new Date()): number {
  const [year, month, day] = birthISO.split("-").map(Number);
  const m = now.getMonth() + 1;
  const beforeBirthday = m < month || (m === month && now.getDate() < day);
  return now.getFullYear() - year - (beforeBirthday ? 1 : 0);
}
