import { Users } from 'lucide-react';
import { me } from 'zitejs/api';
import { useLoad } from '../lib/useLoad';
import { VideoGrid, EmptyState, SectionTitle } from '../components/VideoCard';
import RequireSignIn from '../components/RequireSignIn';
import { CreatorList } from './LibraryPage';

function Feed() {
  const { data, loading } = useLoad(() => me({ section: 'library' }), []);
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Abonnements</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Les nouveautés de vos créateurs</h1>
      </div>
      <VideoGrid videos={data?.feed} loading={loading}
        empty={<EmptyState icon={<Users className="h-6 w-6" />} title="Rien de neuf" text="Suivez des créateurs de la plateforme pour voir leurs publications ici." />} />
      {!loading && !!data?.following?.length && (
        <section>
          <SectionTitle title="Créateurs suivis" />
          <CreatorList creators={data.following} />
        </section>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <RequireSignIn title="Vos abonnements" text="Connectez-vous pour suivre des créateurs et voir leurs nouvelles vidéos.">
      <Feed />
    </RequireSignIn>
  );
}
