import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Home, Library, LogOut, Plus, Search, Settings, Shield, User, Users, X } from 'lucide-react';
import { loginWithRedirect, logout } from 'zitejs/auth';
import { Button } from '@project/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@project/components/ui/dropdown-menu';
import { cn } from '@project/components/lib/utils';
import { useSession } from '../context/Session';
import { UserAvatar } from './VideoCard';
import { SITE_NAME } from '../lib/config';

export const NAV = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/explorer', label: 'Explorer', icon: Compass },
  { to: '/abonnements', label: 'Abonnements', icon: Users },
  { to: '/bibliotheque', label: 'Bibliothèque', icon: Library },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.45)]">
        <span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-current" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">{SITE_NAME}</span>
    </Link>
  );
}

function SearchBar({ className, onDone }: { className?: string; onDone?: () => void }) {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const navigate = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/recherche?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };
  return (
    <form onSubmit={submit} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une vidéo, un créateur, une catégorie…"
        className="h-11 w-full rounded-full border border-border/70 bg-muted/60 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-border focus:border-primary/60 focus:bg-muted focus:ring-4 focus:ring-primary/10"
      />
    </form>
  );
}

function UserMenu() {
  const { profile, isAdmin, isLoading } = useSession();
  if (!profile) {
    return (
      <Button onClick={() => loginWithRedirect()} disabled={isLoading} className="rounded-full">
        Se connecter
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
        <UserAvatar src={profile.avatarUrl} name={profile.displayName} className="h-9 w-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate">{profile.displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">@{profile.username}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to={`/u/${profile.username}`}><User className="mr-2 h-4 w-4" />Mon profil</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/parametres"><Settings className="mr-2 h-4 w-4" />Modifier le profil</Link></DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild><Link to="/admin"><Shield className="mr-2 h-4 w-4" />Administration</Link></DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}><LogOut className="mr-2 h-4 w-4" />Se déconnecter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const [mobileSearch, setMobileSearch] = useState(false);
  const { requireAuth } = useSession();
  const navigate = useNavigate();
  const publish = () => { if (requireAuth('Connectez-vous pour publier une vidéo.')) navigate('/publier'); };

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <div className="flex shrink-0 items-center">
          <Logo />
        </div>

        <nav className="ml-4 hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => cn(
                'rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground',
                isActive && 'bg-accent text-foreground',
              )}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <SearchBar className="mx-auto hidden w-full max-w-xl md:block" />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setMobileSearch(true)} aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="secondary" onClick={publish} className="hidden rounded-full sm:inline-flex">
            <Plus className="mr-1 h-4 w-4" /> Publier
          </Button>
          <Button variant="secondary" size="icon" onClick={publish} className="rounded-full sm:hidden" aria-label="Publier">
            <Plus className="h-5 w-5" />
          </Button>
          <UserMenu />
        </div>
      </div>

      {mobileSearch && (
        <div className="glass absolute inset-x-0 top-0 z-50 flex h-16 items-center gap-2 border-b border-border/50 px-3 md:hidden">
          <SearchBar className="flex-1" onDone={() => setMobileSearch(false)} />
          <Button variant="ghost" size="icon" onClick={() => setMobileSearch(false)} aria-label="Fermer"><X className="h-5 w-5" /></Button>
        </div>
      )}
    </header>
  );
}

export function MobileNav() {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border/50 pb-[env(safe-area-inset-bottom)] xl:hidden">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) => cn(
            'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition',
            isActive && 'text-primary',
          )}
        >
          <n.icon className="h-5 w-5" />
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}
