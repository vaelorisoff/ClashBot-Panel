export const fmtNumber = (n: number | null | undefined) => (n == null ? '—' : new Intl.NumberFormat('fr-FR').format(n));
export const fmtCompact = (n: number | null | undefined) => (n == null ? '—' : new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(n));
export const fmtPercent = (n: number | null | undefined) => (n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(n));

export function fmtDate(iso: string | null | undefined, timeZone?: string, withTime = true) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { timeZone, day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(d);
}

export function fmtDuration(sec: number | null | undefined) {
  if (sec == null) return '—';
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return [d && `${d} j`, h && `${h} h`, `${m} min`].filter(Boolean).join(' ');
}

export function delta(cur: number, prev: number | null | undefined) {
  if (!prev) return null;
  return (cur - prev) / prev;
}

export const colorToHex = (c: number | null | undefined) => (c == null ? '' : `#${c.toString(16).padStart(6, '0')}`);
export const hexToColor = (h: string) => (/^#?[0-9a-f]{6}$/i.test(h) ? parseInt(h.replace('#', ''), 16) : null);
