/**
 * Couche HTTP indépendante vers le backend ClashBot.
 *
 * - Aucune donnée n'est simulée : chaque écran lit/écrit exclusivement via ces fonctions.
 * - L'URL du backend vient de VITE_CLASHBOT_API_URL (build Railway) ou des Paramètres (stockée localement).
 * - L'authentification (Discord OAuth) est gérée par le backend : cookie de session (`credentials: 'include'`)
 *   et/ou jeton Bearer facultatif renseigné dans les Paramètres.
 * - Contrat complet : voir API.md à la racine de l'application.
 */

const URL_KEY = 'clashbot.apiUrl';
const TOKEN_KEY = 'clashbot.apiToken';

export function getApiUrl(): string {
  const stored = localStorage.getItem(URL_KEY);
  const env = (import.meta.env.VITE_CLASHBOT_API_URL as string | undefined) ?? '';
  return (stored || env).replace(/\/+$/, '');
}
export function setApiUrl(url: string) {
  if (url.trim()) localStorage.setItem(URL_KEY, url.trim());
  else localStorage.removeItem(URL_KEY);
  window.dispatchEvent(new Event('clashbot:api-changed'));
}
export function getApiToken() { return localStorage.getItem(TOKEN_KEY) ?? ''; }
export function setApiToken(token: string) {
  if (token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
  else localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('clashbot:api-changed'));
}

export type ApiErrorKind = 'not_configured' | 'network' | 'unauthorized' | 'forbidden' | 'not_found' | 'not_implemented' | 'validation' | 'rate_limited' | 'server';

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string, public status?: number, public details?: unknown) {
    super(message);
  }
}

const MESSAGES: Record<ApiErrorKind, string> = {
  not_configured: "Le backend ClashBot n'est pas encore configuré.",
  network: 'Impossible de joindre le backend ClashBot.',
  unauthorized: 'Session expirée ou absente : reconnectez-vous via Discord.',
  forbidden: "Vous n'avez pas la permission d'effectuer cette action.",
  not_found: 'Ressource introuvable.',
  not_implemented: 'Cette fonctionnalité nécessite une route backend qui n\'existe pas encore.',
  validation: 'Les données envoyées sont invalides.',
  rate_limited: 'Trop de requêtes : réessayez dans quelques instants.',
  server: 'Le backend a rencontré une erreur.',
};

function kindFor(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404 || status === 501) return status === 501 ? 'not_implemented' : 'not_found';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  return 'server';
}

export type Query = Record<string, string | number | boolean | undefined | null>;

export async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown } = {}): Promise<T> {
  const base = getApiUrl();
  if (!base) throw new ApiError('not_configured', MESSAGES.not_configured);
  const url = new URL(base + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getApiToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers, credentials: 'include', body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  } catch {
    throw new ApiError('network', MESSAGES.network);
  }
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const kind = kindFor(res.status);
    const msg = (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string')
      ? (data as { message: string }).message : MESSAGES[kind];
    throw new ApiError(kind, msg, res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
};

export function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return e instanceof Error ? e.message : 'Erreur inconnue.';
}

/** Envoi d'un fichier vers le stockage du backend ClashBot (POST /uploads, multipart). Renvoie l'URL publique. */
export async function uploadFile(file: File, purpose: string): Promise<{ url: string }> {
  const base = getApiUrl();
  if (!base) throw new ApiError('not_configured', MESSAGES.not_configured);
  const form = new FormData();
  form.append('file', file);
  form.append('purpose', purpose);
  const headers: Record<string, string> = {};
  const token = getApiToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try { res = await fetch(`${base}/uploads`, { method: 'POST', body: form, headers, credentials: 'include' }); }
  catch { throw new ApiError('network', MESSAGES.network); }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.url) throw new ApiError(res.ok ? 'server' : kindFor(res.status), data?.message ?? MESSAGES[res.ok ? 'server' : kindFor(res.status)], res.status);
  return data as { url: string };
}
