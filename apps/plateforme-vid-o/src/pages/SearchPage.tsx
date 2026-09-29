import { Link, useSearchParams } from 'react-router-dom';
import { SearchX, Search } from 'lucide-react';
import { browse } from 'zitejs/api';
import { useLoad } from '../lib/useLoad';
import { formatCount } from '../lib/config';
import { VideoGrid, EmptyState, UserAvatar } from '../components/VideoCard';

// Searches platform videos (title, creator, category, uploader).
// A YouTube Data API source could later be added as a separate result section here.
export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data, loading } = useLoad(() => browse({ view: 'search', q }), [q]);

  if (!q) {
    return <EmptyState icon={<Search className="h-6 w-6" />} title="Que cherchez-vous ?" text="Utilisez la barre de recherche en haut pour trouver des vidéos par titre, créateur ou catégorie." />;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground">Résultats pour</p>
        <h1 className="text-3xl font-extrabold">« {q} »</h1>
      </div>
      {!!data?.creators?.length && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Créateurs</h2>
          <div className="flex flex-wrap gap-3">
            {data.creators.map((c) => (
              <Link key={c.userId} to={`/u/${c.username}`} className="flex items-center gap-3 rounded-full border border-border/60 bg-card py-1.5 pl-1.5 pr-5 transition hover:border-primary/50">
                <UserAvatar src={c.avatarUrl} name={c.displayName} className="h-9 w-9" />
                <div><p className="text-sm font-semibold">{c.displayName}</p><p className="text-xs text-muted-foreground">{formatCount(c.followers)} abonnés</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-4 text-lg font-bold">Vidéos</h2>
        <VideoGrid videos={data?.videos} loading={loading}
          empty={<EmptyState icon={<SearchX className="h-6 w-6" />} title="Aucun résultat" text="Essayez avec d'autres mots-clés ou parcourez la page Explorer." />} />
      </section>
    </div>
  );
}
