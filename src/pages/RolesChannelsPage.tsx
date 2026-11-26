import { useState } from 'react';
import { Hash, Search, ShieldAlert, Volume2 } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Badge } from '@project/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { PageHeader, Panel, Toolbar } from '../components/common/Layout';
import { GuildGate, useGuildMeta } from '../components/common/Guild';
import { GuildHistory } from '../components/common/GuildHistory';
import { DataState, EmptyState } from '../components/common/States';
import { CollectionManager } from '../components/forms/CollectionManager';
import { colorToHex, fmtNumber } from '../utils/format';

function Roles({ guildId }: { guildId: string }) {
  const meta = useGuildMeta(guildId);
  const [q, setQ] = useState('');
  return (
    <>
      <Toolbar><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Filtrer les rôles…" value={q} onChange={(e) => setQ(e.target.value)} /></div></Toolbar>
      <DataState state={meta} isEmpty={(d) => !d.roles.length} empty={<EmptyState title="Aucun rôle" />}>
        {(d) => (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <ul className="divide-y">
              {[...d.roles].sort((a, b) => b.position - a.position).filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full border" style={{ background: r.color ? colorToHex(r.color) : 'transparent' }} />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                  {r.managed && <Badge variant="outline" className="text-[10px]">Intégration</Badge>}
                  {r.botCanManage === false && <span className="flex items-center gap-1 text-xs text-warning"><ShieldAlert className="h-3.5 w-3.5" />au-dessus du bot</span>}
                  {!!r.usedBy?.length && <span className="hidden truncate text-xs text-muted-foreground md:inline">utilisé par {r.usedBy.join(', ')}</span>}
                  <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{r.memberCount != null ? fmtNumber(r.memberCount) : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DataState>
    </>
  );
}

function Channels({ guildId }: { guildId: string }) {
  const meta = useGuildMeta(guildId);
  return (
    <DataState state={meta} isEmpty={(d) => !d.channels.length} empty={<EmptyState title="Aucun salon" />}>
      {(d) => {
        const cats = d.channels.filter((c) => c.type === 'category').sort((a, b) => a.position - b.position);
        const groups = [{ id: null as string | null, name: 'Sans catégorie' }, ...cats.map((c) => ({ id: c.id as string | null, name: c.name }))];
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((g) => {
              const chans = d.channels.filter((c) => c.type !== 'category' && (c.parentId ?? null) === g.id).sort((a, b) => a.position - b.position);
              if (!chans.length) return null;
              return (
                <Panel key={g.id ?? 'none'} title={g.name} bodyClassName="p-0">
                  <ul className="divide-y">
                    {chans.map((c) => (
                      <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        {c.type === 'voice' || c.type === 'stage' ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        {c.botCanSend === false && <span className="text-xs text-warning">bot sans accès</span>}
                        {!!c.usedBy?.length && <div className="flex flex-wrap justify-end gap-1">{c.usedBy.map((u) => <Badge key={u} variant="secondary" className="text-[10px]">{u}</Badge>)}</div>}
                      </li>
                    ))}
                  </ul>
                </Panel>
              );
            })}
          </div>
        );
      }}
    </DataState>
  );
}

export default function RolesChannelsPage() {
  return (
    <>
      <PageHeader eyebrow="Communauté" title="Rôles et salons" description="Toutes les modifications sont validées par le backend selon les permissions Discord et celles du bot." />
      <GuildGate>
        {(g) => (
          <Tabs defaultValue="roles">
            <TabsList className="flex-wrap"><TabsTrigger value="roles">Rôles</TabsTrigger><TabsTrigger value="channels">Salons</TabsTrigger><TabsTrigger value="autoroles">Rôles automatiques</TabsTrigger><TabsTrigger value="bindings">Associations</TabsTrigger><TabsTrigger value="history">Historique</TabsTrigger></TabsList>
            <TabsContent value="roles" className="mt-4"><Roles guildId={g} /></TabsContent>
            <TabsContent value="channels" className="mt-4"><Channels guildId={g} /></TabsContent>
            <TabsContent value="autoroles" className="mt-4">
              <Panel title="Rôles automatiques" description="Attribués par le bot selon un déclencheur.">
                <CollectionManager guildId={g} path="roles/auto" noun="Rôle automatique"
                  columns={[{ key: 'trigger', label: 'Déclencheur' }, { key: 'roleId', label: 'Rôle' }, { key: 'delay', label: 'Délai (s)' }, { key: 'enabled', label: 'Actif' }]}
                  fields={[
                    { key: 'trigger', label: 'Déclencheur', type: 'select', required: true, options: [{ value: 'join', label: 'Arrivée' }, { value: 'join_bot', label: 'Arrivée d\'un bot' }, { value: 'rules', label: 'Acceptation du règlement' }, { value: 'level', label: 'Niveau atteint' }, { value: 'boost', label: 'Boost du serveur' }] },
                    { key: 'roleId', label: 'Rôle', type: 'role', required: true }, { key: 'delay', label: 'Délai avant attribution', type: 'duration' },
                    { key: 'level', label: 'Niveau (si déclencheur « niveau »)', type: 'integer', min: 1 }, { key: 'enabled', label: 'Actif', type: 'boolean' },
                  ]} />
              </Panel>
            </TabsContent>
            <TabsContent value="bindings" className="mt-4">
              <Panel title="Associations rôles ↔ fonctionnalités" description="Quels rôles accèdent à quelles fonctionnalités de ClashBot.">
                <CollectionManager guildId={g} path="roles/bindings" noun="Association"
                  columns={[{ key: 'feature', label: 'Fonctionnalité' }, { key: 'roles', label: 'Rôles' }, { key: 'mode', label: 'Mode' }]}
                  fields={[
                    { key: 'feature', label: 'Fonctionnalité', type: 'select', required: true, options: [{ value: 'economy-admin', label: 'Administration économique' }, { value: 'support-staff', label: 'Équipe assistance' }, { value: 'moderation', label: 'Modération' }, { value: 'announcements', label: 'Annonces' }, { value: 'tts', label: 'TTS' }, { value: 'bump', label: 'Bump' }] },
                    { key: 'roles', label: 'Rôles', type: 'roles', required: true }, { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'allow', label: 'Autoriser' }, { value: 'deny', label: 'Refuser' }] },
                  ]} />
              </Panel>
            </TabsContent>
            <TabsContent value="history" className="mt-4"><GuildHistory guildId={g} path="roles/history" /></TabsContent>
          </Tabs>
        )}
      </GuildGate>
    </>
  );
}
