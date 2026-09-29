import { Link } from 'react-router-dom';
import { Ban, Bookmark, Eye, EyeOff, Film, FolderTree, HardDrive, Heart, ListVideo, MessageSquare, Shield, UserPlus, Users } from 'lucide-react';
import { admin } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { useLoad } from '../lib/useLoad';
import { useSession } from '../context/Session';
import { formatCount, timeAgo } from '../lib/config';
import { EmptyState } from '../components/VideoCard';
import { makeRun, Stat, type AdminData } from '../components/admin/shared';
import UsersPanel from '../components/admin/UsersPanel';
import VideosPanel from '../components/admin/VideosPanel';
import { CategoriesPanel, CommentsPanel } from '../components/admin/ModerationPanels';

function Overview({ data }: { data: AdminData }) {
  const s = data.stats!;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Membres" value={s.users} hint={`+${s.newUsers7d} cette semaine`} />
        <Stat icon={<Film className="h-4 w-4" />} label="Vidéos" value={s.videos} hint={`+${s.newVideos7d} cette semaine`} />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="Commentaires" value={s.comments} />
        <Stat icon={<FolderTree className="h-4 w-4" />} label="Catégories" value={s.categories} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Vues Nexia" value={s.views} />
        <Stat icon={<Heart className="h-4 w-4" />} label="J'aime" value={s.likes} />
        <Stat icon={<Bookmark className="h-4 w-4" />} label="Favoris" value={s.favorites} />
        <Stat icon={<ListVideo className="h-4 w-4" />} label="Playlists" value={s.playlists} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Shield className="h-4 w-4" />} label="Administrateurs" value={s.admins} />
        <Stat icon={<Ban className="h-4 w-4" />} label="Comptes suspendus" value={s.suspended} />
        <Stat icon={<EyeOff className="h-4 w-4" />} label="Vidéos masquées" value={s.hidden} />
        <Stat icon={<HardDrive className="h-4 w-4" />} label="Avec fichier Nexia" value={s.withFile} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Film className="h-4 w-4 text-primary" />Dernières publications</h3>
          {data.videos!.slice(0, 6).map((v) => (
            <Link key={v.id} to={`/v/${v.id}`} className="flex items-center justify-between gap-3 border-t border-border/40 py-2.5 text-sm first:border-0 hover:text-primary">
              <span className="min-w-0 truncate">{v.title}</span><span className="shrink-0 text-xs text-muted-foreground">{timeAgo(v.createdAt)}</span>
            </Link>
          ))}
          {!data.videos!.length && <p className="text-sm text-muted-foreground">Aucune vidéo.</p>}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" />Nouveaux membres</h3>
          {data.users!.slice(0, 6).map((u) => (
            <div key={u.profileId} className="flex items-center justify-between gap-3 border-t border-border/40 py-2.5 text-sm first:border-0">
              <span className="min-w-0 truncate">{u.displayName || u.username}</span><span className="shrink-0 text-xs text-muted-foreground">{formatCount(u.videoCount)} vidéo(s) · {timeAgo(u.createdAt)}</span>
            </div>
          ))}
          {!data.users!.length && <p className="text-sm text-muted-foreground">Aucun membre.</p>}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { profile } = useSession();
  const { data, loading, error, reload } = useLoad(() => admin({ action: 'overview' }), []);
  const run = makeRun(reload);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      </div>
    );
  }
  if (!data) return <EmptyState icon={<Shield className="h-6 w-6" />} title="Accès réservé" text={error ?? 'Impossible de charger l\'administration.'} />;

  const tabs = [
    ['overview', 'Tableau de bord'], ['users', `Utilisateurs · ${data.users!.length}`], ['videos', `Vidéos · ${data.videos!.length}`],
    ['comments', `Commentaires · ${data.comments!.length}`], ['categories', `Catégories · ${data.categories!.length}`],
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Shield className="h-4 w-4" />Administration</p>
        <h1 className="mt-1 text-3xl font-extrabold">Gestion de la plateforme</h1>
      </div>
      <Tabs defaultValue="overview">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <TabsList className="h-11 w-max">
            {tabs.map(([v, l]) => <TabsTrigger key={v} value={v} className="px-4">{l}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-6"><Overview data={data} /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersPanel users={data.users!} videos={data.videos!} selfId={profile?.userId} run={run} /></TabsContent>
        <TabsContent value="videos" className="mt-6"><VideosPanel videos={data.videos!} categories={data.categories!} run={run} /></TabsContent>
        <TabsContent value="comments" className="mt-6"><CommentsPanel comments={data.comments!} run={run} /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesPanel categories={data.categories!} run={run} /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin, isLoading } = useSession();
  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;
  // The UI gate is cosmetic; every admin action is re-checked server-side (requireAdmin).
  if (!isAdmin) return <EmptyState icon={<Shield className="h-6 w-6" />} title="Accès réservé" text="Cette section est réservée aux administrateurs de la plateforme." />;
  return <Dashboard />;
}
