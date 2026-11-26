import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Input } from '@project/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { services } from '../../services/clashbot';
import { useApi } from '../../hooks/useApi';
import { useApp } from '../../contexts/AppContext';
import { Pagination, Toolbar } from '../../components/common/Layout';
import { DataState, EmptyState } from '../../components/common/States';
import { fmtDate, fmtNumber } from '../../utils/format';
import type { Transaction } from '../../types/api';

export const TX_TYPES: Record<string, string> = {
  daily: 'Journalier', streak: 'Série', message: 'Messages', voice: 'Vocal', work: 'Travail', mission: 'Mission', crime: 'Crime', rob: 'Vol',
  deposit: 'Dépôt', withdraw: 'Retrait', pay: 'Paiement', fee: 'Frais', shop: 'Boutique', sell: 'Vente', trade: 'Échange', game: 'Jeu',
  casino: 'Casino', lottery: 'Loterie', drop: 'Drop', achievement: 'Succès', admin: 'Ajustement admin',
};

export function TransactionsTable({ items }: { items: Transaction[] }) {
  const { timezone } = useApp();
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Membre</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Montant</TableHead><TableHead className="hidden text-right md:table-cell">Solde après</TableHead><TableHead className="hidden lg:table-cell">Motif</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(t.at, timezone)}</TableCell>
              <TableCell className="max-w-[160px] truncate">{t.username ?? t.userId}</TableCell>
              <TableCell>{TX_TYPES[t.type] ?? t.type}</TableCell>
              <TableCell className={`whitespace-nowrap text-right font-medium tabular-nums ${t.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                {t.direction === 'in' ? <ArrowDownLeft className="mr-1 inline h-3.5 w-3.5" /> : <ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />}
                {t.direction === 'in' ? '+' : '−'}{fmtNumber(Math.abs(t.amount))}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">{fmtNumber(t.balanceAfter)}</TableCell>
              <TableCell className="hidden max-w-[260px] truncate text-muted-foreground lg:table-cell">{t.reason ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TransactionsView({ guildId, userId }: { guildId: string; userId?: string }) {
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [type, setType] = useState('all');
  const [direction, setDirection] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const state = useApi(() => services.economy.transactions(guildId, {
    search: dq, userId, type: type === 'all' ? undefined : type, direction: direction === 'all' ? undefined : direction,
    from: from ? new Date(from).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined, page, pageSize: 30,
  }), [guildId, userId, dq, type, direction, from, to, page]);
  const reset = (fn: () => void) => { fn(); setPage(1); };
  return (
    <>
      <Toolbar>
        {!userId && <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Membre ou motif…" value={q} onChange={(e) => reset(() => setQ(e.target.value))} /></div>}
        <Select value={type} onValueChange={(v) => reset(() => setType(v))}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72"><SelectItem value="all">Tous les types</SelectItem>{Object.entries(TX_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={direction} onValueChange={(v) => reset(() => setDirection(v))}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Entrées et sorties</SelectItem><SelectItem value="in">Entrantes</SelectItem><SelectItem value="out">Sortantes</SelectItem></SelectContent></Select>
        <Input type="date" className="w-40" value={from} onChange={(e) => reset(() => setFrom(e.target.value))} aria-label="Du" />
        <Input type="date" className="w-40" value={to} onChange={(e) => reset(() => setTo(e.target.value))} aria-label="Au" />
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucune transaction" text="Aucune transaction ne correspond à ces filtres." />}>
        {(d) => <><TransactionsTable items={d.items} /><Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} /></>}
      </DataState>
    </>
  );
}
