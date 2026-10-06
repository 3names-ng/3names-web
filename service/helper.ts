// ── Server clock offset ──────────────────────────────────────────────
// Relative timestamps ("2 min ago") compare a server-generated `createdAt`
// against the device clock. Device clocks are frequently off by a couple of
// minutes, so a brand-new post/comment/reply could wrongly show "2 min ago"
// the moment the server response replaces the optimistic item. We learn the
// offset from the `Date` header of API responses (see service/api.ts) and
// correct for it here.
let clockSkewMs = 0; // how far the server clock is ahead of the device clock

/** Parse an RFC 1123 HTTP date (e.g. "Fri, 05 Sep 2026 12:00:00 GMT"). */
function parseHttpDate(value: string): number {
  const native = Date.parse(value);
  if (!Number.isNaN(native)) return native;

  // Fallback for engines (e.g. Hermes) that reject RFC 1123 dates.
  const m = /^(\w{3}), (\d{2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/.exec(
    value
  );
  if (!m) return NaN;

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months.indexOf(m[3]);
  if (month === -1) return NaN;

  return Date.UTC(+m[4], month, +m[2], +m[5], +m[6], +m[7]);
}

/** Feed the `Date` header of an API response to keep the skew estimate fresh. */
export function syncServerClock(headers: any): void {
  try {
    // Works for both axios v1 AxiosHeaders (has .get) and plain objects.
    const dateHeader =
      typeof headers?.get === "function"
        ? headers.get("date")
        : headers?.date;
    if (!dateHeader) return;

    const serverTimeMs = parseHttpDate(String(dateHeader));
    if (!Number.isNaN(serverTimeMs)) {
      clockSkewMs = serverTimeMs - Date.now();
    }
  } catch {
    // Clock syncing must never break the response pipeline.
  }
}

export default function getRelativeTime(dateString: string | Date): string {
  const now = Date.now() + clockSkewMs; // server-adjusted current time
  const past = new Date(dateString).getTime();
  const elapsed = now - past;

  // Handle future dates or residual clock skew
  if (elapsed < 0) {
    return "just now";
  }

  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  if (elapsed < 10 * msPerSecond) {
    return "just now";
  }

  if (elapsed < msPerMinute) {
    const seconds = Math.floor(elapsed / msPerSecond);
    return `${seconds} sec ago`;
  } 
  
  if (elapsed < msPerHour) {
    const minutes = Math.floor(elapsed / msPerMinute);
    return `${minutes} min ago`;
  } 
  
  if (elapsed < msPerDay) {
    const hours = Math.floor(elapsed / msPerHour);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } 
  
  if (elapsed < msPerMonth) {
    const days = Math.floor(elapsed / msPerDay);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } 
  
  if (elapsed < msPerYear) {
    const months = Math.floor(elapsed / msPerMonth);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } 

  const years = Math.floor(elapsed / msPerYear);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export function formatCount(count: number): string {
  if (!count || isNaN(count) || count < 0) return "0";

  if (count < 1000) {
    return count.toString();
  }

  // Thousands (1k to 999.9k)
  if (count < 1000000) {
    const thousands = count / 1000;
    // If it's a clean multiple of 1000 (e.g. 5000), show '5k' instead of '5.0k'
    return thousands % 1 === 0 
      ? `${thousands}k` 
      : `${thousands.toFixed(1)}k`;
  }

  // Millions (1M to 999.9M)
  if (count < 1000000000) {
    const millions = count / 1000000;
    return millions % 1 === 0 
      ? `${millions}M` 
      : `${millions.toFixed(1)}M`;
  }

  // Billions (1B+)
  const billions = count / 1000000000;
  return billions % 1 === 0 
    ? `${billions}B` 
    : `${billions.toFixed(1)}B`;
}