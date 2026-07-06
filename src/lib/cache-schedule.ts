// Compute cache expiry timestamps aligned to "Monday 06:00 UK time".
// Used so every content section refreshes once per week on Monday mornings.

function londonParts(date: Date): { weekday: number; hour: number } {
  // Intl gives us the wall-clock time in Europe/London regardless of server TZ.
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    weekday: weekdayMap[weekdayStr] ?? 1,
    hour: parseInt(hourStr, 10) || 0,
  };
}

/**
 * Timestamp (ms) of the next Monday 06:00 UK time from `from`.
 * If `from` is already Monday before 06:00 UK, returns today at 06:00 UK.
 */
export function nextMondaySixAmUK(from: Date = new Date()): number {
  const { weekday, hour } = londonParts(from);
  let daysUntilMonday = (8 - weekday) % 7; // days to next Monday (0 if today)
  if (daysUntilMonday === 0 && hour >= 6) daysUntilMonday = 7;
  const target = daysUntilMonday * 86_400_000 + (6 - hour) * 3_600_000;
  // Snap to the hour boundary in London: subtract current minutes/seconds/ms.
  const minutesMs =
    from.getUTCMinutes() * 60_000 +
    from.getUTCSeconds() * 1_000 +
    from.getUTCMilliseconds();
  return from.getTime() + target - minutesMs;
}

/** Cache expiry aligned to next Monday 06:00 UK, capped at 7 days. */
export function weeklyExpiresAt(): number {
  const now = Date.now();
  const monday = nextMondaySixAmUK(new Date(now));
  const cap = now + 7 * 86_400_000;
  return Math.min(monday, cap);
}