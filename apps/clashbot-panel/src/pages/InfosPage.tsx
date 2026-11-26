import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Pagination } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { Composer } from '../modules/editor/Composer';
import { StatusBadge, preview } from '../modules/editor/PublishedHistory';
import { fmtDate } from '../utils/format';

function Compose() {
  const channels = useApi(services.announcements.channels, []);
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');
  const chosen = channels.data?.find((c) => `${c.guildId}:${c.channelId}` === target);
  return (
    <DataState state={channels} isEmpty={(d) => !d.length}
      empty={<EmptyState icon={<Megaphone className="h-5 w-5" />} title="Aucun salon #clashbot-infos" text="Le backend n'a renvoyé aucun salon #clashbot-infos accessible au bot." />}>
      {(list) => (
        <div className="space-y-4">
          <div className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Salon de publication</Label>
              <Select value={target || undefined} onValueChange={setTarget}>
                <SelectTrigger><SelectValue placeholder="Choisir un salon #clashbot-infos" /></SelectTrigger>
                <SelectContent>{list.map((c) => <SelectItem key={`${c.guildId}:${c.channelId}`} value={`${c.guildId}:${c.channelId}`}>{c.guildName} · #{c.channelName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Titre interne de l'annonce</Label><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Pour l'historique du panel" /></div>
          </div>
          {chosen ? (
            <Composer key={target} guildId={chosen.guildId} submitLabel="Publier l'annonce"
              submit={(_, message) => {
                if (!title.trim()) throw new Error('Indiquez un titre interne pour l\'annonce.');
                return services.announcements.publish({ guildId: chosen.guildId, channelId: chosen.channelId, message, title: title.trim() });
              }} />
          ) : <EmptyState title="Choisissez le salon" text="Sélectionnez un salon #clashbot-infos pour composer l'annonce." />}
        </div>
      )}
    </DataState>
  );
}

function History() {
  const [page, setPage] = useState(1);
  const { timezone } = useApp();
  const state = useApi(() => services.announcements.list({ page, pageSize: 20 }), [page]);
  return (
    <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucune annonce publiée" />}>
      {(d) => (
        <>
          <ul className="divide-y rounded-2xl border bg-card">
            {d.items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title || preview(a.message)}</p>
                  <p className="text-xs text-muted-foreground">#{a.channelName ?? a.channelId} · {fmtDate(a.sentAt, timezone)}{a.author ? ` · par ${a.author}` : ''}{a.error && <span className="text-destructive"> · {a.error}</span>}</p>
                </div>
                <StatusBadge s={a.status} />
              </li>
            ))}
          </ul>
          <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
        </>
      )}
    </DataState>
  );
}

export default function InfosPage() {
  return (
    <>
      <PageHeader eyebrow="ClashBot" title="#clashbot-infos" description="Annonces officielles composées avec l'éditeur commun et publiées réellement par ClashBot (profil d'expéditeur via webhook si nécessaire)." />
      <Tabs defaultValue="compose">
        <TabsList><TabsTrigger value="compose">Nouvelle annonce</TabsTrigger><TabsTrigger value="history">Historique</TabsTrigger></TabsList>
        <TabsContent value="compose" className="mt-4"><Compose /></TabsContent>
        <TabsContent value="history" className="mt-4"><History /></TabsContent>
      </Tabs>
    </>
  );
}
