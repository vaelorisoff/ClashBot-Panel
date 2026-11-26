import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { fmtCompact, fmtNumber } from '../../utils/format';
import type { Range } from '../../services/clashbot';
import { EmptyState } from './States';

export const SERIES_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
export const RANGES: { value: Range; label: string }[] = [{ value: '24h', label: '24 h' }, { value: '7d', label: '7 j' }, { value: '30d', label: '30 j' }, { value: '90d', label: '90 j' }];

export function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Range)}>
      <TabsList className="h-8">{RANGES.map((r) => <TabsTrigger key={r.value} value={r.value} className="h-6 px-2.5 text-xs">{r.label}</TabsTrigger>)}</TabsList>
    </Tabs>
  );
}

const axis = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11, tickLine: false, axisLine: false };
const tickDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(d);
};

function ChartTooltip({ active, payload, label, labels }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; labels?: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label ?? '');
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{Number.isNaN(d.getTime()) ? label : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: label?.includes('T') ? 'short' : undefined }).format(d)}</p>
      {payload.map((p) => <p key={p.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{labels?.[p.name] ?? p.name} : <span className="font-semibold tabular-nums">{fmtNumber(p.value)}</span></p>)}
    </div>
  );
}

export function TimeSeriesChart({ data, series, labels, kind = 'area', height = 260 }: {
  data: Record<string, unknown>[]; series: string[]; labels?: Record<string, string>; kind?: 'area' | 'line' | 'bar'; height?: number;
}) {
  if (!data.length) return <EmptyState title="Pas encore de données" text="Aucune valeur enregistrée sur cette période." />;
  const common = (
    <>
      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="date" tickFormatter={tickDate} {...axis} minTickGap={24} />
      <YAxis tickFormatter={(v) => fmtCompact(v)} {...axis} width={44} />
      <Tooltip content={<ChartTooltip labels={labels} />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
      {series.length > 1 && <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{labels?.[v] ?? v}</span>} iconType="circle" iconSize={8} />}
    </>
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      {kind === 'bar' ? (
        <BarChart data={data}>{common}{series.map((s, i) => <Bar key={s} dataKey={s} fill={SERIES_COLORS[i % 5]} radius={[4, 4, 0, 0]} maxBarSize={28} />)}</BarChart>
      ) : kind === 'line' ? (
        <LineChart data={data}>{common}{series.map((s, i) => <Line key={s} dataKey={s} stroke={SERIES_COLORS[i % 5]} strokeWidth={2} dot={false} strokeDasharray={s.startsWith('prev') ? '5 4' : undefined} />)}</LineChart>
      ) : (
        <AreaChart data={data}>
          <defs>{series.map((s, i) => <linearGradient key={s} id={`g-${s}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={SERIES_COLORS[i % 5]} stopOpacity={0.35} /><stop offset="100%" stopColor={SERIES_COLORS[i % 5]} stopOpacity={0} /></linearGradient>)}</defs>
          {common}
          {series.map((s, i) => <Area key={s} dataKey={s} stroke={SERIES_COLORS[i % 5]} strokeWidth={2} fill={`url(#g-${s})`} />)}
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data.length) return <EmptyState title="Pas encore de données" text="Aucune utilisation enregistrée." />;
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full max-w-[220px]" style={{ height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={SERIES_COLORS[i % 5]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => fmtNumber(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-semibold tabular-nums">{fmtCompact(total)}</span><span className="text-[11px] text-muted-foreground">total</span></div>
      </div>
      <ul className="w-full flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES_COLORS[i % 5] }} />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return <EmptyState title="Pas encore de données" />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="text-sm">
          <div className="mb-1 flex justify-between gap-2"><span className="truncate font-mono text-[13px]">{d.label}</span><span className="tabular-nums text-muted-foreground">{fmtNumber(d.value)}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
