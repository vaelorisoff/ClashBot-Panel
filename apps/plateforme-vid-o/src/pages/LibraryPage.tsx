import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Clock, Heart, ListVideo, Users, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { me, interact } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { useLoad } from '../lib/useLoad';
import { errorMessage, timeAgo } from '../lib/config';
import { VideoCard, VideoGrid, EmptyState, UserAvatar } from '../components/VideoCard';
import RequireSignIn from '../components/RequireSignIn';
import { PlaylistGrid } from './ProfilePage';
import { useSession } from '../context/Session';

function Library() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') ?? 'historique';
  const { data, setData, loading } = useLoad(() => me({ section: 'library' }), []);

  const removeHistory = async (historyId: string) => {
    const prev = data;
    setData((d) => (d && { ...d, history: d.history?.filter((h) => h.historyId !== historyId) }) as typeof d);
    try { await interact({ action: 'removeHistory', id: historyId }); }
    catch (e) { setData(prev); toast.error(errorMessage(e)); }
  };
  const clearHistory = async () => {
    try { await interact({ action: 'clearHistory' }); setData((d) => (d && { ...d, history: [] }) as typeof d); toast('Historique effacé'); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Bibliothèque</p>
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Votre espace</h1>
      <Tabs value={tab} onValueChange={(v) => setParams({ onglet: v })} className="mt-6">
        <TabsList className="no-scrollbar h-auto max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="historique"><Clock className="mr-1.5 h-4 w-4" />Historique</TabsTrigger>
          <TabsTrigger value="jaime"><Heart className="mr-1.5 h-4 w-4" />J'aime</TabsTrigger>
          <TabsTrigger value="favoris"><Bookmark className="mr-1.5 h-4 w-4" />Favoris</TabsTrigger>
          <TabsTrigger value="playlists"><ListVideo className="mr-1.5 h-4 w-4" />Playlists</TabsTrigger>
          <TabsTrigger value="abonnements"><Users className="mr-1.5 h-4 w-4" />Abonnements</TabsTrigger>
        </TabsList>

        <TabsContent value="historique" className="mt-6">
          {!!data?.history?.length && (
            <div className="mb-4 flex justify-end"><Button variant="ghost" size="sm" onClick={clearHistory}><Trash2 className="mr-1.5 h-4 w-4" />Effacer l'historique</Button></div>
          )}
          {loading ? <VideoGrid loading /> : data?.history?.length ? (
            <div className="max-w-3xl space-y-4">
              {data.history.map((h) => (
                <div key={h.historyId}>
                  <p className="mb-1 text-xs text-muted-foreground">Regardée {timeAgo(h.watchedAt)}</p>
                  <VideoCard video={h} compact action={
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeHistory(h.historyId)} aria-label="Retirer"><X className="h-4 w-4" /></Button>
                  } />
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<Clock className="h-6 w-6" />} title="Historique vide" text="Les vidéos que vous regardez apparaîtront ici." />}
        </TabsContent>
        <TabsContent value="jaime" className="mt-6">
          <VideoGrid videos={data?.liked} loading={loading} empty={<EmptyState icon={<Heart className="h-6 w-6" />} title="Aucun J'aime" text="Aimez des vidéos pour les retrouver ici." />} />
        </TabsContent>
        <TabsContent value="favoris" className="mt-6">
          <VideoGrid videos={data?.favorites} loading={loading} empty={<EmptyState icon={<Bookmark className="h-6 w-6" />} title="Aucun favori" text="Enregistrez des vidéos pour les regarder plus tard." />} />
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
          {loading ? <VideoGrid loading /> : data?.playlists?.length ? <PlaylistGrid playlists={data.playlists} />
            : <EmptyState icon={<ListVideo className="h-6 w-6" />} title="Aucune playlist" text="Créez une playlist depuis le bouton « Playlist » d'une vidéo." />}
        </TabsContent>
        <TabsContent value="abonnements" className="mt-6">
          <CreatorList creators={data?.following ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CreatorList({ creators }: { creators: { userId: string; username: string; displayName: string; avatarUrl: string | null }[] }) {
  if (!creators.length) return <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun abonnement" text="Suivez des créateurs pour voir leurs nouvelles vidéos." action={<Button asChild variant="secondary"><Link to="/explorer">Découvrir des vidéos</Link></Button>} />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {creators.map((c) => (
        <Link key={c.userId} to={`/u/${c.username}`} className="flex flex-col items-center rounded-2xl border border-border/50 bg-card/60 p-5 text-center transition hover:border-primary/40">
          <UserAvatar src={c.avatarUrl} name={c.displayName} className="h-16 w-16" />
          <p className="mt-3 w-full truncate font-semibold">{c.displayName}</p>
          <p className="text-xs text-muted-foreground">@{c.username}</p>
        </Link>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const { profile } = useSession();
  return (
    <RequireSignIn title="Votre bibliothèque" text="Connectez-vous pour retrouver votre historique, vos J'aime, favoris et playlists.">
      <Library key={profile?.userId} />
    </RequireSignIn>
  );
}
