import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@project/components/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@project/components/ui/tooltip';
import { NAV, BrandIcon } from './nav';

export function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
        <BrandIcon className="h-5 w-5" />
      </span>
      {!collapsed && <div className="leading-tight"><p className="font-semibold tracking-tight">ClashBot</p><p className="text-[11px] text-muted-foreground">Panel d'administration</p></div>}
    </div>
  );
}

export function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <TooltipProvider delayDuration={100}>
      <nav className="space-y-5">
        {NAV.map((g) => (
          <div key={g.title}>
            {!collapsed ? <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{g.title}</p> : <div className="mx-3 mb-2 border-t" />}
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const link = (
                  <NavLink to={i.to} end={i.to === '/'} onClick={onNavigate}
                    className={({ isActive }) => cn(
                      'group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                      collapsed && 'justify-center px-0',
                    )}>
                    <i.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{i.label}</span>}
                  </NavLink>
                );
                return (
                  <li key={i.to}>
                    {collapsed ? <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{i.label}</TooltipContent></Tooltip> : link}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex', collapsed ? 'w-[72px]' : 'w-64')}>
      <div className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-0')}><Brand collapsed={collapsed} /></div>
      <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar"><NavList collapsed={collapsed} /></div>
      <button onClick={onToggle} className="flex h-12 items-center justify-center gap-2 border-t text-sm text-muted-foreground transition hover:text-foreground"
        aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}>
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" />Replier</>}
      </button>
    </aside>
  );
}
