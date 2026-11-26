import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeftRight, Server, Terminal, Users, XCircle } from 'lucide-react';
import { services, type Range } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Panel, StatCard, StatusDot } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { BarList, DonutChart, RangeTabs, TimeSeriesChart } from '../components/common/Charts';
import { LogList } from '../components/common/LogList';
import { Skeleton } from '@project/components/ui/skeleton';
import { delta, fmtDate, fmtDuration } from '../utils/format';

function ServiceCards() {
  const { status, statusError } = useApp();
  const items = [
    { label: 'Bot Discord', s: status?.bot, extra: status?.bot.uptimeSec != null ? `en ligne depuis ${fmtDuration(status.bot.uptimeSec)}` : undefined, ok: status?.bot.online },
    { label: 'Backend ClashBot', s: status?.backend, ok: status?.backend.ok },
    { label: 'Supabase', s: status?.supabase, ok: status?.supabase.ok },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm">
          <StatusDot ok={i.ok ?? null} pulse />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{i.label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {!status ? (statusError ? statusError.message : 'Vérification…') : i.ok ? (i.extra ?? 'Opérationnel') : (i.s?.message ?? 'Indisponible')}
            </p>
          </div>
          {i.s?.latencyMs != null && <span className="font-mono text-xs text-muted-foreground">{i.s.latencyMs} ms</span>}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<Range>('7d');
  const { guildId, guild, me } = useApp();
  const [scope, setScope] = useState<'all' | 'guild'>('all');
  const gid = scope === 'guild' ? guildId ?? undefined : undefined;
  const state = useApi(() => services.stats.overview(range, gid), [range, gid]);

  return (
    <>
      <PageHeader eyebrow={me ? `Bonjour ${me.globalName || me.username}` : 'Vue d\'ensemble'} title="Tableau de bord"
        description="État de ClashBot et activité sur la période choisie."
        actions={<>
          {guild && (
            <div className="flex rounded-lg border p-0.5 text-xs">
              <button className={`rounded-md px-2.5 py-1 ${scope === 'all' ? 'bg-secondary font-medium' : 'text-muted-foreground'}`} onClick={() => setScope('all')}>Tous les serveurs</button>
              <button className={`max-w-[160px] truncate rounded-md px-2.5 py-1 ${scope === 'guild' ? 'bg-secondary font-medium' : 'text-muted-foreground'}`} onClick={() => setScope('guild')}>{guild.name}</button>
            </div>
          )}
          <RangeTabs value={range} onChange={setRange} />
        </>} />
      <div className="space-y-6">
        <ServiceCards />
        <DataState state={state} skeleton={<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>}>
          {(d) => (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Serveurs" value={d.guilds} icon={<Server className="h-4 w-4" />} />
                <StatCard label="Membres" value={d.members} icon={<Users className="h-4 w-4" />} />
                <StatCard label="Commandes exécutées" value={d.commands} change={delta(d.commands, d.commandsPrev)} hint="vs période précédente" icon={<Terminal className="h-4 w-4" />} />
                <StatCard label="Transactions" value={d.transactions} change={delta(d.transactions, d.transactionsPrev)} hint="vs période précédente" icon={<ArrowLeftRight className="h-4 w-4" />} />
              </div>
              <div className="grid gap-6 xl:grid-cols-3">
                <Panel className="xl:col-span-2" title="Activité générale" description="Commandes et messages traités par ClashBot">
                  <TimeSeriesChart data={d.activity} series={Object.keys(d.activity[0] ?? {}).filter((k) => k !== 'date')} labels={{ commands: 'Commandes', messages: 'Messages', commandsPrev: 'Commandes (période préc.)' }} />
                </Panel>
                <Panel title="Utilisation des modules"><DonutChart data={d.moduleUsage.map((m) => ({ label: m.module, value: m.count }))} /></Panel>
              </div>
              <div className="grid gap-6 xl:grid-cols-3">
                <Panel title="Évolution des serveurs et membres" className="xl:col-span-2">
                  <TimeSeriesChart kind="line" data={d.growth} series={Object.keys(d.growth[0] ?? {}).filter((k) => k !== 'date')} labels={{ guilds: 'Serveurs', members: 'Membres' }} />
                </Panel>
                <Panel title="Commandes les plus utilisées" actions={<Link to="/commandes" className="text-xs text-primary hover:underline">Catalogue</Link>}>
                  <BarList data={d.topCommands.map((c) => ({ label: `/${c.name}`, value: c.count }))} />
                </Panel>
              </div>
              <Panel title="Activité économique" description="Volumes entrants et sortants" actions={<Link to="/economie" className="text-xs text-primary hover:underline">Économie</Link>}>
                <TimeSeriesChart kind="bar" data={d.economy} series={Object.keys(d.economy[0] ?? {}).filter((k) => k !== 'date')} labels={{ in: 'Entrées', out: 'Sorties', volume: 'Volume' }} />
              </Panel>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel title="Derniers événements" actions={<Link to="/journaux" className="text-xs text-primary hover:underline">Tous les journaux</Link>} bodyClassName="py-1">
                  {d.events.length ? <LogList entries={d.events} /> : <EmptyState title="Aucun événement" />}
                </Panel>
                <Panel title="Erreurs et alertes" bodyClassName="py-1">
                  {d.alerts.length ? (
                    <ul className="divide-y">
                      {d.alerts.map((a) => (
                        <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
                          {a.level === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}
                          <span className="flex-1">{a.message}</span><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(a.at)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <EmptyState title="Aucune alerte" text="Aucune erreur signalée sur la période." />}
                </Panel>
              </div>
            </div>
          )}
        </DataState>
      </div>
    </>
  );
}
