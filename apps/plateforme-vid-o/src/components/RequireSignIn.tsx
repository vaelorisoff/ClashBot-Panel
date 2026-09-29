import type { ReactNode } from 'react';
import { loginWithRedirect } from 'zitejs/auth';
import { Lock } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { useSession } from '../context/Session';
import { EmptyState } from './VideoCard';

export default function RequireSignIn({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  const { profile, isLoading } = useSession();
  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!profile) {
    return <EmptyState icon={<Lock className="h-6 w-6" />} title={title} text={text}
      action={<Button className="rounded-full" onClick={() => loginWithRedirect()}>Se connecter</Button>} />;
  }
  return <>{children}</>;
}
