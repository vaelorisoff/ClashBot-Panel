import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Hash, MessageSquare, Terminal, Users, Volume2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Switch } from '@project/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Skeleton } from '@project/components/ui/skeleton';
import { services } from '../services/clashbot';
import { useAction, useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { Avatar, Panel, StatCard } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { LogList } from '../components/common/LogList';
import { colorToHex, fmtDate, fmtNumber } from '../utils/format';

export default function ServerDetailPage() {
  const { id = '' } = useParams();
  const state = useApi(() => services.guilds.get(id), [id]);
  const { setGuildId, guildId } = useApp();
  const { run } = useAction();

  const toggle = async (key: string, enabled: boolean) => {
    // Mise à jour optimiste, annulée si le backend refuse.
    state.setData((d) => d && { ...d, modules: d.modules.map((m) => (m.key === key ? { ...m, enabled } : m)) });
    const ok = await run(() => services.guilds.setModule(id, key, enabled), enabled ? 'Module activé.' : 'Module désactivé.');
    if (!ok) state.setData((d) => d && { ...d, modules: d.modules.map((m) => (m.key === key ? { ...m, enabled: !enabled } : m)) });
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2"><Link to="/serveurs"><ArrowLeft className="mr-1.5 h-4 w-4" />Serveurs</Link></Button>
      <DataState state={state} skeleton={<Skeleton className="h-64 rounded-2xl" />}>
        {(g) => (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar src={g.iconUrl} name={g.name} className="h-16 w-16 rounded-2xl text-lg" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-semibold">{g.name}</h1>
                <p className="font-mono text-xs text-muted-foreground">{g.id} · fuseau {g.timezone ?? 'non configuré'} · ajouté le {fmtDate(g.joinedAt, undefined, false)}</p>
              </div>
              {guildId !== g.id && <Button onClick={() => setGuildId(g.id)}>Gérer ce serveur</Button>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Membres" value={g.memberCount} icon={<Users className="h-4 w-4" />} />
              <StatCard label="Membres actifs (7 j)" value={g.stats.activeMembers7d} icon={<Users className="h-4 w-4" />} />
              <StatCard label="Commandes (7 j)" value={g.stats.commands7d} icon={<Terminal className="h-4 w-4" />} />
              <StatCard label="Messages (7 j)" value={g.stats.messages7d} icon={<MessageSquare className="h-4 w-4" />} />
            </div>
            <Tabs defaultValue="modules">
              <TabsList><TabsTrigger value="modules">Modules</TabsTrigger><TabsTrigger value="roles">Rôles</TabsTrigger><TabsTrigger value="channels">Salons</TabsTrigger><TabsTrigger value="history">Historique</TabsTrigger></TabsList>
              <TabsContent value="modules" className="mt-4">
                <Panel title="Configuration des modules" description="Propre à ce serveur uniquement.">
                  {g.modules.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {g.modules.map((m) => (
                        <label key={m.key} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm">
                          <span className="font-medium">{m.name}</span><Switch checked={m.enabled} onCheckedChange={(v) => toggle(m.key, v)} />
                        </label>
                      ))}
                    </div>
                  ) : <EmptyState title="Aucun module renvoyé" />}
                </Panel>
              </TabsContent>
              <TabsContent value="roles" className="mt-4">
                <Panel title={`Rôles (${g.roles.length})`} bodyClassName="p-0">
                  <ul className="divide-y">
                    {[...g.roles].sort((a, b) => b.position - a.position).map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <span className="h-3 w-3 shrink-0 rounded-full border" style={{ background: r.color ? colorToHex(r.color) : 'transparent' }} />
                        <span className="flex-1 truncate">{r.name}</span>
                        {r.managed && <span className="text-xs text-muted-foreground">géré</span>}
                        <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{r.memberCount != null ? fmtNumber(r.memberCount) : ''}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </TabsContent>
              <TabsContent value="channels" className="mt-4">
                <Panel title={`Salons (${g.channels.length})`} bodyClassName="p-0">
                  <ul className="divide-y">
                    {[...g.channels].filter((c) => c.type !== 'category').sort((a, b) => a.position - b.position).map((c) => (
                      <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        {c.type === 'voice' || c.type === 'stage' ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 truncate">{c.name}</span>
                        {!!c.usedBy?.length && <span className="truncate text-xs text-muted-foreground">utilisé par {c.usedBy.join(', ')}</span>}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <Panel title="Historique" bodyClassName="py-1">{g.history.length ? <LogList entries={g.history} /> : <EmptyState title="Aucun historique" />}</Panel>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DataState>
    </>
  );
}
