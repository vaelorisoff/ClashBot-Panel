import { useState } from 'react';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { services } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import { Avatar, Pagination, Panel, Toolbar } from '../../components/common/Layout';
import { DataState, EmptyState } from '../../components/common/States';
import { fmtNumber } from '../../utils/format';
import { TransactionsView } from './Transactions';

type Account = { userId: string; username: string; avatarUrl?: string | null; wallet: number; bank: number; total: number };

function AdjustDialog({ guildId, account, onClose, onDone }: { guildId: string; account: Account; onClose: () => void; onDone: () => void }) {
  const [target, setTarget] = useState<'wallet' | 'bank'>('wallet');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const { run, pending } = useAction();
  const n = Number(amount);
  const valid = amount !== '' && Number.isFinite(n) && n !== 0 && Number.isInteger(n) && reason.trim().length >= 3;
  const submit = async () => {
    const r = await run(() => services.economy.adjust(guildId, account.userId, { target, amount: n, reason: reason.trim() }), 'Ajustement appliqué par le backend.');
    if (r) { onDone(); onClose(); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajuster le compte de {account.username}</DialogTitle><DialogDescription>L'opération est journalisée avec votre identité et le motif.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Tabs value={target} onValueChange={(v) => setTarget(v as 'wallet' | 'bank')}><TabsList className="w-full"><TabsTrigger value="wallet" className="flex-1">Portefeuille ({fmtNumber(account.wallet)})</TabsTrigger><TabsTrigger value="bank" className="flex-1">Banque ({fmtNumber(account.bank)})</TabsTrigger></TabsList></Tabs>
          <div className="space-y-1.5"><Label>Montant (négatif pour retirer)</Label><Input type="number" step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="ex. -500" /></div>
          <div className="space-y-1.5"><Label>Motif</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Obligatoire" /></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Annuler</Button><Button disabled={!valid || pending} onClick={submit}>{pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Appliquer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AccountsView({ guildId }: { guildId: string }) {
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('total');
  const state = useApi(() => services.economy.accounts(guildId, { search: dq, sort, page, pageSize: 25 }), [guildId, dq, sort, page]);
  const [adjust, setAdjust] = useState<Account | null>(null);
  const [history, setHistory] = useState<Account | null>(null);
  return (
    <>
      <Toolbar>
        <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un membre…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <Tabs value={sort} onValueChange={setSort}><TabsList className="h-9"><TabsTrigger value="total">Total</TabsTrigger><TabsTrigger value="wallet">Portefeuille</TabsTrigger><TabsTrigger value="bank">Banque</TabsTrigger></TabsList></Tabs>
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucun compte" text="Aucun membre n'a encore de compte économique sur ce serveur." />}>
        {(d) => (
          <>
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Membre</TableHead><TableHead className="text-right">Portefeuille</TableHead><TableHead className="text-right">Banque</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-48 text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.items.map((a, i) => (
                    <TableRow key={a.userId}>
                      <TableCell className="tabular-nums text-muted-foreground">{(d.page - 1) * d.pageSize + i + 1}</TableCell>
                      <TableCell><span className="flex items-center gap-2.5"><Avatar src={a.avatarUrl} name={a.username} className="h-7 w-7" /><span className="truncate font-medium">{a.username}</span></span></TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(a.wallet)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(a.bank)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmtNumber(a.total)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" onClick={() => setHistory(a)}>Historique</Button>
                        <Button variant="ghost" size="sm" onClick={() => setAdjust(a)}><SlidersHorizontal className="mr-1 h-3.5 w-3.5" />Ajuster</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
      {adjust && <AdjustDialog guildId={guildId} account={adjust} onClose={() => setAdjust(null)} onDone={() => state.reload(true)} />}
      <Dialog open={!!history} onOpenChange={(o) => !o && setHistory(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>Transactions de {history?.username}</DialogTitle></DialogHeader>
          {history && <TransactionsView guildId={guildId} userId={history.userId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LeaderboardView({ guildId }: { guildId: string }) {
  const [by, setBy] = useState<'total' | 'wallet' | 'bank'>('total');
  const state = useApi(() => services.economy.leaderboard(guildId, by), [guildId, by]);
  return (
    <Panel title="Classement financier" actions={<Tabs value={by} onValueChange={(v) => setBy(v as typeof by)}><TabsList className="h-8"><TabsTrigger value="total" className="text-xs">Total</TabsTrigger><TabsTrigger value="wallet" className="text-xs">Portefeuille</TabsTrigger><TabsTrigger value="bank" className="text-xs">Banque</TabsTrigger></TabsList></Tabs>}>
      <DataState state={state} isEmpty={(d) => !d.length} empty={<EmptyState title="Classement vide" />}>
        {(list) => (
          <ol className="space-y-1.5">
            {list.map((r, i) => (
              <li key={r.userId} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                <span className={`w-6 text-center font-semibold tabular-nums ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
                <Avatar src={r.avatarUrl} name={r.username} className="h-7 w-7" /><span className="flex-1 truncate">{r.username}</span>
                <span className="font-semibold tabular-nums">{fmtNumber(r.value)}</span>
              </li>
            ))}
          </ol>
        )}
      </DataState>
    </Panel>
  );
}
