import { Music2, Radio, Twitch, Youtube } from 'lucide-react';
import { Badge } from '@project/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { PageHeader, Panel } from '../components/common/Layout';
import { GuildGate } from '../components/common/Guild';
import { GuildHistory } from '../components/common/GuildHistory';
import { CollectionManager } from '../components/forms/CollectionManager';
import MessageEditor from '../modules/editor/MessageEditor';
import { emptyMessage, type DiscordMessage } from '../types/message';
import type { FieldDef } from '../components/forms/Fields';
import type { Variable } from '../modules/editor/Tools';

type Platform = { key: string; label: string; icon: React.ReactNode; idLabel: string; hint: string; fields: FieldDef[]; vars: Variable[] };

const base = (idLabel: string, hint: string): FieldDef[] => [
  { key: 'sourceId', label: idLabel, type: 'text', required: true, hint },
  { key: 'displayName', label: 'Nom affiché', type: 'text' },
  { key: 'channelId', label: 'Salon d\'annonce', type: 'channel', required: true, channelTypes: ['text', 'announcement'] },
  { key: 'mentionRole', label: 'Rôle à mentionner', type: 'role' },
  { key: 'enabled', label: 'Active', type: 'boolean' },
];

const PLATFORMS: Platform[] = [
  { key: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" />, idLabel: 'Chaîne (identifiant ou @handle)', hint: 'ex. UC… ou @nomdelachaine',
    fields: [{ key: 'notifyVideos', label: 'Nouvelles vidéos', type: 'boolean' }, { key: 'notifyShorts', label: 'Shorts', type: 'boolean' }, { key: 'notifyLives', label: 'Diffusions en direct', type: 'boolean' }],
    vars: [{ key: 'video.title', label: 'Titre' }, { key: 'video.url', label: 'Lien' }, { key: 'video.thumbnail', label: 'Miniature' }, { key: 'channel.name', label: 'Chaîne' }, { key: 'video.published', label: 'Date de publication' }] },
  { key: 'twitch', label: 'Twitch', icon: <Twitch className="h-4 w-4" />, idLabel: 'Identifiant Twitch', hint: 'Nom de la chaîne Twitch',
    fields: [{ key: 'deleteOnEnd', label: 'Supprimer l\'annonce à la fin du direct', type: 'boolean' }, { key: 'updateOnChange', label: 'Mettre à jour le titre/jeu pendant le direct', type: 'boolean' }],
    vars: [{ key: 'stream.title', label: 'Titre du direct' }, { key: 'stream.game', label: 'Jeu' }, { key: 'stream.url', label: 'Lien' }, { key: 'stream.thumbnail', label: 'Aperçu' }, { key: 'stream.started', label: 'Début (horodatage)' }, { key: 'streamer', label: 'Streamer' }] },
  { key: 'spotify', label: 'Spotify', icon: <Music2 className="h-4 w-4" />, idLabel: 'Artiste (identifiant Spotify)', hint: 'Lien ou identifiant de l\'artiste',
    fields: [{ key: 'notifyAlbums', label: 'Albums', type: 'boolean' }, { key: 'notifySingles', label: 'Singles et morceaux', type: 'boolean' }, { key: 'notifyAppearsOn', label: 'Apparitions', type: 'boolean' }],
    vars: [{ key: 'release.name', label: 'Titre de la sortie' }, { key: 'release.type', label: 'Type' }, { key: 'release.url', label: 'Lien' }, { key: 'release.cover', label: 'Pochette' }, { key: 'artist', label: 'Artiste' }] },
  { key: 'tiktok', label: 'TikTok', icon: <Radio className="h-4 w-4" />, idLabel: 'Compte TikTok (@)', hint: 'Détecté uniquement si la source publique est accessible.',
    fields: [{ key: 'notifyLives', label: 'Directs TikTok', type: 'boolean' }],
    vars: [{ key: 'post.description', label: 'Description' }, { key: 'post.url', label: 'Lien' }, { key: 'post.cover', label: 'Couverture' }, { key: 'account', label: 'Compte' }] },
];

function PlatformTab({ p, guildId }: { p: Platform; guildId: string }) {
  return (
    <div className="space-y-6">
      <Panel title={`Sources ${p.label}`} description="Seules les nouvelles publications détectées après l'ajout sont annoncées (pas d'anciennes publications ni de doublons).">
        <CollectionManager guildId={guildId} path={`social/${p.key}`} noun={`Source ${p.label}`}
          columns={[{ key: 'displayName', label: 'Source', render: (r) => <span className="font-medium">{String(r.displayName || r.sourceId)}</span> },
            { key: 'lastDetectedAt', label: 'Dernière détection' },
            { key: 'enabled', label: 'État', render: (r) => r.enabled ? <Badge className="bg-success/15 text-success hover:bg-success/15">Active</Badge> : <Badge variant="secondary">Inactive</Badge> }]}
          fields={[...base(p.idLabel, p.hint), ...p.fields]}
          renderEditorExtra={(v, set) => (
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium">Message d'annonce</p>
              <MessageEditor value={(v.message as DiscordMessage) ?? emptyMessage()} onChange={(m) => set('message', m)} guildId={guildId} module={`social-${p.key}`} variables={p.vars} />
            </div>
          )} />
      </Panel>
      <Panel title="Historique des annonces" bodyClassName="p-3">
        <GuildHistory guildId={guildId} path={`social/${p.key}/history`} render={(r) => ({
          primary: String(r.title ?? r.summary ?? r.id), secondary: r.error ? String(r.error) : r.sourceName ? String(r.sourceName) : undefined,
          ok: r.status === 'sent' ? true : r.status === 'failed' ? false : null, at: (r.at as string) ?? null,
        })} />
      </Panel>
    </div>
  );
}

export default function SocialPage() {
  return (
    <>
      <PageHeader eyebrow="Fonctionnalités" title="Notifications sociales" description="YouTube, Twitch, Spotify et TikTok. Les détections et envois affichés proviennent uniquement du backend." />
      <GuildGate>
        {(g) => (
          <Tabs defaultValue="youtube">
            <TabsList>{PLATFORMS.map((p) => <TabsTrigger key={p.key} value={p.key} className="gap-1.5">{p.icon}{p.label}</TabsTrigger>)}</TabsList>
            {PLATFORMS.map((p) => <TabsContent key={p.key} value={p.key} className="mt-4"><PlatformTab p={p} guildId={g} /></TabsContent>)}
          </Tabs>
        )}
      </GuildGate>
    </>
  );
}
