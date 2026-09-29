import { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { interact } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import { useSession } from '../context/Session';
import { errorMessage } from '../lib/config';

export default function FollowButton({ creatorId, initial, onChange, className }: {
  creatorId: string; initial: boolean; onChange?: (following: boolean) => void; className?: string;
}) {
  const { profile, requireAuth } = useSession();
  const [following, setFollowing] = useState(initial);
  if (profile?.userId === creatorId) return null;

  const toggle = async () => {
    if (!requireAuth('Connectez-vous pour suivre ce créateur.')) return;
    const next = !following;
    setFollowing(next); onChange?.(next);
    try { await interact({ action: 'toggleFollow', creatorId }); }
    catch (e) { setFollowing(!next); onChange?.(!next); toast.error(errorMessage(e)); }
  };

  return (
    <Button onClick={toggle} variant={following ? 'secondary' : 'default'} className={cn('rounded-full', className)}>
      {following ? <><Check className="mr-1.5 h-4 w-4" />Abonné</> : <><UserPlus className="mr-1.5 h-4 w-4" />Suivre</>}
    </Button>
  );
}
