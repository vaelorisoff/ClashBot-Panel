import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Play } from 'lucide-react';
import type { BrowseOutputType } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { formatCount, timeAgo } from '../lib/config';
import { cn } from '@project/components/lib/utils';
import type { ReactNode } from 'react';

export type Video = NonNullable<BrowseOutputType['recent']>[number];

export function VideoCard({ video, compact, action }: { video: Video; compact?: boolean; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group relative', compact && 'flex gap-3')}
    >
      <Link
        to={`/v/${video.id}`}
        className={cn(
          'relative block overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 outline-none focus-visible:ring-2 focus-visible:ring-primary',
          compact ? 'aspect-video w-40 shrink-0 sm:w-44' : 'aspect-video',
        )}
      >
        <img
          src={video.thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="absolute bottom-2 left-2 grid h-9 w-9 scale-90 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
          <Play className="h-4 w-4 fill-current" />
        </div>
        {video.categoryName && !compact && (
          <span className="glass absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/90">
            {video.categoryName}
          </span>
        )}
      </Link>
      <div className={cn('min-w-0', compact ? 'py-0.5' : 'mt-3 flex gap-3')}>
        {!compact && (
          <Link to={video.uploaderUsername ? `/u/${video.uploaderUsername}` : '#'} className="shrink-0">
            <UserAvatar src={video.uploaderAvatar} name={video.uploaderName} className="h-9 w-9" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/v/${video.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-primary">
            {video.title}
          </Link>
          <p className="mt-1 truncate text-sm text-muted-foreground">{video.creatorName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <span>{formatCount(video.views)} vues</span>
            <span>·</span>
            <Heart className="h-3 w-3" /> {formatCount(video.likeCount)}
            <span>·</span>
            <span>{timeAgo(video.createdAt)}</span>
          </p>
        </div>
        {action}
      </div>
    </motion.div>
  );
}

export function UserAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} className={cn('rounded-full object-cover ring-1 ring-border', className)} />
  ) : (
    <div className={cn('grid place-items-center rounded-full bg-gradient-to-br from-primary/80 to-chart-4/70 text-xs font-bold text-primary-foreground', className)}>
      {initials || '?'}
    </div>
  );
}

export function VideoGrid({ videos, loading, empty }: { videos?: Video[] | null; loading?: boolean; empty?: ReactNode }) {
  if (loading) {
    return (
      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  if (!videos?.length) return <>{empty}</>;
  return (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {videos.map((v) => <VideoCard key={v.id} video={v} />)}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
