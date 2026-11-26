import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, LogOut, Menu, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Sheet, SheetContent, SheetTitle } from '@project/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import { cn } from '@project/components/lib/utils';
import { useApp } from '../contexts/AppContext';
import { services } from '../services/clashbot';
import { useAction, useApi } from '../hooks/useApi';
import { Avatar, StatusDot } from '../components/common/Layout';
import { ErrorState } from '../components/common/States';
import { fmtDate, fmtDuration } from '../utils/format';
import { relativeFr } from '../utils/discordTime';
import GlobalSearch from './GlobalSearch';
import { Brand, NavList } from './Sidebar';

function BotStatus() {
  const { status, statusError, apiConfigured } = useApp();
  const online = status ? status.bot.online : null;
  const rows = status ? [
    ['Bot Discord', status.bot.online, status.bot.latencyMs != null ? `${status.bot.latencyMs} ms` : null],
    ['Backend ClashBot', status.backend.ok, status.backend.latencyMs != null ? `${status.backend.latencyMs} ms` : null],
    ['Supabase', status.supabase.ok, status.supabase.latencyMs != null ? `${status.supabase.latencyMs} ms` : null],
  ] as const : [];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden gap-2 md:inline-flex">
          <StatusDot ok={online} pulse />
          <span className="text-sm">{!apiConfigured ? 'Non connecté' : online == null ? (statusError ? 'Indisponible' : 'Vérification…') : online ? 'En ligne' : 'Hors ligne'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="mb-3 text-sm font-semibold">État des services</p>
        {statusError && !status ? <p className="text-sm text-muted-foreground">{statusError.message}</p> : !status ? <p className="text-sm text-muted-foreground">Aucune donnée d'état.</p> : (
          <div className="space-y-2.5">
            {rows.map(([n, ok, l]) => <div key={n} className="flex items-center gap-2 text-sm"><StatusDot ok={ok} /><span className="flex-1">{n}</span><span className="text-xs text-muted-foreground">{l ?? (ok ? 'OK' : 'Erreur')}</span></div>)}
            <div className="border-t pt-2 text-xs text-muted-foreground">
              {status.bot.version && <p>Version {status.bot.version}</p>}
              {status.bot.uptimeSec != null && <p>Disponible depuis {fmtDuration(status.bot.uptimeSec)}</p>}
              <p>Vérifié {relativeFr(new Date(status.checkedAt))}</p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Notifications() {
  const { apiConfigured, me } = useApp();
  const state = useApi(services.system.notifications, [apiConfigured, me?.id], { enabled: apiConfigured && !!me, pollMs: 60000 });
  const { run } = useAction();
  const list = state.data ?? [];
  const unread = list.filter((n) => !n.read);
  const markAll = () => run(() => services.system.markRead(unread.map((n) => n.id))).then((r) => r && state.reload(true));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {!!unread.length && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread.length > 9 ? '9+' : unread.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {!!unread.length && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAll}><CheckCheck className="mr-1 h-3.5 w-3.5" />Tout marquer comme lu</Button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {state.error && !state.data ? <ErrorState compact error={state.error} onRetry={() => state.reload()} />
            : !list.length ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">{state.loading ? 'Chargement…' : 'Aucune notification.'}</p>
              : list.map((n) => (
                <div key={n.id} className={cn('border-b px-4 py-3 last:border-0', !n.read && 'bg-primary/5')}>
                  <div className="flex items-start gap-2">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.level === 'error' ? 'bg-destructive' : n.level === 'warning' ? 'bg-warning' : n.level === 'success' ? 'bg-success' : 'bg-info')} />
                    <div className="min-w-0">
                      {n.href ? <Link to={n.href} className="text-sm font-medium hover:text-primary">{n.title}</Link> : <p className="text-sm font-medium">{n.title}</p>}
                      {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(n.at)}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GuildSelector() {
  const { guilds, guildId, setGuildId, apiConfigured } = useApp();
  if (!apiConfigured || !guilds.length) return null;
  return (
    <Select value={guildId ?? undefined} onValueChange={setGuildId}>
      <SelectTrigger className="h-9 w-[150px] sm:w-[210px]"><SelectValue placeholder="Choisir un serveur" /></SelectTrigger>
      <SelectContent className="max-h-80">
        {guilds.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            <span className="flex items-center gap-2"><Avatar src={g.iconUrl} name={g.name} className="h-5 w-5 text-[9px]" /><span className="truncate">{g.name}</span></span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Profile() {
  const { me, theme, setTheme, reloadMe } = useApp();
  const { run } = useAction();
  const login = () => run(async () => { const { url } = await services.system.loginUrl(); window.location.href = url; });
  const logout = () => run(() => services.system.logout(), 'Déconnexion effectuée.').then((r) => r && reloadMe());
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Profil">
          {me ? <Avatar src={me.avatarUrl} name={me.globalName || me.username} className="h-8 w-8" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><UserRound className="h-4 w-4" /></span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {me ? <><p className="truncate">{me.globalName || me.username}</p><p className="truncate text-xs font-normal text-muted-foreground">{me.role}</p></> : 'Non connecté'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}Thème {theme === 'dark' ? 'clair' : 'sombre'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/parametres"><Settings className="mr-2 h-4 w-4" />Paramètres</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        {me ? <DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Se déconnecter</DropdownMenuItem>
          : <DropdownMenuItem onClick={login}><UserRound className="mr-2 h-4 w-4" />Se connecter avec Discord</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Topbar({ offset }: { offset: string }) {
  const [mobile, setMobile] = useState(false);
  const { theme, setTheme } = useApp();
  return (
    <header className={cn('glass fixed right-0 top-0 z-20 flex h-16 items-center gap-2 border-b px-3 sm:gap-3 sm:px-5', offset)}>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></Button>
      <div className="min-w-0 flex-1"><GlobalSearch /></div>
      <GuildSelector />
      <BotStatus />
      <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Changer de thème">
        {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </Button>
      <Notifications />
      <Profile />
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mb-6"><Brand /></div>
          <NavList onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
