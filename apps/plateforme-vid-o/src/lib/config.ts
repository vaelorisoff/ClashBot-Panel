// Platform-wide settings. Change the site name here and it updates everywhere,
// including the standardized video information block.
export const SITE_NAME = 'Nexia';
export const PARTNER_NAME = 'Astreyon Records';
export const PARTNER_URL = 'https://3gd3p3cvfm.zite.so/';

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')} k`;
  return String(n);
}

export function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  if (!d) return '';
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  const units: [number, string][] = [[31536000, 'an'], [2592000, 'mois'], [604800, 'sem.'], [86400, 'j'], [3600, 'h'], [60, 'min']];
  for (const [sec, label] of units) {
    if (s >= sec) {
      const v = Math.floor(s / sec);
      return `il y a ${v} ${label}${label === 'an' && v > 1 ? 's' : ''}`;
    }
  }
  return "à l'instant";
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function errorMessage(e: unknown) {
  const err = e as { userFacingMessage?: string; message?: string };
  return err?.userFacingMessage || err?.message || 'Une erreur est survenue.';
}
