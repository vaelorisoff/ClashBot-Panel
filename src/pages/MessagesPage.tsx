import { useState } from 'react';
import { cn } from '@project/components/lib/utils';
import { PageHeader, Panel } from '../components/common/Layout';
import { GuildGate } from '../components/common/Guild';
import { CollectionManager } from '../components/forms/CollectionManager';
import { Composer, ModuleMessageEditor } from '../modules/editor/Composer';
import { PublishedHistory } from '../modules/editor/PublishedHistory';
import MessageEditor from '../modules/editor/MessageEditor';
import { emptyMessage, type DiscordMessage } from '../types/message';
import type { Variable } from '../modules/editor/Tools';

const MEMBER_VARS: Variable[] = [{ key: 'user.joined', label: "Date d'arrivée" }, { key: 'user.created', label: 'Date de création du compte' }, { key: 'server.position', label: 'Rang d\'arrivée' }, { key: 'inviter', label: 'Invité par' }];

const SECTIONS: { key: string; label: string; render: (g: string) => React.ReactNode }[] = [
  { key: 'join', label: 'Arrivées', render: (g) => <ModuleMessageEditor guildId={g} module="join" variables={MEMBER_VARS} description="Envoyé dans le salon choisi à chaque arrivée." /> },
  { key: 'leave', label: 'Départs', render: (g) => <ModuleMessageEditor guildId={g} module="leave" variables={MEMBER_VARS} /> },
  { key: 'welcome', label: 'Bienvenue (MP)', render: (g) => <ModuleMessageEditor guildId={g} module="welcome-dm" variables={MEMBER_VARS} features={{ sender: false }} description="Message privé envoyé au nouveau membre. Le salon n'est pas utilisé." /> },
  { key: 'rules', label: 'Règlement', render: (g) => <ModuleMessageEditor guildId={g} module="rules" description="Le bouton d'acceptation (custom_id « rules:accept ») attribue le rôle configuré côté backend." /> },
  { key: 'send', label: 'Annonces', render: (g) => <Composer guildId={g} /> },
  { key: 'auto', label: 'Automatiques', render: (g) => (
    <Panel title="Messages automatiques" description="Messages répétés à intervalle régulier dans un salon.">
      <CollectionManager guildId={g} path="messages/automatic" noun="Message automatique"
        columns={[{ key: 'name', label: 'Nom' }, { key: 'channelId', label: 'Salon' }, { key: 'interval', label: 'Intervalle (s)' }, { key: 'enabled', label: 'Actif' }]}
        fields={[
          { key: 'name', label: 'Nom', type: 'text', required: true }, { key: 'channelId', label: 'Salon', type: 'channel', required: true },
          { key: 'interval', label: 'Intervalle', type: 'duration', required: true }, { key: 'enabled', label: 'Actif', type: 'boolean' },
        ]}
        renderEditorExtra={(v, set) => (
          <div className="sm:col-span-2"><MessageEditor value={(v.message as DiscordMessage) ?? emptyMessage()} onChange={(m) => set('message', m)} guildId={g} module="automatic" /></div>
        )} />
    </Panel>
  ) },
  { key: 'moderation', label: 'Modération', render: (g) => <ModuleMessageEditor guildId={g} module="moderation" variables={[{ key: 'sanction', label: 'Type de sanction' }, { key: 'reason', label: 'Motif' }, { key: 'moderator', label: 'Modérateur' }, { key: 'expires', label: 'Expiration (horodatage)' }]} /> },
  { key: 'notifications', label: 'Notifications', render: (g) => <ModuleMessageEditor guildId={g} module="notifications" /> },
  { key: 'scheduled', label: 'Planifiés', render: (g) => (
    <div className="space-y-6">
      <Panel title="Planifier un envoi"><Composer guildId={g} /></Panel>
      <Panel title="Envois planifiés" bodyClassName="p-3"><PublishedHistory guildId={g} status="scheduled" /></Panel>
    </div>
  ) },
  { key: 'history', label: 'Historique', render: (g) => <PublishedHistory guildId={g} /> },
];

export default function MessagesPage() {
  const [active, setActive] = useState('join');
  const s = SECTIONS.find((x) => x.key === active)!;
  return (
    <>
      <PageHeader eyebrow="Fonctionnalités" title="Messages" description="Tous les messages utilisent l'éditeur commun. Les modèles et brouillons sont accessibles depuis la barre de l'éditeur." />
      <GuildGate>
        {(g) => (
          <>
            <div className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto border-b px-4 lg:mx-0 lg:px-0">
              {SECTIONS.map((x) => (
                <button key={x.key} onClick={() => setActive(x.key)} className={cn('shrink-0 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition',
                  active === x.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{x.label}</button>
              ))}
            </div>
            <div key={`${g}-${active}`}>{s.render(g)}</div>
          </>
        )}
      </GuildGate>
    </>
  );
}
