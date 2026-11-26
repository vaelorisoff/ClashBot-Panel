import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@project/components/ui/badge';
import { Button } from '@project/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { services } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import { useApp } from '../../contexts/AppContext';
import { Pagination } from '../../components/common/Layout';
import { DataState, EmptyState } from '../../components/common/States';
import { Confirm } from '../../components/common/Confirm';
import { fmtDate } from '../../utils/format';
import type { PublishedMessage } from '../../types/message';
import { Composer } from './Composer';

const STATUS: Record<PublishedMessage['status'], { label: string; cls: string }> = {
  sent: { label: 'Envoyé', cls: 'bg-success/15 text-success' }, failed: { label: 'Échec', cls: 'bg-destructive/15 text-destructive' },
  deleted: { label: 'Supprimé', cls: 'bg-muted text-muted-foreground' }, scheduled: { label: 'Planifié', cls: 'bg-info/15 text-info' },
};

export function StatusBadge({ s }: { s: PublishedMessage['status'] }) {
  return <Badge variant="outline" className={`border-transparent ${STATUS[s].cls}`}>{STATUS[s].label}</Badge>;
}

export function preview(m: PublishedMessage['message']) {
  return m.content || m.embeds[0]?.title || m.embeds[0]?.description || '(embed sans texte)';
}

/** Historique des messages publiés par ClashBot, avec modification et suppression réelles sur Discord. */
export function PublishedHistory({ guildId, status }: { guildId: string; status?: PublishedMessage['status'] }) {
  const [page, setPage] = useState(1);
  const state = useApi(() => services.messages.history(guildId, { status, page, pageSize: 20 }), [guildId, status, page]);
  const [editing, setEditing] = useState<PublishedMessage | null>(null);
  const { run } = useAction();
  const { timezone } = useApp();
  const remove = (p: PublishedMessage) => run(() => services.messages.deletePublished(guildId, p.id), p.status === 'scheduled' ? 'Envoi planifié annulé.' : 'Message supprimé sur Discord.').then((r) => r && state.reload(true));

  return (
    <>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title={status === 'scheduled' ? 'Aucun envoi planifié' : 'Aucun message publié'} />}>
        {(d) => (
          <>
            <ul className="divide-y rounded-2xl border bg-card">
              {d.items.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{preview(p.message)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{p.channelName ?? p.channelId} · {p.status === 'scheduled' ? `prévu le ${fmtDate(p.scheduledFor, timezone)}` : fmtDate(p.sentAt, timezone)}{p.author ? ` · par ${p.author}` : ''}
                      {p.error && <span className="text-destructive"> · {p.error}</span>}
                    </p>
                  </div>
                  <StatusBadge s={p.status} />
                  {(p.status === 'sent' || p.status === 'scheduled') && (
                    <div className="flex">
                      {p.status === 'sent' && <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Modifier" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>}
                      <Confirm title={p.status === 'scheduled' ? 'Annuler cet envoi planifié ?' : 'Supprimer ce message sur Discord ?'} onConfirm={() => remove(p)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                      </Confirm>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>Modifier le message publié</DialogTitle></DialogHeader>
          {editing && <Composer guildId={guildId} initial={editing.message} editingId={editing.id} onDone={() => { setEditing(null); state.reload(true); }} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
