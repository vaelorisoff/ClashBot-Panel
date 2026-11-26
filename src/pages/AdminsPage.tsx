import { useState } from 'react';
import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Badge } from '@project/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { services } from '../services/clashbot';
import { useAction, useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { Avatar, PageHeader, Panel, Pagination } from '../components/common/Layout';
import { DataState, EmptyState } from '../components/common/States';
import { Confirm } from '../components/common/Confirm';
import { LogList } from '../components/common/LogList';
import { fmtDate } from '../utils/format';

function AddDialog({ roles, onDone }: { roles: { key: string; name: string }[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const { run, pending } = useAction();
  const valid = /^\d{17,20}$/.test(userId.trim()) && role;
  const submit = async () => { if (await run(() => services.admins.add({ userId: userId.trim(), role }), 'Administrateur ajouté par le backend.')) { setOpen(false); setUserId(''); setRole(''); onDone(); } };
  return (
    <>
      <Button onClick={() => setOpen(true)}><UserPlus className="mr-1.5 h-4 w-4" />Ajouter</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un administrateur</DialogTitle><DialogDescription>Le backend vérifie que vous avez le droit d'attribuer ce rôle.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Identifiant Discord</Label><Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ex. 123456789012345678" className="font-mono" />
              {userId && !/^\d{17,20}$/.test(userId.trim()) && <p className="text-xs text-destructive">Identifiant Discord invalide (17 à 20 chiffres).</p>}</div>
            <div className="space-y-1.5"><Label>Rôle</Label><Select value={role || undefined} onValueChange={setRole}><SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={!valid || pending} onClick={submit}>{pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function History() {
  const [page, setPage] = useState(1);
  const state = useApi(() => services.logs.list({ category: 'permission', page, pageSize: 30 }), [page]);
  return (
    <DataState state={state} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Aucun changement d'accès" />}>
      {(d) => <><div className="rounded-2xl border bg-card px-4"><LogList entries={d.items} /></div><Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} /></>}
    </DataState>
  );
}

export default function AdminsPage() {
  const admins = useApi(services.admins.list, []);
  const roles = useApi(services.admins.roles, []);
  const { me } = useApp();
  const { run } = useAction();
  const roleName = (k: string) => roles.data?.find((r) => r.key === k)?.name ?? k;

  const changeRole = async (id: string, role: string, prev: string) => {
    admins.setData((d) => d && d.map((a) => (a.id === id ? { ...a, role } : a)));
    if (!(await run(() => services.admins.update(id, { role }), 'Rôle mis à jour.'))) admins.setData((d) => d && d.map((a) => (a.id === id ? { ...a, role: prev } : a)));
  };
  const remove = (id: string) => run(() => services.admins.remove(id), 'Accès retiré.').then((r) => r && admins.reload(true));

  return (
    <>
      <PageHeader eyebrow="Sécurité" title="Administrateurs" description="Accès au panel. Chaque permission est vérifiée par le backend, jamais uniquement par l'interface."
        actions={roles.data && <AddDialog roles={roles.data} onDone={() => admins.reload(true)} />} />
      <Tabs defaultValue="list">
        <TabsList><TabsTrigger value="list">Administrateurs</TabsTrigger><TabsTrigger value="roles">Rôles et permissions</TabsTrigger><TabsTrigger value="history">Historique</TabsTrigger></TabsList>
        <TabsContent value="list" className="mt-4">
          <DataState state={admins} isEmpty={(d) => !d.length} empty={<EmptyState title="Aucun administrateur" />}>
            {(list) => (
              <ul className="divide-y rounded-2xl border bg-card">
                {list.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Avatar src={a.avatarUrl} name={a.username} className="h-9 w-9" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.username}{a.id === me?.id && <Badge variant="secondary" className="ml-2 text-[10px]">vous</Badge>}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{a.id} · ajouté le {fmtDate(a.addedAt, undefined, false)}{a.addedBy ? ` par ${a.addedBy}` : ''}</p></div>
                    <Select value={a.role} onValueChange={(v) => changeRole(a.id, v, a.role)} disabled={a.id === me?.id || !roles.data}>
                      <SelectTrigger className="w-44"><SelectValue>{roleName(a.role)}</SelectValue></SelectTrigger>
                      <SelectContent>{roles.data?.map((r) => <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Confirm title={`Retirer l'accès de ${a.username} ?`} onConfirm={() => remove(a.id)}>
                      <Button variant="ghost" size="icon" className="text-destructive" disabled={a.id === me?.id} aria-label="Retirer"><Trash2 className="h-4 w-4" /></Button>
                    </Confirm>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <DataState state={roles} isEmpty={(d) => !d.length} empty={<EmptyState title="Aucun rôle défini" />}>
            {(list) => (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((r) => (
                  <Panel key={r.key} title={r.name} actions={<ShieldCheck className="h-4 w-4 text-primary" />}>
                    <div className="flex flex-wrap gap-1.5">{r.permissions.length ? r.permissions.map((p) => <Badge key={p} variant="secondary" className="font-mono text-[10px]">{p}</Badge>) : <span className="text-sm text-muted-foreground">Aucune permission</span>}</div>
                  </Panel>
                ))}
              </div>
            )}
          </DataState>
        </TabsContent>
        <TabsContent value="history" className="mt-4"><History /></TabsContent>
      </Tabs>
    </>
  );
}
