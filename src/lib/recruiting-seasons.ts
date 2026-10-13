/** The recurring July–June recruiting cycle used by the source lesson. */
export const RECRUITING_SEASONS = [
  { name: "Late Summer", months: "July–August", shortMonths: "Jul–Aug" },
  {
    name: "Early Fall",
    months: "September–October",
    shortMonths: "Sep–Oct",
  },
  {
    name: "Late Fall",
    months: "November–December",
    shortMonths: "Nov–Dec",
  },
  { name: "Winter", months: "January–February", shortMonths: "Jan–Feb" },
  { name: "Spring", months: "March–April", shortMonths: "Mar–Apr" },
  { name: "Early Summer", months: "May–June", shortMonths: "May–Jun" },
] as const;

/** Use campus time so visitors abroad see the same recruiting season. */
export function getRecruitingDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Resolve a season and academic-year label from a campus-local ISO date. */
export function getRecruitingPeriod(day: string) {
  const [year, month] = day.split("-").map(Number);
  const startYear = month < 7 ? year - 1 : year;
  return {
    index: Math.floor(((month + 5) % 12) / 2),
    cycle: `July ${startYear} – June ${startYear + 1}`,
    dateLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${day}T12:00:00Z`)),
  };
}
