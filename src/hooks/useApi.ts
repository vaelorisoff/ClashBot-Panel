import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, errorText } from '../services/http';

/** Charge une ressource du backend avec états chargement / erreur / données. Rien n'est simulé. */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[], opts: { enabled?: boolean; pollMs?: number } = {}) {
  const enabled = opts.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(enabled);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const reload = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const d = await fnRef.current();
      if (id === seq.current) { setData(d); setError(null); }
    } catch (e) {
      if (id === seq.current) { setError(e as Error); if (!silent) setData(null); }
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    reload();
    const onChange = () => reload();
    window.addEventListener('clashbot:api-changed', onChange);
    const t = opts.pollMs ? window.setInterval(() => reload(true), opts.pollMs) : undefined;
    return () => { window.removeEventListener('clashbot:api-changed', onChange); if (t) window.clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, setData, error, loading, reload };
}

/** Exécute une action d'écriture. Le succès n'est affiché que si le backend l'a confirmé. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const run = useCallback(async <R,>(fn: () => Promise<R>, success?: string): Promise<R | undefined> => {
    setPending(true);
    try {
      const r = await fn();
      if (success) toast.success(success);
      return r;
    } catch (e) {
      toast.error(errorText(e));
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);
  return { run, pending };
}
