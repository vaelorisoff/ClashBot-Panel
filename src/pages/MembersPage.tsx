import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { Search } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { Avatar, PageHeader, Pagination, Toolbar } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { fmtDate, fmtNumber } from '../utils/format';

export default function MembersPage() {
  const { guilds, guildId } = useApp();
  const [gid, setGid] = useState<string>(guildId ?? 'all');
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [sort, setSort] = useState('active');
  const [page, setPage] = useState(1);
  const state = useApi(() => services.members.list({ guildId: gid === 'all' ? undefined : gid, search: dq, sort, page, pageSize: 25 }), [gid, dq, sort, page]);

  return (
    <>
      <PageHeader eyebrow="Communauté" title="Membres" description="Profils Discord connus de ClashBot. Seules les données autorisées par le backend sont affichées." />
      <Toolbar>
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pseudo ou identifiant…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <Select value={gid} onValueChange={(v) => { setGid(v); setPage(1); }}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72"><SelectItem value="all">Tous les serveurs</SelectItem>{guilds.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="active">Activité récente</SelectItem><SelectItem value="commands">Plus de commandes</SelectItem><SelectItem value="joined">Arrivée récente</SelectItem></SelectContent>
        </Select>
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucun membre" text="Aucun membre ne correspond à la recherche." />}>
        {(d) => (
          <>
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Membre</TableHead><TableHead className="hidden md:table-cell">Identifiant</TableHead><TableHead className="text-right">Commandes</TableHead><TableHead className="hidden text-right sm:table-cell">Niveau</TableHead><TableHead className="hidden lg:table-cell">Dernière activité</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.items.map((m) => (
                    <TableRow key={`${m.guildId}-${m.id}`}>
                      <TableCell><Link to={`/membres/${m.guildId}/${m.id}`} className="flex items-center gap-3 font-medium hover:text-primary"><Avatar src={m.avatarUrl} name={m.displayName || m.username} className="h-8 w-8" /><span className="min-w-0"><span className="block truncate">{m.displayName || m.username}</span><span className="block truncate text-xs font-normal text-muted-foreground">@{m.username}</span></span></Link></TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{m.id}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(m.commandCount)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{m.level ?? '—'}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{fmtDate(m.lastActiveAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </>
  );
}
