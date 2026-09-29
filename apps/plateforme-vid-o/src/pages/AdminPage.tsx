import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Film, Heart, MessageSquare, Plus, Shield, ShieldOff, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { admin, interact } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Badge } from '@project/components/ui/badge';
import { Skeleton } from '@project/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { useLoad } from '../lib/useLoad';
import { useSession } from '../context/Session';
import { errorMessage, formatDate, timeAgo } from '../lib/config';
import { EmptyState } from '../components/VideoCard';

function Confirm({ title, onConfirm, children }: { title: string; onConfirm: () => void; children: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>Cette action est définitive.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Confirmer</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { profile } = useSession();
  const { data, loading, reload } = useLoad(() => admin({ action: 'overview' }), []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState({ name: '', sortOrder: '' });

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); reload(true); } catch (e) { toast.error(errorMessage(e)); }
  };
  const match = (...s: string[]) => !q || s.some((x) => x.toLowerCase().includes(q.toLowerCase()));

  if (loading || !data) return <Skeleton className="h-96 rounded-3xl" />;
  const s = data.stats!;

  return (
    <div className="space-y-8">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Shield className="h-4 w-4" />Administration</p>
        <h1 className="mt-1 text-3xl font-extrabold">Gestion de la plateforme</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Membres" value={s.users} />
        <Stat icon={<Film className="h-4 w-4" />} label="Vidéos" value={s.videos} />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="Commentaires" value={s.comments} />
        <Stat icon={<Heart className="h-4 w-4" />} label="J'aime" value={s.likes} />
      </div>

      <Tabs defaultValue="videos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="videos">Vidéos</TabsTrigger>
            <TabsTrigger value="comments">Commentaires</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>
          <Input placeholder="Filtrer…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        </div>

        <TabsContent value="videos" className="mt-4 overflow-x-auto rounded-2xl border border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Publié par</TableHead><TableHead>Vues</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.videos!.filter((v) => match(v.title, v.uploaderName)).map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="max-w-xs"><Link to={`/v/${v.id}`} className="line-clamp-1 font-medium hover:text-primary">{v.title}</Link><span className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</span></TableCell>
                  <TableCell>{v.uploaderName}</TableCell>
                  <TableCell>{v.views}</TableCell>
                  <TableCell><Badge variant={v.status === 'Masquée' ? 'destructive' : 'secondary'}>{v.status}</Badge></TableCell>
                  <TableCell className="space-x-1 whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => run(() => admin({ action: 'setVideoStatus', id: v.id, status: v.status === 'Masquée' ? 'published' : 'hidden' }), 'Statut mis à jour')}>
                      {v.status === 'Masquée' ? <><Eye className="mr-1 h-4 w-4" />Rétablir</> : <><EyeOff className="mr-1 h-4 w-4" />Masquer</>}
                    </Button>
                    <Confirm title="Supprimer cette vidéo ?" onConfirm={() => run(() => interact({ action: 'deleteVideo', id: v.id }), 'Vidéo supprimée')}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </Confirm>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="comments" className="mt-4 overflow-x-auto rounded-2xl border border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Commentaire</TableHead><TableHead>Auteur</TableHead><TableHead>Vidéo</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.comments!.filter((c) => match(c.content, c.userName, c.videoTitle)).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-md"><p className="line-clamp-2">{c.content}</p><span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span></TableCell>
                  <TableCell>{c.userName}</TableCell>
                  <TableCell className="max-w-[200px]"><Link to={`/v/${c.videoId}`} className="line-clamp-1 hover:text-primary">{c.videoTitle}</Link></TableCell>
                  <TableCell className="text-right">
                    <Confirm title="Supprimer ce commentaire ?" onConfirm={() => run(() => interact({ action: 'deleteComment', id: c.id }), 'Commentaire supprimé')}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </Confirm>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="users" className="mt-4 overflow-x-auto rounded-2xl border border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Membre</TableHead><TableHead>E-mail</TableHead><TableHead>Vidéos</TableHead><TableHead>Rôle</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.users!.filter((u) => match(u.displayName, u.username, u.email)).map((u) => (
                <TableRow key={u.profileId}>
                  <TableCell><Link to={`/u/${u.username}`} className="font-medium hover:text-primary">{u.displayName}</Link><p className="text-xs text-muted-foreground">@{u.username} · {formatDate(u.createdAt)}</p></TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.videoCount}</TableCell>
                  <TableCell><Badge variant={u.role === 'Administrateur' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
                  <TableCell className="text-right">
                    {u.userId !== profile?.userId && (
                      <Button size="sm" variant="ghost" onClick={() => run(() => admin({ action: 'setRole', id: u.profileId, role: u.role === 'Administrateur' ? 'user' : 'admin' }), 'Rôle mis à jour')}>
                        {u.role === 'Administrateur' ? <><ShieldOff className="mr-1 h-4 w-4" />Retirer admin</> : <><Shield className="mr-1 h-4 w-4" />Rendre admin</>}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-card/70 p-4">
            <Input placeholder="Nouvelle catégorie" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} className="max-w-xs" />
            <Input placeholder="Ordre" type="number" value={cat.sortOrder} onChange={(e) => setCat({ ...cat, sortOrder: e.target.value })} className="w-24" />
            <Button disabled={!cat.name.trim()} onClick={() => run(async () => { await admin({ action: 'saveCategory', name: cat.name, sortOrder: cat.sortOrder ? Number(cat.sortOrder) : undefined }); setCat({ name: '', sortOrder: '' }); }, 'Catégorie ajoutée')}>
              <Plus className="mr-1 h-4 w-4" />Ajouter
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Adresse</TableHead><TableHead>Ordre</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.categories!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">/explorer/{c.slug}</TableCell>
                    <TableCell>{c.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <Confirm title={`Supprimer « ${c.name} » ?`} onConfirm={() => run(() => admin({ action: 'deleteCategory', id: c.id }), 'Catégorie supprimée')}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </Confirm>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin, isLoading } = useSession();
  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;
  if (!isAdmin) return <EmptyState icon={<Shield className="h-6 w-6" />} title="Accès réservé" text="Cette section est réservée aux administrateurs de la plateforme." />;
  return <Dashboard />;
}
