import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Heart, Play, Plus, Search, Film } from 'lucide-react';
import { browse } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { useLoad } from '../lib/useLoad';
import { formatCount, SITE_NAME } from '../lib/config';
import { VideoCard, UserAvatar, SectionTitle, EmptyState, type Video } from '../components/VideoCard';
import { useSession } from '../context/Session';

function Hero({ video }: { video: Video }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl ring-1 ring-border/60"
    >
      <img src={`https://i.ytimg.com/vi/${video.youTubeId}/maxresdefault.jpg`} onError={(e) => { e.currentTarget.src = video.thumbnailUrl; }}
        alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent" />
      <div className="relative flex min-h-[340px] flex-col justify-end p-6 sm:min-h-[440px] sm:p-10 lg:max-w-2xl">
        <span className="mb-4 w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          À la une{video.categoryName ? ` · ${video.categoryName}` : ''}
        </span>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{video.title}</h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <UserAvatar src={video.uploaderAvatar} name={video.uploaderName} className="h-7 w-7" />
          <span className="text-foreground/90">{video.creatorName}</span>
          <span>·</span><span>{formatCount(video.views)} vues</span>
          <span>·</span><Heart className="h-3.5 w-3.5" /> {formatCount(video.likeCount)}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link to={`/v/${video.id}`}><Play className="mr-2 h-4 w-4 fill-current" />Regarder</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="rounded-full px-6">
            <Link to="/explorer"><Compass className="mr-2 h-4 w-4" />Explorer</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function Rail({ title, subtitle, videos, to }: { title: string; subtitle?: string; videos: Video[]; to?: string }) {
  if (!videos.length) return null;
  return (
    <section>
      <SectionTitle title={title} subtitle={subtitle} action={to && (
        <Link to={to} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">Tout voir <ArrowRight className="h-4 w-4" /></Link>
      )} />
      <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 lg:-mx-6 lg:px-6">
        {videos.map((v) => (
          <div key={v.id} className="w-[78%] shrink-0 snap-start sm:w-[42%] lg:w-[30%] 2xl:w-[23%]"><VideoCard video={v} /></div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data, loading } = useLoad(() => browse({ view: 'home' }), []);
  const { requireAuth, profile } = useSession();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-[400px] rounded-3xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}</div>
      </div>
    );
  }

  if (!data?.featured) {
    return (
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 sm:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <h1 className="relative max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Bienvenue sur {SITE_NAME}, la vidéo portée par sa communauté.
          </h1>
          <p className="relative mt-4 max-w-xl text-muted-foreground">
            Partagez vos vidéos YouTube préférées, aimez, commentez et suivez les créateurs de la plateforme.
          </p>
          <div className="relative mt-8 flex gap-3">
            <Button size="lg" className="rounded-full" onClick={() => requireAuth('Connectez-vous pour publier la première vidéo.') && navigate('/publier')}>
              <Plus className="mr-2 h-4 w-4" />Publier la première vidéo
            </Button>
          </div>
        </section>
        <EmptyState icon={<Film className="h-6 w-6" />} title="Aucune vidéo pour l'instant" text="Les vidéos publiées par la communauté apparaîtront ici." />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <Hero video={data.featured} />

      {!!data.categories?.length && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:-mx-6 lg:px-6">
          <Link to="/recherche" className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
            <Search className="h-4 w-4" /> Rechercher
          </Link>
          {data.categories.map((c) => (
            <Link key={c.id} to={`/explorer/${c.slug}`} className="shrink-0 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition hover:bg-primary hover:text-primary-foreground">
              {c.name} <span className="ml-1 opacity-60">{c.count}</span>
            </Link>
          ))}
        </div>
      )}

      <Rail title="Populaires" subtitle="Les vidéos les plus aimées et regardées sur la plateforme" videos={data.popular ?? []} to="/explorer?tri=populaire" />
      <Rail title={profile ? 'Recommandé pour vous' : 'À découvrir'} subtitle={profile ? 'Selon vos goûts et votre historique' : undefined} videos={data.recommended ?? []} />
      <Rail title="Récemment publiées" videos={data.recent ?? []} to="/explorer" />

      {!!data.creators?.length && (
        <section>
          <SectionTitle title="Créateurs populaires" subtitle={`Les membres les plus suivis sur ${SITE_NAME}`} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
            {data.creators.map((c) => (
              <Link key={c.userId} to={`/u/${c.username}`} className="group flex flex-col items-center rounded-2xl border border-border/50 bg-card/60 p-5 text-center transition hover:-translate-y-0.5 hover:border-primary/40">
                <UserAvatar src={c.avatarUrl} name={c.displayName} className="h-16 w-16 text-base" />
                <p className="mt-3 w-full truncate font-semibold group-hover:text-primary">{c.displayName}</p>
                <p className="text-xs text-muted-foreground">{formatCount(c.followers)} abonnés</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
