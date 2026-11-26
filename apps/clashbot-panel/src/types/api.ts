// Types partagés du contrat API ClashBot. Les champs `null` signifient « Non configuré ».

export type Snowflake = string;
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

export type ServiceState = { ok: boolean; latencyMs?: number | null; message?: string | null };
export type SystemStatus = {
  bot: ServiceState & { online: boolean; uptimeSec?: number | null; version?: string | null; shards?: number | null };
  backend: ServiceState;
  supabase: ServiceState;
  checkedAt: string;
};

export type AdminMe = {
  id: Snowflake; username: string; globalName?: string | null; avatarUrl?: string | null;
  role: string; permissions: string[];
};

export type Guild = {
  id: Snowflake; name: string; iconUrl?: string | null; memberCount: number; botPresent: boolean;
  premium?: boolean; joinedAt?: string | null; ownerId?: Snowflake | null; timezone?: string | null;
};
export type GuildDetail = Guild & {
  stats: { commands7d: number; messages7d: number; activeMembers7d: number };
  modules: { key: string; name: string; enabled: boolean }[];
  roles: DiscordRole[]; channels: DiscordChannel[];
  history: LogEntry[];
};
export type DiscordRole = { id: Snowflake; name: string; color: number; position: number; managed: boolean; memberCount?: number | null; permissions: string[]; usedBy?: string[]; botCanManage?: boolean };
export type DiscordChannel = { id: Snowflake; name: string; type: 'text' | 'voice' | 'category' | 'announcement' | 'forum' | 'stage' | 'thread'; parentId?: Snowflake | null; position: number; usedBy?: string[]; botCanSend?: boolean };

export type Member = {
  id: Snowflake; guildId: Snowflake; username: string; displayName?: string | null; avatarUrl?: string | null;
  joinedAt?: string | null; lastActiveAt?: string | null; commandCount: number; level?: number | null;
};
export type MemberDetail = Member & {
  roles: string[];
  economy: { wallet: number; bank: number; total: number; rank?: number | null } | null;
  commands: { name: string; at: string; success: boolean }[];
  transactions: Transaction[];
  achievements: { id: string; name: string; unlockedAt: string }[];
  inventory: { itemId: string; name: string; quantity: number }[];
  moderation: { id: string; type: string; reason?: string | null; moderator: string; at: string }[] | null;
};

export type CommandOption = { name: string; description: string; type: string; required: boolean; choices?: { name: string; value: string }[] };
export type BotCommand = {
  name: string; description: string; category: string; enabled: boolean;
  permissions: string[]; options: CommandOption[]; subcommands?: BotCommand[];
  usage7d?: number | null; successRate?: number | null;
};

export type Transaction = {
  id: string; guildId: Snowflake; userId: Snowflake; username?: string | null; type: string; amount: number;
  direction: 'in' | 'out'; balanceAfter?: number | null; reason?: string | null; actorId?: Snowflake | null; at: string;
};

export type Point = { date: string; [series: string]: number | string };
export type Overview = {
  guilds: number; members: number; commands: number; commandsPrev: number; transactions: number; transactionsPrev: number;
  activity: Point[]; growth: Point[]; economy: Point[];
  moduleUsage: { module: string; count: number }[];
  topCommands: { name: string; count: number }[];
  events: LogEntry[]; alerts: { id: string; level: 'error' | 'warning'; message: string; at: string }[];
};

export type LogEntry = {
  id: string; category: string; action: string; level: 'info' | 'warning' | 'error';
  actor?: { id: Snowflake; name: string } | null; guildId?: Snowflake | null; guildName?: string | null;
  summary: string; details?: Record<string, unknown> | null; at: string;
};

export type Notification = { id: string; title: string; body?: string | null; level: 'info' | 'success' | 'warning' | 'error'; read: boolean; at: string; href?: string | null };

export type PanelAdmin = { id: Snowflake; username: string; avatarUrl?: string | null; role: string; permissions: string[]; addedBy?: string | null; addedAt: string };
