import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Search, Trash2 } from 'lucide-react';
import { admin } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Badge } from '@project/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { formatCount, formatDate } from '../../lib/config';
import UploadField from '../UploadField';
import { Confirm, TableShell, Toolbar, type AdminCategory, type AdminVideo, type Run } from './shared';

function EditVideo({ video, categories, run, onClose }: { video: AdminVideo; categories: AdminCategory[]; run: Run; onClose: () => void }) {
  const [f, setF] = useState({
    title: video.title, description: video.description, creatorName: video.creatorName, categoryId: video.categoryId,
    status: video.status === 'Masquée' ? 'hidden' as const : 'published' as const,
    youtube: video.youTubeId ? `https://youtu.be/${video.youTubeId}` : '', videoFileUrl: video.videoFileUrl, thumbnailUrl: video.thumbnailUrl,
  });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const noSource = !f.youtube.trim() && !f.videoFileUrl;
  const save = async () => {
    setSaving(true);
    const ok = await run(() => admin({ action: 'updateVideo', id: video.id, ...f, categoryId: f.categoryId || undefined }), 'Vidéo mise à jour');
    setSaving(false);
    if (ok) onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Modifier la vidéo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Titre</Label><Input value={f.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Créateur</Label><Input value={f.creatorName} onChange={(e) => set({ creatorName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Catégorie</Label>
              <Select value={f.categoryId || undefined} onValueChange={(v) => set({ categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Visibilité</Label>
              <Select value={f.status} onValueChange={(v) => set({ status: v as 'published' | 'hidden' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="published">Publiée</SelectItem><SelectItem value="hidden">Masquée</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={4} value={f.description} onChange={(e) => set({ description: e.target.value })} /></div>
          <div className="space-y-2"><Label>Source YouTube</Label><Input value={f.youtube} placeholder="https://youtu.be/…" onChange={(e) => set({ youtube: e.target.value })} /></div>
          <div className="space-y-2"><Label>Fichier Nexia</Label><UploadField kind="video" value={f.videoFileUrl} onChange={(u) => set({ videoFileUrl: u })} onBusy={setBusy} /></div>
          <div className="space-y-2"><Label>Miniature</Label><UploadField kind="image" value={f.thumbnailUrl} onChange={(u) => set({ thumbnailUrl: u })} onBusy={setBusy} /></div>
          {noSource && <p className="text-sm text-destructive">La vidéo doit garder au moins une source.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={save} disabled={saving || busy || noSource || !f.title.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PAGE = 25;

export default function VideosPanel({ videos, categories, run }: { videos: AdminVideo[]; categories: AdminCategory[]; run: Run }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [cat, setCat] = useState('all');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const rows = videos.filter((v) =>
    (status === 'all' || (status === 'hidden') === (v.status === 'Masquée')) &&
    (cat === 'all' || v.categoryId === cat) &&
    (source === 'all' || (source === 'youtube' ? !!v.youTubeId : !!v.videoFileUrl)) &&
    (!q || [v.title, v.uploaderName, v.creatorName].some((x) => x.toLowerCase().includes(q.toLowerCase()))));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const editing = videos.find((v) => v.id === editId);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(0); };

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Titre, créateur, membre…" value={q} onChange={(e) => reset(setQ)(e.target.value)} />
        </div>
        <Select value={status} onValueChange={reset(setStatus)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous statuts</SelectItem><SelectItem value="published">Publiées</SelectItem><SelectItem value="hidden">Masquées</SelectItem></SelectContent></Select>
        <Select value={cat} onValueChange={reset(setCat)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={source} onValueChange={reset(setSource)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes sources</SelectItem><SelectItem value="youtube">YouTube</SelectItem><SelectItem value="file">Fichier Nexia</SelectItem></SelectContent></Select>
      </Toolbar>
      <TableShell empty={!rows.length}>
        <Table>
          <TableHeader><TableRow><TableHead>Vidéo</TableHead><TableHead className="hidden lg:table-cell">Membre</TableHead><TableHead className="hidden md:table-cell">Sources</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {shown.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="max-w-xs">
                  <p className="line-clamp-1 font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.categoryName || 'Sans catégorie'} · {formatCount(v.views)} vues · {formatDate(v.createdAt)}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{v.uploaderName}</TableCell>
                <TableCell className="hidden space-x-1 whitespace-nowrap md:table-cell">
                  {v.youTubeId && <Badge variant="secondary">YouTube</Badge>}
                  {v.videoFileUrl && <Badge variant="secondary">Fichier</Badge>}
                </TableCell>
                <TableCell><Badge variant={v.status === 'Masquée' ? 'destructive' : 'secondary'}>{v.status}</Badge></TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="Ouvrir"><Link to={`/v/${v.id}`}><ExternalLink className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Modifier" onClick={() => setEditId(v.id)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={v.status === 'Masquée' ? 'Rendre visible' : 'Masquer'}
                    onClick={() => run(() => admin({ action: 'setVideoStatus', id: v.id, status: v.status === 'Masquée' ? 'published' : 'hidden' }), v.status === 'Masquée' ? 'Vidéo visible' : 'Vidéo masquée')}>
                    {v.status === 'Masquée' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Confirm title="Supprimer cette vidéo ?" onConfirm={() => run(() => admin({ action: 'deleteVideo', id: v.id }), 'Vidéo supprimée')}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                  </Confirm>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>Page {page + 1} / {pages}</span>
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</Button>
          <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}
      {editing && <EditVideo video={editing} categories={categories} run={run} onClose={() => setEditId(null)} />}
    </div>
  );
}
