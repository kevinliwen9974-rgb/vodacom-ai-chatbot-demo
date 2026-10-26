/** Vodacom online agent desk — Africa/Johannesburg, no DST. */

export const AGENT_TZ = "Africa/Johannesburg";

export const AGENT_HOURS_LINES = [
  "Monday–Friday: 8am–5pm",
  "Saturdays: 8am–1pm",
  "Sundays & public holidays: Closed",
] as const;

export const AGENT_OFFLINE_HINT =
  "Sorry — online agents are offline right now. Hours: Mon–Fri 8am–5pm · Sat 8am–1pm · Sundays & public holidays closed.";

/** Official + observed SA public holidays for the 2026 demo year. */
const SA_HOLIDAYS_2026 = new Set([
  "2026-01-01",
  "2026-03-21",
  "2026-04-03",
  "2026-04-06",
  "2026-04-27",
  "2026-05-01",
  "2026-06-16",
  "2026-08-09",
  "2026-08-10",
  "2026-09-24",
  "2026-12-16",
  "2026-12-25",
  "2026-12-26",
]);

export type ClockPreset =
  | "live"
  | "weekday"
  | "saturday_open"
  | "saturday_closed"
  | "sunday"
  | "holiday";

export const CLOCK_PRESETS: Array<{
  id: ClockPreset;
  label: string;
  /** Wall time in SAST; ignored for live */
  isoSast?: string;
}> = [
  { id: "live", label: "Live (SAST now)" },
  { id: "weekday", label: "Fri 10:00 · open", isoSast: "2026-09-04T10:00:00+02:00" },
  { id: "saturday_open", label: "Sat 10:00 · open", isoSast: "2026-09-05T10:00:00+02:00" },
  { id: "saturday_closed", label: "Sat 15:00 · closed", isoSast: "2026-09-05T15:00:00+02:00" },
  { id: "sunday", label: "Sun 10:00 · closed", isoSast: "2026-09-06T10:00:00+02:00" },
  { id: "holiday", label: "25 Dec · closed", isoSast: "2026-12-25T10:00:00+02:00" },
];

function sastParts(at: Date) {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: AGENT_TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    weekday: get("weekday"),
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function clockForPreset(preset: ClockPreset, now = new Date()): Date {
  if (preset === "live") return now;
  const iso = CLOCK_PRESETS.find((p) => p.id === preset)?.isoSast;
  return iso ? new Date(iso) : now;
}

export function isSaPublicHoliday(at: Date): boolean {
  return SA_HOLIDAYS_2026.has(sastParts(at).ymd);
}

/** Online chat desk: Mon–Fri 08:00–17:00, Sat 08:00–13:00, else closed. */
export function isAgentDeskOpen(at: Date): boolean {
  const { weekday, minutes } = sastParts(at);
  if (isSaPublicHoliday(at)) return false;
  if (weekday.startsWith("Sun")) return false;
  if (weekday.startsWith("Sat")) return minutes >= 8 * 60 && minutes < 13 * 60;
  return minutes >= 8 * 60 && minutes < 17 * 60;
}

export function formatSastClock(at: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: AGENT_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}

