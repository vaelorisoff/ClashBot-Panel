import { useEffect, useRef, useState } from 'react';
import { usePlayer, type PlayerVideo } from '../context/Player';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookmark, Heart, Play, ListPlus, Pencil, Share2, Trash2, Film } from 'lucide-react';
import { toast } from 'sonner';
import { browse, interact } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { cn } from '@project/components/lib/utils';
import { useLoad } from '../lib/useLoad';
import { useSession } from '../context/Session';
import { errorMessage, formatCount, formatDate, SITE_NAME } from '../lib/config';
import { UserAvatar, VideoCard, EmptyState } from '../components/VideoCard';
import FollowButton from '../components/FollowButton';
import Comments from '../components/Comments';
import PlaylistDialog from '../components/PlaylistDialog';

function ActionButton({ active, onClick, icon, label }: { active?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn(
      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      active ? 'bg-primary/15 text-primary' : 'bg-secondary text-secondary-foreground hover:bg-accent',
    )}>{icon}{label}</button>
  );
}

function StandardInfo({ title, hasYouTube }: { title: string; hasYouTube: boolean }) {
  const rows = [['Hébergé par', 'Nexia'], ['En lien avec', 'Astreyon Records'], ...(hasYouTube ? [['Source', 'YouTube']] : []), ['Titre', title]];
  return (
    <dl className="grid gap-1.5 rounded-xl border border-border/60 bg-background/40 p-4 text-sm">
      {rows.map(([k, val]) => (
        <div key={k} className="flex gap-2"><dt className="shrink-0 text-muted-foreground">{k} :</dt><dd className="min-w-0 break-words font-medium">{val}</dd></div>
      ))}
    </dl>
  );
}

function VideoStage({ video }: { video: PlayerVideo }) {
  const { current, play, setAnchor } = usePlayer();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setAnchor(video.id, ref.current);
    return () => setAnchor(null, null);
  }, [video.id, setAnchor]);
  const active = current?.id === video.id;
  return (
    <div ref={ref} className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-border/60">
      {!active && (
        <button onClick={() => play(video)} aria-label={`Lire ${video.title}`} className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none">
          <img src={video.youTubeId ? `https://i.ytimg.com/vi/${video.youTubeId}/maxresdefault.jpg` : video.thumbnailUrl} onError={(e) => { if (e.currentTarget.src !== video.thumbnailUrl) e.currentTarget.src = video.thumbnailUrl; }}
            alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
          <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition group-hover:scale-110">
            <Play className="ml-1 h-8 w-8 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}

export default function WatchPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile, isAdmin, requireAuth } = useSession();
  const { data, setData, loading } = useLoad(() => browse({ view: 'video', id }), [id, profile?.userId]);
  const [plOpen, setPlOpen] = useState(false);
  const [followers, setFollowers] = useState<number | null>(null);

  if (loading) {
    return <div className="grid gap-8 lg:grid-cols-[1fr_380px]"><Skeleton className="aspect-video rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
  }
  const v = data?.video;
  if (!v || !data) {
    return <EmptyState icon={<Film className="h-6 w-6" />} title="Vidéo indisponible" text="Cette vidéo n'existe pas ou a été retirée de la plateforme." action={<Button asChild><Link to="/explorer">Explorer</Link></Button>} />;
  }
  const viewer = data.viewer ?? { liked: false, favorited: false, following: false };
  const canManage = !!profile && (profile.userId === v.uploaderId || isAdmin);

  const toggle = async (kind: 'liked' | 'favorited') => {
    if (!requireAuth(kind === 'liked' ? "Connectez-vous pour aimer cette vidéo." : 'Connectez-vous pour enregistrer cette vidéo.')) return;
    const next = !viewer[kind];
    const patch = (on: boolean) => setData((d) => d && d.video ? {
      ...d, viewer: { ...viewer, [kind]: on },
      video: kind === 'liked' ? { ...d.video, likeCount: d.video.likeCount + (on ? 1 : -1) } : d.video,
    } : d);
    patch(next);
    try {
      await interact({ action: kind === 'liked' ? 'toggleLike' : 'toggleFavorite', videoId: v.id });
      if (kind === 'favorited') toast(next ? 'Ajoutée à vos favoris' : 'Retirée de vos favoris');
    } catch (e) { patch(!next); toast.error(errorMessage(e)); }
  };

  const share = async () => {
    const url = `${window.location.origin}/v/${v.id}`;
    if (navigator.share) { try { await navigator.share({ title: v.title, url }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(url);
    toast.success('Lien de la vidéo copié');
  };

  const remove = async () => {
    try { await interact({ action: 'deleteVideo', id: v.id }); toast('Vidéo supprimée'); navigate('/'); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <VideoStage video={v} />

        <div>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{v.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatCount(v.views)} vues sur {SITE_NAME} · {formatDate(v.createdAt)}{v.categoryName && <> · <Link className="hover:text-primary" to={`/explorer/${v.categorySlug}`}>{v.categoryName}</Link></>}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={v.uploaderUsername ? `/u/${v.uploaderUsername}` : '#'}><UserAvatar src={v.uploaderAvatar} name={v.uploaderName} className="h-11 w-11" /></Link>
            <div>
              <Link to={v.uploaderUsername ? `/u/${v.uploaderUsername}` : '#'} className="font-semibold hover:text-primary">{v.uploaderName}</Link>
              <p className="text-xs text-muted-foreground">{formatCount(followers ?? data.uploaderFollowers ?? 0)} abonnés</p>
            </div>
            {v.uploaderId && (
              <FollowButton key={`${v.id}-${viewer.following}`} creatorId={v.uploaderId} initial={viewer.following} className="ml-2"
                onChange={(f) => setFollowers((followers ?? data.uploaderFollowers ?? 0) + (f ? 1 : -1))} />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton active={viewer.liked} onClick={() => toggle('liked')} icon={<Heart className={cn('h-4 w-4', viewer.liked && 'fill-current')} />} label={`J'aime · ${formatCount(v.likeCount)}`} />
            <ActionButton active={viewer.favorited} onClick={() => toggle('favorited')} icon={<Bookmark className={cn('h-4 w-4', viewer.favorited && 'fill-current')} />} label={viewer.favorited ? 'Enregistrée' : 'Enregistrer'} />
            <ActionButton onClick={() => requireAuth('Connectez-vous pour gérer vos playlists.') && setPlOpen(true)} icon={<ListPlus className="h-4 w-4" />} label="Playlist" />
            <ActionButton onClick={share} icon={<Share2 className="h-4 w-4" />} label="Partager" />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
          <p className="text-sm"><span className="text-muted-foreground">Créateur original :</span> <span className="font-semibold">{v.creatorName}</span></p>
          {v.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{v.description}</p>}
          <StandardInfo title={v.title} hasYouTube={!!v.youTubeId} />
          <p className="text-xs text-muted-foreground/70">Les J'aime et commentaires affichés ici sont propres à {SITE_NAME}.</p>
          {canManage && (
            <div className="flex gap-2 border-t border-border/60 pt-4">
              <Button variant="secondary" size="sm" asChild><Link to={`/publier/${v.id}`}><Pencil className="mr-1.5 h-4 w-4" />Modifier</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="mr-1.5 h-4 w-4" />Supprimer</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer cette publication ?</AlertDialogTitle>
                    <AlertDialogDescription>La vidéo sera retirée de {SITE_NAME}. Cette action est définitive.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={remove}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <Comments key={v.id} videoId={v.id} initial={data.comments ?? []} />
      </div>

      <aside className="space-y-4">
        <h2 className="text-lg font-bold">À regarder ensuite</h2>
        {data.recommended?.map((r) => <VideoCard key={r.id} video={r} compact />)}
        {!data.recommended?.length && <p className="text-sm text-muted-foreground">Pas encore d'autres vidéos.</p>}
      </aside>

      <PlaylistDialog videoId={v.id} open={plOpen} onOpenChange={setPlOpen} />
    </div>
  );
}
