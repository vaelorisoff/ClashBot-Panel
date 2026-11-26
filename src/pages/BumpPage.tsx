import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Skeleton } from '@project/components/ui/skeleton';
import { services, type Range } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { Avatar, PageHeader, Panel, StatCard, StatusDot } from '../components/common/Layout';
import { GuildGate } from '../components/common/Guild';
import { GuildHistory } from '../components/common/GuildHistory';
import { DataState, EmptyState } from '../components/common/States';
import { RangeTabs, TimeSeriesChart } from '../components/common/Charts';
import { ConfigSection } from '../components/forms/ConfigSection';
import { discordTimestamp } from '../utils/discordTime';
import { fmtDate, fmtNumber } from '../utils/format';

function Overview({ guildId }: { guildId: string }) {
  const [range, setRange] = useState<Range>('30d');
  const { timezone } = useApp();
  const state = useApi(() => services.bump.overview(guildId, range), [guildId, range]);
  return (
    <DataState state={state} skeleton={<Skeleton className="h-64 rounded-2xl" />}>
      {(b) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4"><StatusDot ok={b.enabled} /><div><p className="text-sm font-medium">Système de bump</p><p className="text-xs text-muted-foreground">{b.enabled ? 'Actif' : 'Inactif'}</p></div></div>
            <StatCard label="Bumps sur la période" value={b.total} />
            <StatCard label="Position au classement" value={b.rank != null ? `n°${b.rank}` : null} />
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Prochain bump possible</p>
              <p className="mt-2 text-lg font-semibold">{b.nextAvailableAt ? fmtDate(b.nextAvailableAt, timezone) : 'Non configuré'}</p>
              {b.nextAvailableAt && <code className="mt-1 block font-mono text-xs text-muted-foreground">{discordTimestamp(new Date(b.nextAvailableAt), 'R')}</code>}
            </div>
          </div>
          <Panel title="Activité" actions={<RangeTabs value={range} onChange={setRange} />}><TimeSeriesChart kind="bar" data={b.series} series={['bumps']} labels={{ bumps: 'Bumps' }} /></Panel>
          <Panel title="Meilleurs membres">
            {b.topMembers.length ? <ol className="space-y-1.5">{b.topMembers.map((m, i) => (
              <li key={m.userId} className="flex items-center gap-3 text-sm"><span className="w-5 text-center font-semibold text-muted-foreground">{i + 1}</span><Avatar src={m.avatarUrl} name={m.username} className="h-7 w-7" /><span className="flex-1 truncate">{m.username}</span><span className="tabular-nums">{fmtNumber(m.count)}</span></li>))}</ol>
              : <EmptyState title="Aucun bump enregistré" />}
          </Panel>
        </div>
      )}
    </DataState>
  );
}

function Leaderboard() {
  const state = useApi(services.bump.leaderboard, []);
  return (
    <DataState state={state} isEmpty={(d) => !d.length} empty={<EmptyState title="Classement vide" />}>
      {(list) => (
        <ol className="divide-y rounded-2xl border bg-card">
          {list.map((g, i) => (
            <li key={g.guildId} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className={`w-6 text-center font-semibold ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
              <Avatar src={g.iconUrl} name={g.name} className="h-8 w-8" /><span className="flex-1 truncate font-medium">{g.name}</span>
              <span className="tabular-nums">{fmtNumber(g.bumps)} bumps</span>
            </li>
          ))}
        </ol>
      )}
    </DataState>
  );
}

export default function BumpPage() {
  return (
    <>
      <PageHeader eyebrow="Communauté" title="Bump et classement" description="Historique, classement inter-serveurs et paramètres du bump." />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap"><TabsTrigger value="overview">Vue d'ensemble</TabsTrigger><TabsTrigger value="leaderboard">Classement serveurs</TabsTrigger><TabsTrigger value="history">Historique</TabsTrigger><TabsTrigger value="config">Paramètres</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-4"><GuildGate>{(g) => <Overview guildId={g} />}</GuildGate></TabsContent>
        <TabsContent value="leaderboard" className="mt-4"><Leaderboard /></TabsContent>
        <TabsContent value="history" className="mt-4"><GuildGate>{(g) => <GuildHistory guildId={g} path="bump/history" render={(r) => ({ primary: `Bump par ${r.username ?? r.userId}`, at: (r.at as string) ?? null })} />}</GuildGate></TabsContent>
        <TabsContent value="config" className="mt-4"><GuildGate>{(g) => <ConfigSection guildId={g} section="bump" groups={[{ title: 'Paramètres', fields: [
          { key: 'enabled', label: 'Bump activé', type: 'boolean' }, { key: 'cooldown', label: 'Délai entre deux bumps', type: 'duration' },
          { key: 'reminderChannel', label: 'Salon de rappel', type: 'channel' }, { key: 'reminderRole', label: 'Rôle à mentionner pour le rappel', type: 'role' },
          { key: 'reward', label: 'Récompense économique par bump', type: 'money', min: 0 }, { key: 'description', label: 'Description du serveur au classement', type: 'textarea', wide: true },
        ] }]} />}</GuildGate></TabsContent>
      </Tabs>
    </>
  );
}
