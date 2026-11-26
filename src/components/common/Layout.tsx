import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import { fmtNumber, fmtPercent } from '../../utils/format';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: { title?: React.ReactNode; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn('rounded-2xl border bg-card shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon, change, hint }: { label: string; value: number | string | null; icon?: React.ReactNode; change?: number | null; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-[28px] font-semibold tabular-nums leading-none">{typeof value === 'number' ? fmtNumber(value) : value ?? '—'}</p>
      <div className="mt-2 flex h-4 items-center gap-1.5 text-xs">
        {change != null && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', change >= 0 ? 'text-success' : 'text-destructive')}>
            {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{fmtPercent(Math.abs(change))}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm text-muted-foreground">
      <span>{fmtNumber((page - 1) * pageSize + 1)}–{fmtNumber(Math.min(page * pageSize, total))} sur {fmtNumber(total)}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></Button>
        <span className="px-2 tabular-nums">{page} / {pages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export function StatusDot({ ok, pulse }: { ok: boolean | null; pulse?: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {pulse && ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', ok == null ? 'bg-muted-foreground/40' : ok ? 'bg-success' : 'bg-destructive')} />
    </span>
  );
}

export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  return src
    ? <img src={src} alt="" className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)} />
    : <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary', className)}>{name.slice(0, 2).toUpperCase()}</span>;
}

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>{children}</div>;
}
