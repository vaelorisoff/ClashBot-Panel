import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Film, ListVideo, Lock, Settings, UserX } from 'lucide-react';
import { browse, type BrowseOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { useLoad } from '../lib/useLoad';
import { useSession } from '../context/Session';
import { formatCount, formatDate } from '../lib/config';
import { UserAvatar, VideoGrid, EmptyState } from '../components/VideoCard';
import FollowButton from '../components/FollowButton';

type Playlist = NonNullable<BrowseOutputType['playlists']>[number];

export function PlaylistGrid({ playlists }: { playlists: Playlist[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {playlists.map((p) => (
        <Link key={p.id} to={`/playlist/${p.id}`} className="group">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
            {p.cover ? <img src={p.cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              : <div className="grid h-full place-items-center text-muted-foreground"><ListVideo className="h-8 w-8" /></div>}
            <div className="glass absolute inset-y-0 right-0 flex w-1/3 flex-col items-center justify-center gap-1 text-sm font-semibold">
              <ListVideo className="h-5 w-5" />{p.count}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 font-semibold group-hover:text-primary">
            {p.visibility === 'private' && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}{p.name}
          </p>
          {p.description && <p className="line-clamp-1 text-sm text-muted-foreground">{p.description}</p>}
        </Link>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { username = '' } = useParams();
  const { profile: me } = useSession();
  const { data, loading } = useLoad(() => browse({ view: 'profile', id: username }), [username, me?.userId]);
  const [delta, setDelta] = useState(0);

  if (loading) return <Skeleton className="h-64 rounded-3xl" />;
  const p = data?.profile;
  if (!p) return <EmptyState icon={<UserX className="h-6 w-6" />} title="Profil introuvable" text="Ce membre n'existe pas." />;
  const isMe = me?.userId === p.userId;

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card">
        <div className="h-32 bg-gradient-to-br from-primary/40 via-chart-4/20 to-transparent sm:h-44" />
        <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:px-8">
          <UserAvatar src={p.avatarUrl} name={p.displayName} className="-mt-14 h-28 w-28 text-2xl ring-4 ring-card" />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold">{p.displayName}</h1>
            <p className="text-sm text-muted-foreground">@{p.username}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span><b>{formatCount(p.followers + delta)}</b> <span className="text-muted-foreground">abonnés</span></span>
              <span><b>{formatCount(p.following)}</b> <span className="text-muted-foreground">abonnements</span></span>
              <span><b>{p.videoCount}</b> <span className="text-muted-foreground">vidéos</span></span>
              <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-4 w-4" />Membre depuis le {formatDate(p.createdAt)}</span>
            </div>
          </div>
          {isMe ? (
            <Button asChild variant="secondary" className="rounded-full"><Link to="/parametres"><Settings className="mr-1.5 h-4 w-4" />Modifier le profil</Link></Button>
          ) : (
            <FollowButton key={`${p.userId}-${data.isFollowing}`} creatorId={p.userId} initial={!!data.isFollowing} onChange={(f) => setDelta((d) => d + (f ? 1 : -1))} />
          )}
        </div>
        {p.bio && <p className="whitespace-pre-wrap px-6 pb-6 text-sm leading-relaxed text-foreground/85 sm:px-8">{p.bio}</p>}
      </section>

      <Tabs defaultValue="videos" className="mt-8">
        <TabsList>
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          <VideoGrid videos={data.videos} empty={<EmptyState icon={<Film className="h-6 w-6" />} title="Aucune vidéo publiée" text={isMe ? 'Publiez votre première vidéo depuis le bouton « Publier ».' : "Ce membre n'a encore rien publié."} />} />
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
          {data.playlists?.length ? <PlaylistGrid playlists={data.playlists} />
            : <EmptyState icon={<ListVideo className="h-6 w-6" />} title="Aucune playlist publique" text="Les playlists publiques apparaîtront ici." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
