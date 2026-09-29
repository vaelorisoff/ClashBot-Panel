import { useEffect, useState } from 'react';
import { Check, ListPlus, Loader2, Lock, Globe, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { interact, type InteractOutputType } from 'zitejs/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Switch } from '@project/components/ui/switch';
import { errorMessage } from '../lib/config';

type Pl = NonNullable<InteractOutputType['playlists']>[number];

export default function PlaylistDialog({ videoId, open, onOpenChange }: { videoId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [lists, setLists] = useState<Pl[] | null>(null);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLists(null);
    interact({ action: 'playlistsForVideo', videoId }).then((r) => setLists(r.playlists ?? [])).catch((e) => toast.error(errorMessage(e)));
  }, [open, videoId]);

  const toggle = async (pl: Pl) => {
    setLists((ls) => ls?.map((l) => (l.id === pl.id ? { ...l, contains: !l.contains } : l)) ?? null);
    try {
      const r = await interact({ action: 'togglePlaylistItem', playlistId: pl.id, videoId });
      toast(r.active ? `Ajoutée à « ${pl.name} »` : `Retirée de « ${pl.name} »`);
    } catch (e) {
      setLists((ls) => ls?.map((l) => (l.id === pl.id ? { ...l, contains: pl.contains } : l)) ?? null);
      toast.error(errorMessage(e));
    }
  };

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await interact({ action: 'createPlaylist', name, visibility: isPublic ? 'public' : 'private', videoId });
      setLists((ls) => [{ id: r.id ?? '', name, visibility: isPublic ? 'Public' : 'Privé', contains: true }, ...(ls ?? [])]);
      setName('');
      toast.success('Playlist créée');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ListPlus className="h-5 w-5 text-primary" />Ajouter à une playlist</DialogTitle></DialogHeader>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {lists === null ? (
            <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : lists.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Vous n'avez pas encore de playlist.</p>
          ) : lists.map((pl) => (
            <button key={pl.id} onClick={() => toggle(pl)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent">
              <span className={`grid h-5 w-5 place-items-center rounded-md border ${pl.contains ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                {pl.contains && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="flex-1 truncate text-sm font-medium">{pl.name}</span>
              {pl.visibility === 'Public' ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
            </button>
          ))}
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-semibold">Nouvelle playlist</p>
          <Input placeholder="Nom de la playlist" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={isPublic} onCheckedChange={setIsPublic} />Publique</label>
            <Button size="sm" onClick={create} disabled={!name.trim() || creating}>
              {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}Créer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
