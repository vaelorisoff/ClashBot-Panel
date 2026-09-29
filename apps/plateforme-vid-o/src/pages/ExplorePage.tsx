import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { browse } from 'zitejs/api';
import { cn } from '@project/components/lib/utils';
import { useLoad } from '../lib/useLoad';
import { VideoGrid, EmptyState } from '../components/VideoCard';

export default function ExplorePage() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const sort = params.get('tri') === 'populaire' ? 'popular' : 'recent';
  const { data, loading } = useLoad(() => browse({ view: 'explore', category, sort }), [category, sort]);
  const current = data?.categories?.find((c) => c.slug === category);

  const chip = (active: boolean) => cn(
    'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
    active ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent',
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Explorer</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{current?.name ?? 'Toutes les vidéos'}</h1>
        </div>
        <div className="flex rounded-full bg-secondary p-1 text-sm">
          {(['recent', 'popular'] as const).map((s) => (
            <button key={s} onClick={() => setParams(s === 'popular' ? { tri: 'populaire' } : {})}
              className={cn('rounded-full px-4 py-1.5 font-medium transition', sort === s ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground')}>
              {s === 'recent' ? 'Récentes' : 'Populaires'}
            </button>
          ))}
        </div>
      </div>
      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 lg:-mx-6 lg:px-6">
        <Link to={`/explorer${sort === 'popular' ? '?tri=populaire' : ''}`} className={chip(!category)}>Tous</Link>
        {data?.categories?.map((c) => (
          <Link key={c.id} to={`/explorer/${c.slug}${sort === 'popular' ? '?tri=populaire' : ''}`} className={chip(c.slug === category)}>{c.name}</Link>
        ))}
      </div>
      <VideoGrid
        videos={data?.videos}
        loading={loading}
        empty={<EmptyState icon={<Compass className="h-6 w-6" />} title="Rien ici pour le moment" text="Aucune vidéo n'a encore été publiée dans cette catégorie." />}
      />
    </div>
  );
}
