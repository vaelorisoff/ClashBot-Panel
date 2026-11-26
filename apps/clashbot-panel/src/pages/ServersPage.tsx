import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { Search } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Badge } from '@project/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { Avatar, PageHeader, Pagination, Toolbar } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { fmtDate, fmtNumber } from '../utils/format';

export default function ServersPage() {
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('members');
  const [page, setPage] = useState(1);
  const state = useApi(() => services.guilds.list({ search: dq, status: status === 'all' ? undefined : status, sort, page, pageSize: 25 }), [dq, status, sort, page]);

  return (
    <>
      <PageHeader eyebrow="Communauté" title="Serveurs" description="Tous les serveurs Discord où ClashBot est ou a été installé." />
      <Toolbar>
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Nom ou identifiant…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous les états</SelectItem><SelectItem value="present">Bot présent</SelectItem><SelectItem value="absent">Bot retiré</SelectItem></SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="members">Plus de membres</SelectItem><SelectItem value="recent">Ajout récent</SelectItem><SelectItem value="name">Nom (A→Z)</SelectItem></SelectContent>
        </Select>
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucun serveur" text="Aucun serveur ne correspond à ces critères." />}>
        {(d) => (
          <>
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Serveur</TableHead><TableHead className="hidden md:table-cell">Identifiant</TableHead><TableHead className="text-right">Membres</TableHead><TableHead>Bot</TableHead><TableHead className="hidden lg:table-cell">Ajouté le</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.items.map((g) => (
                    <TableRow key={g.id} className="cursor-pointer">
                      <TableCell><Link to={`/serveurs/${g.id}`} className="flex items-center gap-3 font-medium hover:text-primary"><Avatar src={g.iconUrl} name={g.name} className="h-8 w-8" /><span className="truncate">{g.name}</span></Link></TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{g.id}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(g.memberCount)}</TableCell>
                      <TableCell>{g.botPresent ? <Badge className="bg-success/15 text-success hover:bg-success/15">Présent</Badge> : <Badge variant="secondary">Retiré</Badge>}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{fmtDate(g.joinedAt, undefined, false)}</TableCell>
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
