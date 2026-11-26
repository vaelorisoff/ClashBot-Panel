import { Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { PageHeader, Panel, StatCard } from '../components/common/Layout';
import { GuildGate } from '../components/common/Guild';
import { GuildHistory } from '../components/common/GuildHistory';
import { DataState } from '../components/common/States';
import { ConfigSection } from '../components/forms/ConfigSection';
import { CollectionManager } from '../components/forms/CollectionManager';
import { ModuleMessageEditor } from '../modules/editor/Composer';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { Skeleton } from '@project/components/ui/skeleton';
import { fmtDuration } from '../utils/format';

const TICKET_VARS = [{ key: 'ticket.id', label: 'Numéro de demande' }, { key: 'ticket.category', label: 'Catégorie' }, { key: 'ticket.opened', label: 'Ouverture (horodatage)' }];

function Stats({ guildId }: { guildId: string }) {
  const state = useApi(() => services.collection.get<{ open: number; closed7d: number; avgFirstResponseSec: number | null; avgResolutionSec: number | null }>(guildId, 'support/stats'), [guildId]);
  return (
    <DataState state={state} skeleton={<div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>}>
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Demandes ouvertes" value={s.open} />
          <StatCard label="Fermées (7 j)" value={s.closed7d} />
          <StatCard label="1re réponse moyenne" value={s.avgFirstResponseSec != null ? fmtDuration(s.avgFirstResponseSec) : null} />
          <StatCard label="Résolution moyenne" value={s.avgResolutionSec != null ? fmtDuration(s.avgResolutionSec) : null} />
        </div>
      )}
    </DataState>
  );
}

export default function SupportPage() {
  return (
    <>
      <PageHeader eyebrow="Fonctionnalités" title="Assistance" description="Demandes privées entre le membre et l'équipe. Le panel n'affiche jamais le contenu des échanges privés." />
      <GuildGate>
        {(g) => (
          <Tabs defaultValue="tickets">
            <TabsList className="flex-wrap"><TabsTrigger value="tickets">Demandes</TabsTrigger><TabsTrigger value="config">Configuration</TabsTrigger><TabsTrigger value="categories">Catégories</TabsTrigger><TabsTrigger value="messages">Messages</TabsTrigger><TabsTrigger value="logs">Journaux</TabsTrigger></TabsList>
            <TabsContent value="tickets" className="mt-4 space-y-6">
              <Stats guildId={g} />
              <Panel title="Historique des demandes" bodyClassName="p-3">
                <GuildHistory guildId={g} path="support/tickets" render={(r) => ({
                  primary: `#${r.number ?? r.id} · ${r.category ?? 'Sans catégorie'} — ${r.username ?? r.userId}`,
                  secondary: `${{ open: 'Ouverte', pending: 'En attente', closed: 'Fermée' }[String(r.status)] ?? r.status}${r.claimedBy ? ` · prise en charge par ${r.claimedBy}` : ''}`,
                  at: (r.openedAt as string) ?? null,
                })} />
              </Panel>
            </TabsContent>
            <TabsContent value="config" className="mt-4">
              <ConfigSection guildId={g} section="support" groups={[
                { title: 'Fonctionnement', fields: [
                  { key: 'enabled', label: 'Assistance activée', type: 'boolean' }, { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'thread', label: 'Fil privé' }, { value: 'channel', label: 'Salon privé' }] },
                  { key: 'categoryId', label: 'Catégorie Discord des demandes', type: 'channel', channelTypes: ['category'] },
                  { key: 'panelChannel', label: 'Salon du panneau d\'ouverture', type: 'channel' },
                  { key: 'staffRoles', label: 'Rôles de l\'équipe', type: 'roles' }, { key: 'maxOpenPerMember', label: 'Demandes ouvertes max. par membre', type: 'integer', min: 1 },
                  { key: 'autoCloseAfter', label: 'Fermeture auto. après inactivité', type: 'duration' }, { key: 'transcripts', label: 'Conserver une transcription', type: 'boolean' },
                  { key: 'logChannel', label: 'Salon des journaux', type: 'channel' },
                ] },
              ]} intro={<p className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" />Chaque demande reste visible uniquement par le membre et les rôles de l'équipe.</p>} />
            </TabsContent>
            <TabsContent value="categories" className="mt-4">
              <Panel title="Catégories de demandes">
                <CollectionManager guildId={g} path="support/categories" noun="Catégorie"
                  columns={[{ key: 'emoji', label: '' }, { key: 'name', label: 'Nom' }, { key: 'description', label: 'Description' }]}
                  fields={[{ key: 'name', label: 'Nom', type: 'text', required: true }, { key: 'emoji', label: 'Emoji', type: 'emoji' }, { key: 'staffRoles', label: 'Rôles notifiés', type: 'roles' }, { key: 'description', label: 'Description', type: 'textarea', wide: true }]} />
              </Panel>
            </TabsContent>
            <TabsContent value="messages" className="mt-4 space-y-8">
              <div><h3 className="mb-3 text-sm font-semibold">Panneau d'ouverture</h3><ModuleMessageEditor guildId={g} module="support-panel" /></div>
              <div><h3 className="mb-3 text-sm font-semibold">Message d'accueil de la demande</h3><ModuleMessageEditor guildId={g} module="support-open" variables={TICKET_VARS} /></div>
            </TabsContent>
            <TabsContent value="logs" className="mt-4"><GuildHistory guildId={g} path="support/logs" /></TabsContent>
          </Tabs>
        )}
      </GuildGate>
    </>
  );
}
