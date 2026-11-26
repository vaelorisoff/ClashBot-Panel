import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Coins, Landmark, Trophy, Wallet, XCircle } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Skeleton } from '@project/components/ui/skeleton';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { Avatar, Panel, StatCard } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { TransactionsTable } from './economy/Transactions';
import { fmtDate, fmtNumber } from '../utils/format';

export default function MemberDetailPage() {
  const { guildId = '', userId = '' } = useParams();
  const state = useApi(() => services.members.get(guildId, userId), [guildId, userId]);
  const { timezone } = useApp();
  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2"><Link to="/membres"><ArrowLeft className="mr-1.5 h-4 w-4" />Membres</Link></Button>
      <DataState state={state} skeleton={<Skeleton className="h-64 rounded-2xl" />}>
        {(m) => (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar src={m.avatarUrl} name={m.displayName || m.username} className="h-16 w-16 text-lg" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold">{m.displayName || m.username}</h1>
                <p className="font-mono text-xs text-muted-foreground">@{m.username} · {m.id} · arrivé le {fmtDate(m.joinedAt, timezone, false)}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Portefeuille" value={m.economy?.wallet ?? null} icon={<Wallet className="h-4 w-4" />} />
              <StatCard label="Banque" value={m.economy?.bank ?? null} icon={<Landmark className="h-4 w-4" />} />
              <StatCard label="Solde total" value={m.economy?.total ?? null} hint={m.economy?.rank ? `rang n°${m.economy.rank}` : undefined} icon={<Coins className="h-4 w-4" />} />
              <StatCard label="Commandes" value={m.commandCount} hint={m.level != null ? `niveau ${m.level}` : undefined} icon={<Trophy className="h-4 w-4" />} />
            </div>
            <Tabs defaultValue="commands">
              <TabsList className="flex-wrap"><TabsTrigger value="commands">Commandes</TabsTrigger><TabsTrigger value="transactions">Transactions</TabsTrigger><TabsTrigger value="inventory">Inventaire</TabsTrigger><TabsTrigger value="achievements">Succès</TabsTrigger><TabsTrigger value="moderation">Modération</TabsTrigger><TabsTrigger value="roles">Rôles</TabsTrigger></TabsList>
              <TabsContent value="commands" className="mt-4">
                <Panel title="Historique des commandes" bodyClassName="p-0">
                  {m.commands.length ? <ul className="divide-y">{m.commands.map((c, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                      {c.success ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="flex-1 font-mono">/{c.name}</span><span className="text-xs text-muted-foreground">{fmtDate(c.at, timezone)}</span>
                    </li>))}</ul> : <div className="p-5"><EmptyState title="Aucune commande" /></div>}
                </Panel>
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">{m.transactions.length ? <TransactionsTable items={m.transactions} /> : <EmptyState title="Aucune transaction" />}</TabsContent>
              <TabsContent value="inventory" className="mt-4">
                {m.inventory.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{m.inventory.map((it) => (
                  <div key={it.itemId} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm"><span className="truncate font-medium">{it.name}</span><Badge variant="secondary">× {fmtNumber(it.quantity)}</Badge></div>))}</div>
                  : <EmptyState title="Inventaire vide" />}
              </TabsContent>
              <TabsContent value="achievements" className="mt-4">
                {m.achievements.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{m.achievements.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm"><Trophy className="h-4 w-4 text-warning" /><span className="flex-1 truncate font-medium">{a.name}</span><span className="text-xs text-muted-foreground">{fmtDate(a.unlockedAt, timezone, false)}</span></div>))}</div>
                  : <EmptyState title="Aucun succès débloqué" />}
              </TabsContent>
              <TabsContent value="moderation" className="mt-4">
                {m.moderation == null ? <EmptyState title="Non disponible" text="L'historique de modération n'est pas accessible avec vos permissions ou n'est pas fourni par le backend." />
                  : m.moderation.length ? <Panel title="Sanctions" bodyClassName="p-0"><ul className="divide-y">{m.moderation.map((s) => (
                    <li key={s.id} className="px-5 py-3 text-sm"><p><Badge variant="secondary" className="mr-2">{s.type}</Badge>{s.reason ?? 'Sans motif'}</p><p className="mt-1 text-xs text-muted-foreground">par {s.moderator} · {fmtDate(s.at, timezone)}</p></li>))}</ul></Panel>
                    : <EmptyState title="Aucune sanction" />}
              </TabsContent>
              <TabsContent value="roles" className="mt-4">
                {m.roles.length ? <div className="flex flex-wrap gap-2">{m.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}</div> : <EmptyState title="Aucun rôle" />}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DataState>
    </>
  );
}
