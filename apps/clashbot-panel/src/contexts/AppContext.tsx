import { createContext, useContext, useEffect, useState } from 'react';
import { services } from '../services/clashbot';
import { useApi } from '../hooks/useApi';
import type { AdminMe, Guild, SystemStatus } from '../types/api';
import { getApiUrl } from '../services/http';

type Theme = 'dark' | 'light';
type Ctx = {
  theme: Theme; setTheme: (t: Theme) => void;
  apiConfigured: boolean;
  me: AdminMe | null; meLoading: boolean; meError: Error | null; reloadMe: () => void;
  status: SystemStatus | null; statusError: Error | null;
  guilds: Guild[]; guildId: string | null; setGuildId: (id: string | null) => void; guild: Guild | null;
  timezone: string; setTimezone: (tz: string) => void;
  can: (perm: string) => boolean;
};
const AppContext = createContext<Ctx | null>(null);
export const useApp = () => useContext(AppContext)!;

const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('clashbot.theme') as Theme) || 'dark');
  const [guildId, setGuildIdState] = useState<string | null>(() => localStorage.getItem('clashbot.guild'));
  const [timezone, setTzState] = useState(() => localStorage.getItem('clashbot.tz') || detectedTz);
  const [apiConfigured, setConfigured] = useState(!!getApiUrl());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('clashbot.theme', theme);
  }, [theme]);
  useEffect(() => {
    const f = () => setConfigured(!!getApiUrl());
    window.addEventListener('clashbot:api-changed', f);
    return () => window.removeEventListener('clashbot:api-changed', f);
  }, []);

  const me = useApi(services.system.me, [apiConfigured], { enabled: apiConfigured });
  const status = useApi(services.system.status, [apiConfigured], { enabled: apiConfigured, pollMs: 30000 });
  const guilds = useApi(() => services.guilds.list({ pageSize: 200 }), [apiConfigured, me.data?.id], { enabled: apiConfigured && !!me.data });

  const list = guilds.data?.items ?? [];
  const guild = list.find((x) => x.id === guildId) ?? null;
  useEffect(() => {
    if (!guildId && list.length) setGuildId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const setGuildId = (id: string | null) => {
    setGuildIdState(id);
    if (id) localStorage.setItem('clashbot.guild', id); else localStorage.removeItem('clashbot.guild');
  };
  const setTimezone = (tz: string) => { setTzState(tz); localStorage.setItem('clashbot.tz', tz); };
  const perms = me.data?.permissions ?? [];

  return (
    <AppContext.Provider value={{
      theme, setTheme: setThemeState, apiConfigured,
      me: me.data, meLoading: me.loading, meError: me.error, reloadMe: () => me.reload(),
      status: status.data, statusError: status.error,
      guilds: list, guildId: guild ? guildId : null, setGuildId, guild,
      timezone, setTimezone,
      // Indication d'interface uniquement : le backend revérifie chaque permission.
      can: (p) => perms.includes('*') || perms.includes(p),
    }}>
      {children}
    </AppContext.Provider>
  );
}
