import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Loader2, Search, Shield, ShieldOff, UserCheck } from 'lucide-react';
import { admin } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Badge } from '@project/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@project/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { formatDate, formatCount } from '../../lib/config';
import { UserAvatar } from '../VideoCard';
import { Confirm, TableShell, Toolbar, type AdminUser, type AdminVideo, type Run } from './shared';

function UserSheet({ user, videos, selfId, run, onClose }: { user: AdminUser; videos: AdminVideo[]; selfId?: string; run: Run; onClose: () => void }) {
  const [form, setForm] = useState({ displayName: user.displayName, username: user.username, bio: user.bio });
  const [saving, setSaving] = useState(false);
  const self = user.userId === selfId;
  const isAdmin = user.role === 'Administrateur';
  const save = async () => {
    setSaving(true);
    await run(() => admin({ action: 'updateUser', id: user.profileId, ...form }), 'Profil mis à jour');
    setSaving(false);
  };
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <UserAvatar src={user.avatarUrl || null} name={user.displayName} className="h-12 w-12" />
            <div className="min-w-0">
              <SheetTitle className="truncate">{user.displayName || user.username}</SheetTitle>
              <SheetDescription className="truncate">{user.email} · inscrit le {formatDate(user.createdAt)}</SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant={isAdmin ? 'default' : 'secondary'}>{user.role}</Badge>
            {user.suspended && <Badge variant="destructive">Suspendu</Badge>}
            <Link to={`/u/${user.username}`} className="text-xs text-muted-foreground hover:text-primary">Voir le profil public →</Link>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2"><Label>Nom affiché</Label><Input value={form.displayName} maxLength={80} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
          <div className="space-y-2"><Label>Nom d'utilisateur</Label><Input value={form.username} maxLength={40} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <div className="space-y-2"><Label>Bio</Label><Textarea rows={3} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <Button onClick={save} disabled={saving || !form.username.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
        </div>

        {!self && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-6">
            <Button variant="secondary" onClick={() => run(() => admin({ action: 'setRole', id: user.profileId, role: isAdmin ? 'user' : 'admin' }), 'Rôle mis à jour')}>
              {isAdmin ? <><ShieldOff className="mr-2 h-4 w-4" />Retirer le rôle admin</> : <><Shield className="mr-2 h-4 w-4" />Rendre administrateur</>}
            </Button>
            {user.suspended ? (
              <Button variant="secondary" onClick={() => run(() => admin({ action: 'updateUser', id: user.profileId, suspended: false }), 'Compte réactivé')}>
                <UserCheck className="mr-2 h-4 w-4" />Réactiver le compte
              </Button>
            ) : (
              <Confirm title="Suspendre ce compte ?" text="Le membre ne pourra plus publier ni interagir tant que son compte est suspendu." onConfirm={() => run(() => admin({ action: 'updateUser', id: user.profileId, suspended: true }), 'Compte suspendu')}>
                <Button variant="ghost" className="text-destructive"><Ban className="mr-2 h-4 w-4" />Suspendre</Button>
              </Confirm>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-border/60 pt-6">
          <h3 className="mb-3 text-sm font-semibold">Publications ({videos.length})</h3>
          {videos.length ? (
            <ul className="space-y-2">
              {videos.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-2 text-sm">
                  <Link to={`/v/${v.id}`} className="min-w-0 truncate font-medium hover:text-primary">{v.title}</Link>
                  <span className="shrink-0 text-xs text-muted-foreground">{v.status === 'Masquée' ? 'Masquée' : `${formatCount(v.views)} vues`}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucune publication.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function UsersPanel({ users, videos, selfId, run }: { users: AdminUser[]; videos: AdminVideo[]; selfId?: string; run: Run }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'suspended'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = users.filter((u) =>
    (filter === 'all' || (filter === 'admin' ? u.role === 'Administrateur' : u.suspended)) &&
    (!q || [u.displayName, u.username, u.email].some((x) => x.toLowerCase().includes(q.toLowerCase()))));
  const open = users.find((u) => u.profileId === openId);

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Nom, @utilisateur, e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {(['all', 'admin', 'suspended'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'secondary'} className="rounded-full" onClick={() => setFilter(f)}>
            {{ all: 'Tous', admin: 'Administrateurs', suspended: 'Suspendus' }[f]}
          </Button>
        ))}
      </Toolbar>
      <TableShell empty={!rows.length}>
        <Table>
          <TableHeader><TableRow><TableHead>Membre</TableHead><TableHead className="hidden md:table-cell">E-mail</TableHead><TableHead>Vidéos</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.profileId} className="cursor-pointer" onClick={() => setOpenId(u.profileId)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar src={u.avatarUrl || null} name={u.displayName} className="h-8 w-8" />
                    <div className="min-w-0"><p className="truncate font-medium">{u.displayName || u.username}</p><p className="truncate text-xs text-muted-foreground">@{u.username}</p></div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{u.email}</TableCell>
                <TableCell className="tabular-nums">{u.videoCount}</TableCell>
                <TableCell className="space-x-1 whitespace-nowrap">
                  <Badge variant={u.role === 'Administrateur' ? 'default' : 'secondary'}>{u.role === 'Administrateur' ? 'Admin' : 'Membre'}</Badge>
                  {u.suspended && <Badge variant="destructive">Suspendu</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
      {open && <UserSheet key={open.profileId + open.role + open.suspended} user={open} videos={videos.filter((v) => v.uploaderId === open.userId)} selfId={selfId} run={run} onClose={() => setOpenId(null)} />}
    </div>
  );
}
