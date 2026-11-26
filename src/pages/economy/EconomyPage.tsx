import { useState } from 'react';
import {
  Activity, Banknote, Coins, Dices, Gift, Landmark, Package, ScrollText, Trophy, Users, type LucideIcon,
} from 'lucide-react';
import { cn } from '@project/components/lib/utils';
import { useApp } from '../../contexts/AppContext';
import { PageHeader, Panel } from '../../components/common/Layout';
import { GuildGate } from '../../components/common/Guild';
import { ConfigSection } from '../../components/forms/ConfigSection';
import { CollectionManager } from '../../components/forms/CollectionManager';
import { nextLocalMidnight, discordTimestamp } from '../../utils/discordTime';
import { AccountsView, LeaderboardView } from './Accounts';
import { TransactionsView } from './Transactions';
import * as D from './definitions';

type Section = { key: string; label: string; icon: LucideIcon; render: (g: string) => React.ReactNode };

function DailyInfo() {
  const { timezone } = useApp();
  const next = nextLocalMidnight(timezone);
  return (
    <Panel title="Fonctionnement du journalier">
      <p className="text-sm text-muted-foreground">
        Le journalier se base sur la <strong className="text-foreground">date civile</strong> du fuseau horaire configuré pour ce serveur : une récupération à 23 h 59
        en autorise une nouvelle dès 00 h 00 locale. Exemple dans votre fuseau ({timezone}) : prochaine réinitialisation{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{discordTimestamp(next, 'R')}</code> ({new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' }).format(next)}).
      </p>
    </Panel>
  );
}

const SECTIONS: Section[] = [
  { key: 'accounts', label: 'Comptes', icon: Users, render: (g) => <div className="grid gap-6 xl:grid-cols-[1fr_340px]"><div className="min-w-0"><AccountsView guildId={g} /></div><LeaderboardView guildId={g} /></div> },
  { key: 'transactions', label: 'Transactions', icon: ScrollText, render: (g) => <TransactionsView guildId={g} /> },
  { key: 'currency', label: 'Monnaie', icon: Coins, render: (g) => <ConfigSection guildId={g} section="economy/currency" groups={D.CURRENCY} /> },
  { key: 'rewards', label: 'Récompenses', icon: Gift, render: (g) => <ConfigSection guildId={g} section="economy/rewards" groups={D.REWARDS} intro={<DailyInfo />} /> },
  { key: 'activities', label: 'Activités', icon: Activity, render: (g) => (
    <div className="space-y-8">
      <ConfigSection guildId={g} section="economy/activities" groups={D.ACTIVITIES} />
      <Panel title="Métiers" description="Métiers disponibles avec /travail sur ce serveur."><CollectionManager guildId={g} path="economy/jobs" noun="Métier" fields={D.JOB_FIELDS} columns={D.JOB_COLUMNS} /></Panel>
      <Panel title="Missions"><CollectionManager guildId={g} path="economy/missions" noun="Mission" fields={D.MISSION_FIELDS} columns={D.MISSION_COLUMNS} /></Panel>
    </div>
  ) },
  { key: 'bank', label: 'Banque', icon: Landmark, render: (g) => <ConfigSection guildId={g} section="economy/bank" groups={D.BANK} /> },
  { key: 'shop', label: 'Boutique', icon: Package, render: (g) => (
    <div className="space-y-6">
      <Panel title="Articles" description="Catégories, prix, stocks, récompenses et règles de revente/échange."><CollectionManager guildId={g} path="economy/shop" noun="Article" fields={D.SHOP_FIELDS} columns={D.SHOP_COLUMNS} /></Panel>
    </div>
  ) },
  { key: 'fun', label: 'Divertissements', icon: Dices, render: (g) => <ConfigSection guildId={g} section="economy/fun" groups={D.FUN} /> },
  { key: 'progression', label: 'Progression', icon: Trophy, render: (g) => <Panel title="Succès"><CollectionManager guildId={g} path="economy/achievements" noun="Succès" fields={D.ACHIEVEMENT_FIELDS} columns={D.ACHIEVEMENT_COLUMNS} /></Panel> },
];

export default function EconomyPage() {
  const [active, setActive] = useState('accounts');
  const { guild } = useApp();
  const section = SECTIONS.find((s) => s.key === active)!;
  return (
    <>
      <PageHeader eyebrow="Fonctionnalités" title="Économie" description={guild ? `Configuration indépendante de « ${guild.name} ». Les autres serveurs ne sont jamais modifiés.` : 'Chaque serveur possède sa propre configuration.'}
        actions={<span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"><Banknote className="h-3.5 w-3.5" />Aucune valeur imposée par défaut</span>} />
      <GuildGate>
        {(g) => (
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
              {SECTIONS.map((s) => (
                <button key={s.key} onClick={() => setActive(s.key)} className={cn('flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active === s.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  <s.icon className="h-4 w-4" />{s.label}
                </button>
              ))}
            </nav>
            <div key={`${g}-${active}`} className="min-w-0">{section.render(g)}</div>
          </div>
        )}
      </GuildGate>
    </>
  );
}
