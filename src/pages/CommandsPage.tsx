import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Search, XCircle } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Badge } from '@project/components/ui/badge';
import { Switch } from '@project/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { cn } from '@project/components/lib/utils';
import { services } from '../services/clashbot';
import { useAction, useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Pagination, Toolbar } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { fmtDate, fmtNumber, fmtPercent } from '../utils/format';
import type { BotCommand } from '../types/api';

function CommandCard({ c, guildId, onToggle }: { c: BotCommand; guildId: string | null; onToggle: (enabled: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')} />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold">/{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.description}</p>
          </div>
        </button>
        <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
          <p className="tabular-nums">{c.usage7d != null ? `${fmtNumber(c.usage7d)} util. / 7 j` : ''}</p>
          <p className="tabular-nums">{c.successRate != null ? `${fmtPercent(c.successRate)} de réussite` : ''}</p>
        </div>
        {guildId && <Switch checked={c.enabled} onCheckedChange={onToggle} aria-label={`Activer /${c.name}`} />}
      </div>
      {open && (
        <div className="space-y-3 border-t px-4 py-3 text-sm">
          <div className="flex flex-wrap gap-1.5"><span className="text-xs text-muted-foreground">Permissions :</span>
            {c.permissions.length ? c.permissions.map((p) => <Badge key={p} variant="secondary" className="text-[11px]">{p}</Badge>) : <span className="text-xs">Aucune</span>}
          </div>
          {!!c.options.length && (
            <div><p className="mb-1 text-xs text-muted-foreground">Paramètres</p>
              <ul className="space-y-1">{c.options.map((o) => (
                <li key={o.name} className="flex flex-wrap items-baseline gap-2"><code className="font-mono text-xs">{o.name}</code><Badge variant="outline" className="text-[10px]">{o.type}</Badge>{o.required && <Badge className="text-[10px]">requis</Badge>}<span className="text-xs text-muted-foreground">{o.description}</span>
                  {o.choices?.length ? <span className="text-xs text-muted-foreground">({o.choices.map((x) => x.name).join(', ')})</span> : null}</li>))}</ul>
            </div>
          )}
          {!!c.subcommands?.length && (
            <div><p className="mb-1 text-xs text-muted-foreground">Sous-commandes</p>
              <ul className="space-y-1">{c.subcommands.map((s) => <li key={s.name}><code className="font-mono text-xs">/{c.name} {s.name}</code> <span className="text-xs text-muted-foreground">— {s.description}</span></li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Catalog() {
  const { guildId } = useApp();
  const state = useApi(() => services.commands.list(guildId ?? undefined), [guildId]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Toutes');
  const { run } = useAction();
  const cats = useMemo(() => ['Toutes', ...Array.from(new Set((state.data ?? []).map((c) => c.category))).sort()], [state.data]);

  const toggle = async (name: string, enabled: boolean) => {
    if (!guildId) return;
    const patch = (v: boolean) => state.setData((d) => d && d.map((c) => (c.name === name ? { ...c, enabled: v } : c)));
    patch(enabled);
    const ok = await run(() => services.commands.setEnabled(guildId, name, enabled), enabled ? `/${name} activée sur ce serveur.` : `/${name} désactivée sur ce serveur.`);
    if (!ok) patch(!enabled);
  };

  return (
    <>
      <Toolbar>
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Nom ou description…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={cn('shrink-0 rounded-full border px-3 py-1 text-xs', cat === c ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>{c}</button>)}
        </div>
      </Toolbar>
      {!guildId && <p className="mb-3 text-xs text-muted-foreground">Sélectionnez un serveur pour activer ou désactiver des commandes sur celui-ci.</p>}
      <DataState state={state} isEmpty={(d) => !d.length} empty={<EmptyState title="Aucune commande" text="Le backend n'a renvoyé aucune commande enregistrée." />}>
        {(list) => {
          const shown = list.filter((c) => (cat === 'Toutes' || c.category === cat) && (`${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase())));
          const groups = shown.reduce<Record<string, BotCommand[]>>((a, c) => ({ ...a, [c.category]: [...(a[c.category] ?? []), c] }), {});
          return shown.length ? (
            <div className="space-y-6">
              {Object.entries(groups).map(([g, cs]) => (
                <section key={g}><h2 className="mb-2 text-sm font-semibold text-muted-foreground">{g} <span className="font-normal">· {cs.length}</span></h2>
                  <div className="grid gap-2 lg:grid-cols-2">{cs.map((c) => <CommandCard key={c.name} c={c} guildId={guildId} onToggle={(v) => toggle(c.name, v)} />)}</div>
                </section>
              ))}
            </div>
          ) : <EmptyState title="Aucun résultat" />;
        }}
      </DataState>
    </>
  );
}

function History() {
  const { guildId, timezone } = useApp();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'ok' | 'error'>('all');
  const state = useApi(() => services.commands.history({ guildId: guildId ?? undefined, status: status === 'all' ? undefined : status, page, pageSize: 30 }), [guildId, status, page]);
  return (
    <>
      <Toolbar>
        {(['all', 'ok', 'error'] as const).map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={cn('rounded-full border px-3 py-1 text-xs', status === s ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground')}>{{ all: 'Toutes', ok: 'Réussies', error: 'En erreur' }[s]}</button>)}
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucune exécution" />}>
        {(d) => (
          <>
            <ul className="divide-y rounded-2xl border bg-card">
              {d.items.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  {h.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                  <code className="font-mono">/{h.name}</code>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">par {h.username}{h.guildName ? ` · ${h.guildName}` : ''}{h.error ? ` — ${h.error}` : ''}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(h.at, timezone)}</span>
                </li>
              ))}
            </ul>
            <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </>
  );
}

export default function CommandsPage() {
  return (
    <>
      <PageHeader eyebrow="Fonctionnalités" title="Commandes" description="Catalogue des commandes réellement enregistrées par ClashBot, avec activation par serveur." />
      <Tabs defaultValue="catalog">
        <TabsList><TabsTrigger value="catalog">Catalogue</TabsTrigger><TabsTrigger value="history">Historique</TabsTrigger></TabsList>
        <TabsContent value="catalog" className="mt-4"><Catalog /></TabsContent>
        <TabsContent value="history" className="mt-4"><History /></TabsContent>
      </Tabs>
    </>
  );
}
