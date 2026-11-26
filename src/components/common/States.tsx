import { Link } from 'react-router-dom';
import { AlertTriangle, Inbox, Lock, Plug, RefreshCw, ServerCrash, Wrench } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import { ApiError } from '../../services/http';
import { services } from '../../services/clashbot';
import { useAction } from '../../hooks/useApi';

function Frame({ icon, title, text, action, tone = 'muted', className }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode; tone?: 'muted' | 'warning' | 'error'; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center', className)}>
      <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl',
        tone === 'error' ? 'bg-destructive/10 text-destructive' : tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground')}>{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState({ title = 'Aucune donnée', text = 'Rien à afficher pour le moment.', action, icon }: { title?: string; text?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return <Frame icon={icon ?? <Inbox className="h-5 w-5" />} title={title} text={text} action={action} />;
}

function LoginButton() {
  const { run, pending } = useAction();
  return (
    <Button disabled={pending} onClick={() => run(async () => { const { url } = await services.system.loginUrl(); window.location.href = url; })}>
      Se connecter avec Discord
    </Button>
  );
}

export function ErrorState({ error, onRetry, compact }: { error: Error; onRetry?: () => void; compact?: boolean }) {
  const kind = error instanceof ApiError ? error.kind : 'server';
  const retry = onRetry && <Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button>;
  const cls = compact ? 'py-8' : undefined;
  if (kind === 'not_configured') {
    return <Frame className={cls} icon={<Plug className="h-5 w-5" />} tone="warning" title="Backend non connecté" text="Renseignez l'URL du backend ClashBot pour charger les données réelles."
      action={<Button asChild size="sm"><Link to="/parametres">Configurer la connexion</Link></Button>} />;
  }
  if (kind === 'not_implemented' || (kind === 'not_found' && error instanceof ApiError && error.status === 404 && !error.details)) {
    return <Frame className={cls} icon={<Wrench className="h-5 w-5" />} tone="warning" title="Intégration backend requise"
      text={`La route nécessaire n'est pas encore disponible côté ClashBot. Voir API.md pour son contrat.`} action={retry} />;
  }
  if (kind === 'unauthorized') return <Frame className={cls} icon={<Lock className="h-5 w-5" />} title="Connexion requise" text={error.message} action={<LoginButton />} />;
  if (kind === 'forbidden') return <Frame className={cls} icon={<Lock className="h-5 w-5" />} tone="error" title="Accès refusé" text={error.message} />;
  return <Frame className={cls} icon={kind === 'network' ? <ServerCrash className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />} tone="error" title="Chargement impossible" text={error.message} action={retry} />;
}

export function LoadingBlock({ rows = 4, className }: { rows?: number; className?: string }) {
  return <div className={cn('space-y-3', className)}>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>;
}

/** Enveloppe standard : chargement → erreur → vide → contenu. */
export function DataState<T>({ state, children, empty, isEmpty, skeleton }: {
  state: { data: T | null; error: Error | null; loading: boolean; reload: () => void };
  children: (data: T) => React.ReactNode;
  empty?: React.ReactNode;
  isEmpty?: (d: T) => boolean;
  skeleton?: React.ReactNode;
}) {
  if (state.loading && !state.data) return <>{skeleton ?? <LoadingBlock />}</>;
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={() => state.reload()} />;
  if (!state.data) return null;
  if (isEmpty?.(state.data)) return <>{empty ?? <EmptyState />}</>;
  return <>{children(state.data)}</>;
}

export function NotConfigured({ className }: { className?: string }) {
  return <span className={cn('text-sm italic text-muted-foreground', className)}>Non configuré</span>;
}
