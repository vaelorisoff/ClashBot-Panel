import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Skeleton } from '@project/components/ui/skeleton';
import { Badge } from '@project/components/ui/badge';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Panel, StatCard, StatusDot } from '../components/common/Layout';
import { GuildGate } from '../components/common/Guild';
import { GuildHistory } from '../components/common/GuildHistory';
import { DataState, EmptyState } from '../components/common/States';
import { ConfigSection } from '../components/forms/ConfigSection';
import { fmtDate } from '../utils/format';

function Status() {
  const state = useApi(services.tts.status, []);
  const { timezone } = useApp();
  return (
    <DataState state={state} skeleton={<Skeleton className="h-32 rounded-2xl" />}>
      {(s) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4"><StatusDot ok={s.online} pulse /><div><p className="text-sm font-medium">Service TTS</p><p className="text-xs text-muted-foreground">{s.online ? `Opérationnel · ${s.provider}` : 'Indisponible'}</p></div></div>
            <StatCard label="Lectures aujourd'hui" value={s.usageToday} />
            <StatCard label="Caractères ce mois" value={s.charactersMonth} hint={s.charactersLimit != null ? `sur ${s.charactersLimit.toLocaleString('fr-FR')}` : undefined} />
            <StatCard label="Sessions vocales actives" value={s.activeSessions} />
          </div>
          <Panel title="Erreurs récentes" bodyClassName="p-0">
            {s.recentErrors.length ? <ul className="divide-y">{s.recentErrors.map((e, i) => <li key={i} className="flex gap-3 px-5 py-2.5 text-sm"><span className="flex-1 text-destructive">{e.message}</span><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(e.at, timezone)}</span></li>)}</ul>
              : <div className="p-5"><EmptyState title="Aucune erreur récente" /></div>}
          </Panel>
        </div>
      )}
    </DataState>
  );
}

function Voices() {
  const state = useApi(services.tts.voices, []);
  return (
    <DataState state={state} isEmpty={(d) => !d.length} empty={<EmptyState title="Aucune voix disponible" />}>
      {(list) => (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{v.name}</p><p className="font-mono text-xs text-muted-foreground">{v.language}</p></div>
              {v.gender && <Badge variant="secondary">{v.gender}</Badge>}
            </div>
          ))}
        </div>
      )}
    </DataState>
  );
}

function Docs() {
  const state = useApi(() => services.commands.list(), []);
  return (
    <DataState state={state} isEmpty={(d) => !d.some(isTts)} empty={<EmptyState title="Aucune commande TTS" text="Le catalogue du backend ne contient aucune commande TTS." />}>
      {(list) => (
        <ul className="divide-y">{list.filter(isTts).flatMap((c) => (c.subcommands?.length ? c.subcommands.map((s) => ({ k: `${c.name} ${s.name}`, d: s.description })) : [{ k: c.name, d: c.description }])).map((x) => (
          <li key={x.k} className="py-2.5 text-sm"><code className="font-mono">/{x.k}</code><p className="text-muted-foreground">{x.d}</p></li>))}</ul>
      )}
    </DataState>
  );
}
const isTts = (c: { name: string; category: string }) => c.name.toLowerCase().startsWith('tts') || c.category.toLowerCase().includes('tts');

export default function TtsPage() {
  return (
    <>
      <PageHeader eyebrow="Fonctionnalités" title="Synthèse vocale (TTS)" description="État du service, voix, paramètres et limites par serveur." />
      <Tabs defaultValue="status">
        <TabsList className="flex-wrap"><TabsTrigger value="status">État</TabsTrigger><TabsTrigger value="voices">Langues et voix</TabsTrigger><TabsTrigger value="config">Paramètres</TabsTrigger><TabsTrigger value="usage">Utilisation</TabsTrigger><TabsTrigger value="docs">Documentation</TabsTrigger></TabsList>
        <TabsContent value="status" className="mt-4"><Status /></TabsContent>
        <TabsContent value="voices" className="mt-4"><Voices /></TabsContent>
        <TabsContent value="config" className="mt-4">
          <GuildGate>{(g) => <ConfigSection guildId={g} section="tts" groups={[
            { title: 'Paramètres', fields: [
              { key: 'enabled', label: 'TTS activé', type: 'boolean' }, { key: 'defaultVoice', label: 'Voix par défaut (identifiant)', type: 'text' },
              { key: 'language', label: 'Langue par défaut', type: 'text', hint: 'ex. fr-FR' }, { key: 'speed', label: 'Vitesse', type: 'number', min: 0 },
              { key: 'readNames', label: 'Lire le pseudo avant le message', type: 'boolean' }, { key: 'textChannels', label: 'Salons textuels lus automatiquement', type: 'channels' },
              { key: 'allowedRoles', label: 'Rôles autorisés', type: 'roles' },
            ] },
            { title: 'Limites', fields: [
              { key: 'maxLength', label: 'Longueur max. d\'un message', type: 'integer', min: 1 }, { key: 'cooldown', label: 'Délai par membre', type: 'duration' },
              { key: 'dailyCharsPerMember', label: 'Caractères par membre et par jour', type: 'integer', min: 0 }, { key: 'idleDisconnect', label: 'Déconnexion après inactivité', type: 'duration' },
            ] },
          ]} />}</GuildGate>
        </TabsContent>
        <TabsContent value="usage" className="mt-4"><GuildGate>{(g) => <GuildHistory guildId={g} path="tts/usage" />}</GuildGate></TabsContent>
        <TabsContent value="docs" className="mt-4">
          <Panel title="Commandes TTS" description="Issues du catalogue réel des commandes de ClashBot.">
            <Docs />
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
