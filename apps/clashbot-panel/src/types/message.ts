// Modèle de message Discord partagé par l'éditeur commun et tous les modules.

export type EmbedField = { name: string; value: string; inline: boolean };
export type Embed = {
  color?: number | null;
  author?: { name: string; url?: string; iconUrl?: string } | null;
  title?: string; url?: string; description?: string;
  thumbnailUrl?: string; imageUrl?: string;
  fields: EmbedField[];
  footer?: { text: string; iconUrl?: string } | null;
  timestamp?: string | null; // ISO, ou 'now' pour l'horodatage d'envoi
};
export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'link';
export type MessageButton = { type: 'button'; label: string; style: ButtonStyle; url?: string; customId?: string; emoji?: string; disabled?: boolean };
export type SelectMenu = { type: 'select'; customId: string; placeholder: string; options: { label: string; value: string; description?: string; emoji?: string }[] };
export type ActionRow = { components: (MessageButton | SelectMenu)[] };

export type SenderProfile = { id: string; name: string; avatarUrl?: string | null; useWebhook: boolean };

export type DiscordMessage = {
  content: string;
  embeds: Embed[];
  rows: ActionRow[];
  senderProfileId?: string | null;
};

export const emptyMessage = (): DiscordMessage => ({ content: '', embeds: [], rows: [], senderProfileId: null });
export const emptyEmbed = (): Embed => ({ fields: [], color: null });

export type Template = { id: string; name: string; module?: string | null; message: DiscordMessage; updatedAt: string };
export type Draft = Template;
export type PublishedMessage = {
  id: string; channelId: string; channelName?: string | null; messageId: string; message: DiscordMessage;
  status: 'sent' | 'failed' | 'deleted' | 'scheduled'; error?: string | null; sentAt?: string | null; scheduledFor?: string | null;
  author?: string | null;
};

// Limites Discord officielles.
export const LIMITS = { content: 2000, embeds: 10, title: 256, description: 4096, fields: 25, fieldName: 256, fieldValue: 1024, footer: 2048, author: 256, total: 6000, rows: 5, buttonsPerRow: 5, buttonLabel: 80, selectOptions: 25 };

export function embedLength(e: Embed) {
  return (e.title?.length ?? 0) + (e.description?.length ?? 0) + (e.author?.name.length ?? 0) + (e.footer?.text.length ?? 0)
    + e.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);
}
