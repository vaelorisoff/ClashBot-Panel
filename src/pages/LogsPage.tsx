import { useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Input } from '@project/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Pagination, Toolbar } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { LogList } from '../components/common/LogList';

const DEFAULT_CATS = ['admin', 'config', 'transaction', 'message', 'error', 'discord', 'login', 'permission', 'module'];
const CAT_LABEL: Record<string, string> = { admin: 'Actions administratives', config: 'Configuration', transaction: 'Transactions', message: 'Envois de messages', error: 'Erreurs', discord: 'Événements Discord', login: 'Connexions', permission: 'Permissions', module: 'Modules' };

export default function LogsPage() {
  const { guilds } = useApp();
  const cats = useApi(services.logs.categories, []);
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [cat, setCat] = useState('all');
  const [level, setLevel] = useState('all');
  const [gid, setGid] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const state = useApi(() => services.logs.list({
    search: dq, category: cat === 'all' ? undefined : cat, level: level === 'all' ? undefined : level, guildId: gid === 'all' ? undefined : gid,
    from: from ? new Date(from).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined, page, pageSize: 50,
  }), [dq, cat, level, gid, from, to, page]);
  const r = (fn: () => void) => { fn(); setPage(1); };
  const categories = cats.data?.length ? cats.data : DEFAULT_CATS;

  return (
    <>
      <PageHeader eyebrow="Sécurité" title="Journaux" description="Journal en lecture seule, horodaté et conservé par le backend."
        actions={<span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" />Non modifiable</span>} />
      <Toolbar>
        <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => r(() => setQ(e.target.value))} /></div>
        <Select value={cat} onValueChange={(v) => r(() => setCat(v))}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les catégories</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{CAT_LABEL[c] ?? c}</SelectItem>)}</SelectContent></Select>
        <Select value={level} onValueChange={(v) => r(() => setLevel(v))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous niveaux</SelectItem><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Alerte</SelectItem><SelectItem value="error">Erreur</SelectItem></SelectContent></Select>
        <Select value={gid} onValueChange={(v) => r(() => setGid(v))}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent className="max-h-72"><SelectItem value="all">Tous les serveurs</SelectItem>{guilds.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
        <Input type="date" className="w-40" value={from} onChange={(e) => r(() => setFrom(e.target.value))} aria-label="Du" />
        <Input type="date" className="w-40" value={to} onChange={(e) => r(() => setTo(e.target.value))} aria-label="Au" />
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucune entrée" text="Aucun journal ne correspond à ces filtres." />}>
        {(d) => <><div className="rounded-2xl border bg-card px-4"><LogList entries={d.items} /></div><Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} /></>}
      </DataState>
    </>
  );
}
