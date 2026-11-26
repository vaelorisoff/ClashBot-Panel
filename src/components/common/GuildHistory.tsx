import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { services } from '../../services/clashbot';
import { useApi } from '../../hooks/useApi';
import { useApp } from '../../contexts/AppContext';
import { Pagination } from './Layout';
import { DataState, EmptyState } from './States';
import { fmtDate } from '../../utils/format';

/** Liste en lecture seule d'un historique propre à un serveur (GET /guilds/:id/<path>). */
export function GuildHistory({ guildId, path, title, render }: {
  guildId: string; path: string; title?: string;
  render?: (row: Record<string, unknown>) => { primary: string; secondary?: string; ok?: boolean | null; at?: string | null };
}) {
  const [page, setPage] = useState(1);
  const { timezone } = useApp();
  const state = useApi(() => services.collection.list(guildId, path, { page, pageSize: 25 }), [guildId, path, page]);
  return (
    <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title={title ?? 'Historique vide'} text="Aucun événement réellement enregistré pour le moment." />}>
      {(d) => (
        <>
          <ul className="divide-y rounded-2xl border bg-card">
            {d.items.map((r) => {
              const v = render ? render(r) : { primary: String(r.summary ?? r.id), at: (r.at as string) ?? null, ok: (r.success as boolean) ?? null, secondary: r.error as string | undefined };
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  {v.ok != null && (v.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <XCircle className="h-4 w-4 shrink-0 text-destructive" />)}
                  <div className="min-w-0 flex-1"><p className="truncate">{v.primary}</p>{v.secondary && <p className="truncate text-xs text-muted-foreground">{v.secondary}</p>}</div>
                  {v.at && <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(v.at, timezone)}</span>}
                </li>
              );
            })}
          </ul>
          <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
        </>
      )}
    </DataState>
  );
}
