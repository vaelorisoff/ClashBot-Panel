import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Globe, ListVideo, Lock, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { browse, interact } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Switch } from '@project/components/ui/switch';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { useLoad } from '../lib/useLoad';
import { useSession } from '../context/Session';
import { errorMessage } from '../lib/config';
import { VideoCard, EmptyState } from '../components/VideoCard';

export default function PlaylistPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useSession();
  const { data, setData, loading, reload } = useLoad(() => browse({ view: 'playlist', id }), [id, profile?.userId]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });

  if (loading) return <Skeleton className="h-64 rounded-3xl" />;
  const pl = data?.playlist;
  if (!pl) return <EmptyState icon={<Lock className="h-6 w-6" />} title="Playlist indisponible" text="Cette playlist n'existe pas ou est privée." />;
  const mine = profile?.userId === pl.ownerId;

  const openEdit = () => { setForm({ name: pl.name, description: pl.description, isPublic: pl.visibility === 'public' }); setEdit(true); };
  const save = async () => {
    try {
      await interact({ action: 'updatePlaylist', id: pl.id, name: form.name, description: form.description, visibility: form.isPublic ? 'public' : 'private' });
      setEdit(false); reload(true); toast.success('Playlist mise à jour');
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const remove = async () => {
    try { await interact({ action: 'deletePlaylist', id: pl.id }); toast('Playlist supprimée'); navigate('/bibliotheque?onglet=playlists'); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const removeVideo = async (videoId: string) => {
    setData((d) => (d && { ...d, videos: d.videos?.filter((v) => v.id !== videoId) }) as typeof d);
    try { await interact({ action: 'togglePlaylistItem', playlistId: pl.id, videoId }); }
    catch (e) { reload(true); toast.error(errorMessage(e)); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <aside className="h-fit rounded-3xl border border-border/60 bg-gradient-to-b from-primary/15 to-card p-6 lg:sticky lg:top-24">
        <div className="aspect-video overflow-hidden rounded-xl bg-muted">
          {pl.cover ? <img src={pl.cover} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ListVideo className="h-8 w-8 text-muted-foreground" /></div>}
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">{pl.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          par <Link to={pl.ownerUsername ? `/u/${pl.ownerUsername}` : '#'} className="text-foreground hover:text-primary">{pl.ownerName}</Link>
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {pl.visibility === 'public' ? <><Globe className="h-3.5 w-3.5" />Publique</> : <><Lock className="h-3.5 w-3.5" />Privée</>} · {data.videos?.length ?? 0} vidéos
        </p>
        {pl.description && <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/85">{pl.description}</p>}
        {mine && (
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="sm" onClick={openEdit}><Pencil className="mr-1.5 h-4 w-4" />Modifier</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="mr-1.5 h-4 w-4" />Supprimer</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Supprimer la playlist ?</AlertDialogTitle><AlertDialogDescription>Les vidéos ne seront pas supprimées de la plateforme.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={remove}>Supprimer</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </aside>

      <div className="space-y-4">
        {data.videos?.length ? data.videos.map((v, i) => (
          <div key={v.id} className="flex items-center gap-3">
            <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
            <div className="flex-1"><VideoCard video={v} compact action={mine && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeVideo(v.id)} aria-label="Retirer"><X className="h-4 w-4" /></Button>
            )} /></div>
          </div>
        )) : <EmptyState icon={<ListVideo className="h-6 w-6" />} title="Playlist vide" text="Ajoutez des vidéos depuis le bouton « Playlist » sur une page vidéo." />}
      </div>

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier la playlist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" />
            <Textarea value={form.description} rows={3} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.isPublic} onCheckedChange={(c) => setForm({ ...form, isPublic: c })} />Playlist publique</label>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEdit(false)}>Annuler</Button><Button onClick={save} disabled={!form.name.trim()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
