import { useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Switch } from '@project/components/ui/switch';
import { Label } from '@project/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Skeleton } from '@project/components/ui/skeleton';
import { services, type Range } from '../services/clashbot';
import { useAction, useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Panel, StatCard, Toolbar } from '../components/common/Layout';
import { DataState } from '../components/common/States';
import { BarList, DonutChart, RangeTabs, TimeSeriesChart } from '../components/common/Charts';
import { delta } from '../utils/format';

const METRICS = [
  { value: 'commands', label: 'Utilisation des commandes' }, { value: 'active_members', label: 'Membres actifs' },
  { value: 'guilds', label: 'Serveurs' }, { value: 'messages', label: 'Messages envoyés par le bot' },
  { value: 'economy_volume', label: 'Volume économique' }, { value: 'economy_transactions', label: 'Transactions' },
  { value: 'social_notifications', label: 'Notifications sociales' }, { value: 'module_usage', label: 'Utilisation des modules' },
  { value: 'tts_characters', label: 'Caractères TTS' }, { value: 'bumps', label: 'Bumps' },
];

export default function AnalyticsPage() {
  const { guilds } = useApp();
  const [metric, setMetric] = useState('commands');
  const [range, setRange] = useState<Range>('30d');
  const [gid, setGid] = useState('all');
  const [compare, setCompare] = useState(true);
  const [kind, setKind] = useState<'area' | 'line' | 'bar'>('area');
  const q = { metric, range, guildId: gid === 'all' ? undefined : gid, compare: compare ? 1 : undefined };
  const state = useApi(() => services.stats.series(q), [metric, range, gid, compare]);
  const { run, pending } = useAction();
  const label = METRICS.find((m) => m.value === metric)!.label;

  const merged = useMemo(() => {
    const d = state.data; if (!d) return [];
    return d.current.map((p, i) => ({ date: p.date, value: p.value, ...(compare && d.previous?.[i] ? { prevValue: d.previous[i].value } : {}) }));
  }, [state.data, compare]);

  const exportCsv = () => run(async () => { const { url } = await services.stats.exportUrl(q); window.open(url, '_blank', 'noopener'); return url; }, 'Export généré par le backend.');

  return (
    <>
      <PageHeader eyebrow="Analyse" title="Statistiques" description="Évolution temporelle, comparaison de périodes et classements."
        actions={<Button variant="outline" onClick={exportCsv} disabled={pending}>{pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}Exporter</Button>} />
      <Toolbar>
        <Select value={metric} onValueChange={setMetric}><SelectTrigger className="w-64"><SelectValue /></SelectTrigger><SelectContent>{METRICS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
        <Select value={gid} onValueChange={setGid}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent className="max-h-72"><SelectItem value="all">Tous les serveurs</SelectItem>{guilds.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
        <RangeTabs value={range} onChange={setRange} />
        <Label className="flex items-center gap-2 text-sm font-normal"><Switch checked={compare} onCheckedChange={setCompare} />Comparer à la période précédente</Label>
      </Toolbar>
      <DataState state={state} skeleton={<Skeleton className="h-96 rounded-2xl" />}>
        {(d) => {
          const total = d.current.reduce((n, p) => n + p.value, 0);
          const prev = d.previous?.reduce((n, p) => n + p.value, 0) ?? null;
          const peak = d.current.length ? Math.max(...d.current.map((p) => p.value)) : null;
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label={`${label} — total`} value={total} change={compare ? delta(total, prev) : null} hint={compare ? 'vs période précédente' : undefined} />
                <StatCard label="Moyenne par point" value={d.current.length ? Math.round(total / d.current.length) : null} />
                <StatCard label="Pic" value={peak} />
              </div>
              <Panel title={label} actions={<Tabs value={kind} onValueChange={(v) => setKind(v as typeof kind)}><TabsList className="h-8"><TabsTrigger value="area" className="text-xs">Aire</TabsTrigger><TabsTrigger value="line" className="text-xs">Courbe</TabsTrigger><TabsTrigger value="bar" className="text-xs">Histogramme</TabsTrigger></TabsList></Tabs>}>
                <TimeSeriesChart kind={kind} height={320} data={merged} series={compare && d.previous ? ['value', 'prevValue'] : ['value']} labels={{ value: 'Période actuelle', prevValue: 'Période précédente' }} />
              </Panel>
              {!!d.breakdown?.length && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title="Répartition"><DonutChart data={d.breakdown.slice(0, 6)} /></Panel>
                  <Panel title="Classement"><BarList data={d.breakdown.slice(0, 10)} /></Panel>
                </div>
              )}
            </div>
          );
        }}
      </DataState>
    </>
  );
}
