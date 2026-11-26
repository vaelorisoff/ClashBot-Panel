// Horodatages Discord (<t:TIMESTAMP:STYLE>) et calculs de journée civile par fuseau IANA.

export type TimestampStyle = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
export const TIMESTAMP_STYLES: { style: TimestampStyle; label: string }[] = [
  { style: 't', label: 'Heure courte' }, { style: 'T', label: 'Heure longue' },
  { style: 'd', label: 'Date courte' }, { style: 'D', label: 'Date longue' },
  { style: 'f', label: 'Date et heure' }, { style: 'F', label: 'Date complète' },
  { style: 'R', label: 'Temps relatif' },
];

export const toUnix = (d: Date) => Math.floor(d.getTime() / 1000);
export const discordTimestamp = (d: Date, style: TimestampStyle = 'R') => `<t:${toUnix(d)}:${style}>`;

export function relativeFr(date: Date, now = new Date()) {
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(diff, 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), 'month');
  return rtf.format(Math.round(diff / 31536000), 'year');
}

/** Rendu identique au client Discord (fr) d'un horodatage, dans le fuseau donné. */
export function renderTimestamp(unix: number, style: TimestampStyle, timeZone?: string) {
  const d = new Date(unix * 1000);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone, ...o }).format(d);
  switch (style) {
    case 't': return f({ hour: '2-digit', minute: '2-digit' });
    case 'T': return f({ hour: '2-digit', minute: '2-digit', second: '2-digit' });
    case 'd': return f({ day: '2-digit', month: '2-digit', year: 'numeric' });
    case 'D': return f({ day: 'numeric', month: 'long', year: 'numeric' });
    case 'f': return f({ day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'F': return f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'R': return relativeFr(d);
  }
}

/** Date civile (AAAA-MM-JJ) d'un instant dans un fuseau IANA. */
export function localDateKey(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function tzOffsetMs(d: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(d).reduce<Record<string, number>>((a, x) => (x.type === 'literal' ? a : { ...a, [x.type]: Number(x.value) }), {});
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000;
}

/** Prochain minuit local (réinitialisation du journalier selon le jour civil, pas un délai de 24 h). */
export function nextLocalMidnight(timeZone: string, now = new Date()) {
  const [y, m, day] = localDateKey(now, timeZone).split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, day + 1, 0, 0, 0));
  let t = guess.getTime() - tzOffsetMs(guess, timeZone);
  t = guess.getTime() - tzOffsetMs(new Date(t), timeZone); // correction aux changements d'heure
  return new Date(t);
}

/** Le journalier est-il disponible ? Vrai dès que la date locale a changé depuis la dernière récupération. */
export function dailyAvailable(lastClaim: Date | null, timeZone: string, now = new Date()) {
  return !lastClaim || localDateKey(lastClaim, timeZone) !== localDateKey(now, timeZone);
}

export function isValidTimeZone(tz: string) {
  try { new Intl.DateTimeFormat('fr', { timeZone: tz }); return true; } catch { return false; }
}
export const TIME_ZONES: string[] = (() => {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  return intl.supportedValuesOf?.('timeZone') ?? ['Europe/Paris', 'Europe/Zurich', 'Europe/Brussels', 'America/Montreal', 'UTC'];
})();
