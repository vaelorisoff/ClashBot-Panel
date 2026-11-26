import { api, type Query } from './http';
import type { Point,
  AdminMe, BotCommand, Guild, GuildDetail, LogEntry, Member, MemberDetail, Notification, Overview, Paginated,
  PanelAdmin, SystemStatus, Transaction, DiscordChannel, DiscordRole,
} from '../types/api';
import type { DiscordMessage, Draft, PublishedMessage, SenderProfile, Template } from '../types/message';

const g = (guildId: string) => `/guilds/${encodeURIComponent(guildId)}`;
export type Range = '24h' | '7d' | '30d' | '90d';
export type Row = Record<string, unknown> & { id: string };
export type ConfigValues = Record<string, unknown>;

/** Toutes les routes du backend ClashBot utilisées par le panel (documentées dans API.md). */
export const services = {
  system: {
    status: () => api.get<SystemStatus>('/status'),
    me: () => api.get<AdminMe>('/auth/me'),
    loginUrl: () => api.get<{ url: string }>('/auth/login-url', { redirect: window.location.origin }),
    logout: () => api.post<{ ok: true }>('/auth/logout'),
    search: (q: string) => api.get<{ type: string; id: string; label: string; sub?: string; href: string }[]>('/search', { q }),
    notifications: () => api.get<Notification[]>('/notifications'),
    markRead: (ids: string[]) => api.post<{ ok: true }>('/notifications/read', { ids }),
  },
  stats: {
    overview: (range: Range, guildId?: string) => api.get<Overview>('/stats/overview', { range, guildId }),
    series: (q: Query) => api.get<{ current: { date: string; value: number }[]; previous?: { date: string; value: number }[]; breakdown?: { label: string; value: number }[] }>('/stats/series', q),
    exportUrl: (q: Query) => api.get<{ url: string }>('/stats/export', q),
  },
  guilds: {
    list: (q: Query) => api.get<Paginated<Guild>>('/guilds', q),
    get: (id: string) => api.get<GuildDetail>(g(id)),
    roles: (id: string) => api.get<DiscordRole[]>(`${g(id)}/roles`),
    channels: (id: string) => api.get<DiscordChannel[]>(`${g(id)}/channels`),
    setModule: (id: string, key: string, enabled: boolean) => api.patch<{ ok: true }>(`${g(id)}/modules/${key}`, { enabled }),
    settings: (id: string) => api.get<{ timezone: string | null; locale: string | null }>(`${g(id)}/settings`),
    saveSettings: (id: string, body: { timezone: string | null }) => api.put<{ ok: true }>(`${g(id)}/settings`, body),
  },
  members: {
    list: (q: Query) => api.get<Paginated<Member>>('/members', q),
    get: (guildId: string, userId: string) => api.get<MemberDetail>(`${g(guildId)}/members/${userId}`),
  },
  commands: {
    list: (guildId?: string) => api.get<BotCommand[]>('/commands', { guildId }),
    setEnabled: (guildId: string, name: string, enabled: boolean) => api.patch<{ ok: true }>(`${g(guildId)}/commands/${encodeURIComponent(name)}`, { enabled }),
    history: (q: Query) => api.get<Paginated<{ id: string; name: string; userId: string; username: string; guildName?: string; success: boolean; error?: string | null; at: string }>>('/commands/history', q),
  },
  /** Ressources génériques par serveur : configuration (sections) et collections (CRUD). */
  guildConfig: {
    get: (guildId: string, section: string) => api.get<ConfigValues>(`${g(guildId)}/${section}/config`),
    save: (guildId: string, section: string, values: ConfigValues) => api.put<ConfigValues>(`${g(guildId)}/${section}/config`, values),
  },
  collection: {
    get: <T,>(guildId: string, path: string, q?: Query) => api.get<T>(`${g(guildId)}/${path}`, q),
    list: (guildId: string, path: string, q?: Query) => api.get<Paginated<Row>>(`${g(guildId)}/${path}`, q),
    create: (guildId: string, path: string, body: Record<string, unknown>) => api.post<Row>(`${g(guildId)}/${path}`, body),
    update: (guildId: string, path: string, id: string, body: Record<string, unknown>) => api.put<Row>(`${g(guildId)}/${path}/${id}`, body),
    remove: (guildId: string, path: string, id: string) => api.del<{ ok: true }>(`${g(guildId)}/${path}/${id}`),
  },
  economy: {
    accounts: (guildId: string, q: Query) => api.get<Paginated<{ userId: string; username: string; avatarUrl?: string | null; wallet: number; bank: number; total: number }>>(`${g(guildId)}/economy/accounts`, q),
    transactions: (guildId: string, q: Query) => api.get<Paginated<Transaction>>(`${g(guildId)}/economy/transactions`, q),
    adjust: (guildId: string, userId: string, body: { target: 'wallet' | 'bank'; amount: number; reason: string }) =>
      api.post<{ wallet: number; bank: number }>(`${g(guildId)}/economy/accounts/${userId}/adjust`, body),
    leaderboard: (guildId: string, by: 'total' | 'wallet' | 'bank') => api.get<{ userId: string; username: string; avatarUrl?: string | null; value: number }[]>(`${g(guildId)}/economy/leaderboard`, { by }),
  },
  messages: {
    senders: () => api.get<SenderProfile[]>('/sender-profiles'),
    saveSender: (p: Partial<SenderProfile>) => (p.id ? api.put<SenderProfile>(`/sender-profiles/${p.id}`, p) : api.post<SenderProfile>('/sender-profiles', p)),
    removeSender: (id: string) => api.del<{ ok: true }>(`/sender-profiles/${id}`),
    templates: (guildId: string, kind: 'templates' | 'drafts') => api.get<Template[]>(`${g(guildId)}/messages/${kind}`),
    saveTemplate: (guildId: string, kind: 'templates' | 'drafts', t: { id?: string; name: string; module?: string | null; message: DiscordMessage }) =>
      (t.id ? api.put<Draft>(`${g(guildId)}/messages/${kind}/${t.id}`, t) : api.post<Draft>(`${g(guildId)}/messages/${kind}`, t)),
    removeTemplate: (guildId: string, kind: 'templates' | 'drafts', id: string) => api.del<{ ok: true }>(`${g(guildId)}/messages/${kind}/${id}`),
    moduleMessage: (guildId: string, module: string) => api.get<{ enabled: boolean; channelId: string | null; message: DiscordMessage | null }>(`${g(guildId)}/messages/modules/${module}`),
    saveModuleMessage: (guildId: string, module: string, body: { enabled: boolean; channelId: string | null; message: DiscordMessage }) =>
      api.put<{ ok: true }>(`${g(guildId)}/messages/modules/${module}`, body),
    send: (guildId: string, body: { channelId: string; message: DiscordMessage; scheduledFor?: string | null }) => api.post<PublishedMessage>(`${g(guildId)}/messages/send`, body),
    fetchExisting: (guildId: string, channelId: string, messageId: string) => api.get<{ message: DiscordMessage; editable: boolean }>(`${g(guildId)}/channels/${channelId}/messages/${messageId}`),
    editPublished: (guildId: string, id: string, message: DiscordMessage) => api.put<PublishedMessage>(`${g(guildId)}/messages/published/${id}`, { message }),
    deletePublished: (guildId: string, id: string) => api.del<{ ok: true }>(`${g(guildId)}/messages/published/${id}`),
    history: (guildId: string, q: Query) => api.get<Paginated<PublishedMessage>>(`${g(guildId)}/messages/history`, q),
  },
  announcements: {
    list: (q: Query) => api.get<Paginated<PublishedMessage & { title?: string | null; guildId: string }>>('/announcements', q),
    publish: (body: { guildId: string; channelId: string; message: DiscordMessage; title: string }) => api.post<PublishedMessage>('/announcements', body),
    channels: () => api.get<{ guildId: string; guildName: string; channelId: string; channelName: string }[]>('/announcements/channels'),
  },
  logs: {
    list: (q: Query) => api.get<Paginated<LogEntry>>('/logs', q),
    categories: () => api.get<string[]>('/logs/categories'),
  },
  admins: {
    list: () => api.get<PanelAdmin[]>('/admins'),
    roles: () => api.get<{ key: string; name: string; permissions: string[] }[]>('/admins/roles'),
    add: (body: { userId: string; role: string }) => api.post<PanelAdmin>('/admins', body),
    update: (id: string, body: { role: string }) => api.put<PanelAdmin>(`/admins/${id}`, body),
    remove: (id: string) => api.del<{ ok: true }>(`/admins/${id}`),
  },
  tts: {
    status: () => api.get<{ online: boolean; provider?: string | null; usageToday: number | null; charactersMonth: number | null; charactersLimit: number | null; activeSessions: number | null; recentErrors: { message: string; at: string }[] }>('/tts/status'),
    voices: () => api.get<{ id: string; name: string; language: string; gender?: string | null }[]>('/tts/voices'),
  },
  bump: {
    overview: (guildId: string, range: Range) => api.get<{ enabled: boolean; total: number; rank: number | null; nextAvailableAt: string | null; series: Point[]; topMembers: { userId: string; username: string; avatarUrl?: string | null; count: number }[] }>(`${g(guildId)}/bump`, { range }),
    leaderboard: () => api.get<{ guildId: string; name: string; iconUrl?: string | null; bumps: number }[]>('/bump/leaderboard'),
  },
  members_lookup: (guildId: string, q: string) => api.get<{ id: string; username: string; avatarUrl?: string | null }[]>(`${g(guildId)}/members/search`, { q }),
};
