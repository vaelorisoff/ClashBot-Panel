import { Server } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApi } from '../../hooks/useApi';
import { services } from '../../services/clashbot';
import { EmptyState } from './States';
import type { DiscordChannel, DiscordRole } from '../../types/api';

/** Affiche le contenu seulement lorsqu'un serveur est sélectionné (configurations indépendantes par serveur). */
export function GuildGate({ children }: { children: (guildId: string) => React.ReactNode }) {
  const { guildId, apiConfigured } = useApp();
  if (!guildId) {
    return <EmptyState icon={<Server className="h-5 w-5" />} title="Choisissez un serveur"
      text={apiConfigured ? 'Sélectionnez un serveur dans la barre supérieure : chaque serveur possède sa propre configuration.' : 'Connectez d\'abord le backend ClashBot dans les Paramètres.'} />;
  }
  return <>{children(guildId)}</>;
}

const cache = new Map<string, Promise<{ roles: DiscordRole[]; channels: DiscordChannel[] }>>();
export function useGuildMeta(guildId: string) {
  return useApi(() => {
    if (!cache.has(guildId)) {
      const p = Promise.all([services.guilds.roles(guildId), services.guilds.channels(guildId)]).then(([roles, channels]) => ({ roles, channels }));
      p.catch(() => cache.delete(guildId));
      cache.set(guildId, p);
    }
    return cache.get(guildId)!;
  }, [guildId]);
}
