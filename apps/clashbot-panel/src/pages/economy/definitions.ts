import type { ConfigGroup } from '../../components/forms/ConfigSection';
import type { FieldDef } from '../../components/forms/Fields';
import type { Column } from '../../components/forms/CollectionManager';

// Définitions déclaratives : aucune valeur par défaut. Chaque champ vide = « Non configuré » pour CE serveur.
const f = (key: string, label: string, type: FieldDef['type'], extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type, ...extra });

export const CURRENCY: ConfigGroup[] = [
  { title: 'Monnaie', description: 'Identité de la monnaie de ce serveur.', fields: [
    f('enabled', 'Économie activée', 'boolean'), f('currencyName', 'Nom de la monnaie', 'text'),
    f('currencySymbol', 'Symbole', 'text'), f('currencyEmoji', 'Emoji', 'emoji', { hint: 'Emoji Unicode ou personnalisé <:nom:id>.' }),
    f('startingBalance', 'Solde de départ', 'money', { min: 0 }), f('maxWallet', 'Plafond du portefeuille', 'money', { min: 0 }),
  ] },
  { title: 'Classements', fields: [
    f('leaderboardEnabled', 'Classement public', 'boolean'), f('leaderboardSize', 'Taille du classement', 'integer', { min: 1, max: 100 }),
    f('leaderboardChannel', 'Salon du classement', 'channel', { channelTypes: ['text', 'announcement'] }),
  ] },
];

export const REWARDS: ConfigGroup[] = [
  { title: 'Récompense journalière', description: 'Réinitialisée au changement de date locale du serveur (pas un délai glissant de 24 h).', fields: [
    f('dailyEnabled', 'Journalier activé', 'boolean'), f('dailyAmount', 'Montant journalier', 'money', { min: 0 }),
    f('timezone', 'Fuseau horaire du serveur', 'timezone', { hint: 'Fuseau IANA utilisé pour le jour civil.' }),
  ] },
  { title: 'Séries de connexion', fields: [
    f('streakEnabled', 'Séries activées', 'boolean'), f('streakBonus', 'Bonus par jour de série', 'money', { min: 0 }),
    f('streakMaxDays', 'Série maximale prise en compte', 'integer', { min: 1 }), f('streakResetOnMiss', 'Remise à zéro si un jour est manqué', 'boolean'),
  ] },
  { title: 'Récompenses progressives', fields: [
    f('progressiveEnabled', 'Activées', 'boolean'), f('progressiveStep', 'Augmentation par palier', 'money', { min: 0 }),
    f('progressiveEveryDays', 'Palier tous les N jours', 'integer', { min: 1 }), f('progressiveCap', 'Montant maximal', 'money', { min: 0 }),
  ] },
  { title: 'Gains par messages', fields: [
    f('messageEnabled', 'Activés', 'boolean'), f('messageMin', 'Gain minimum', 'money', { min: 0 }), f('messageMax', 'Gain maximum', 'money', { min: 0 }),
    f('messageCooldown', 'Délai entre deux gains', 'duration'), f('messageMinLength', 'Longueur minimale du message', 'integer', { min: 0 }),
    f('messageChannels', 'Salons concernés', 'channels', { hint: 'Vide = non configuré.' }), f('messageIgnoredChannels', 'Salons exclus', 'channels'),
  ] },
  { title: 'Gains en vocal', fields: [
    f('voiceEnabled', 'Activés', 'boolean'), f('voiceAmount', 'Gain par intervalle', 'money', { min: 0 }), f('voiceInterval', 'Intervalle', 'duration'),
    f('voiceMinMembers', 'Membres minimum dans le salon', 'integer', { min: 1 }), f('voiceIgnoreMuted', 'Ignorer les membres en sourdine', 'boolean'),
    f('voiceChannels', 'Salons vocaux concernés', 'channels', { channelTypes: ['voice', 'stage'] }),
  ] },
  { title: 'Rôles et multiplicateurs', fields: [
    f('multiplierRoles', 'Rôles bénéficiant d\'un multiplicateur', 'roles'), f('multiplierValue', 'Multiplicateur', 'number', { min: 0, hint: 'ex. 1,5 = +50 %.' }),
    f('excludedRoles', 'Rôles exclus de l\'économie', 'roles'),
  ] },
];

export const ACTIVITIES: ConfigGroup[] = [
  { title: 'Travail', fields: [
    f('workEnabled', 'Travail activé', 'boolean'), f('workCooldown', 'Délai entre deux travaux', 'duration'),
    f('workMin', 'Gain minimum', 'money', { min: 0 }), f('workMax', 'Gain maximum', 'money', { min: 0 }),
  ] },
  { title: 'Crimes', fields: [
    f('crimeEnabled', 'Crimes activés', 'boolean'), f('crimeCooldown', 'Délai', 'duration'), f('crimeSuccessRate', 'Probabilité de réussite', 'percent', { min: 0 }),
    f('crimeGainMin', 'Gain minimum', 'money', { min: 0 }), f('crimeGainMax', 'Gain maximum', 'money', { min: 0 }),
    f('crimeLossMin', 'Perte minimum', 'money', { min: 0 }), f('crimeLossMax', 'Perte maximum', 'money', { min: 0 }),
  ] },
  { title: 'Vols', fields: [
    f('robEnabled', 'Vols activés', 'boolean'), f('robCooldown', 'Délai', 'duration'), f('robSuccessRate', 'Probabilité de réussite', 'percent', { min: 0 }),
    f('robMaxPercent', 'Part maximale volée', 'percent', { min: 0 }), f('robFinePercent', 'Amende en cas d\'échec', 'percent', { min: 0 }),
    f('robMinTargetBalance', 'Solde minimum de la cible', 'money', { min: 0 }), f('robProtectedRoles', 'Rôles protégés', 'roles'),
  ] },
];

export const BANK: ConfigGroup[] = [
  { title: 'Dépôts et retraits', fields: [
    f('bankEnabled', 'Banque activée', 'boolean'), f('bankMax', 'Plafond de la banque', 'money', { min: 0 }),
    f('depositFee', 'Frais de dépôt', 'percent', { min: 0 }), f('withdrawFee', 'Frais de retrait', 'percent', { min: 0 }),
    f('depositDailyLimit', 'Limite de dépôt par jour', 'money', { min: 0 }), f('withdrawDailyLimit', 'Limite de retrait par jour', 'money', { min: 0 }),
    f('interestRate', 'Intérêts quotidiens', 'percent', { min: 0 }),
  ] },
  { title: 'Paiements entre membres', fields: [
    f('payEnabled', 'Paiements activés', 'boolean'), f('payFee', 'Frais de transfert', 'percent', { min: 0 }),
    f('payMin', 'Montant minimum', 'money', { min: 0 }), f('payMax', 'Montant maximum par transfert', 'money', { min: 0 }),
    f('payDailyLimit', 'Limite quotidienne', 'money', { min: 0 }), f('payMinAccountAge', 'Ancienneté minimale sur le serveur', 'duration'),
    f('payConfirmAbove', 'Confirmation au-delà de', 'money', { min: 0, hint: 'Sécurise les gros transferts.' }), f('payLogChannel', 'Salon des journaux de transferts', 'channel'),
  ] },
];

export const FUN: ConfigGroup[] = [
  { title: 'Jeux', fields: [
    f('gamesEnabled', 'Jeux activés', 'boolean'), f('gamesMinBet', 'Mise minimale', 'money', { min: 0 }), f('gamesMaxBet', 'Mise maximale', 'money', { min: 0 }),
    f('gamesCooldown', 'Délai entre deux parties', 'duration'), f('gamesChannels', 'Salons autorisés', 'channels'),
  ] },
  { title: 'Casino', fields: [
    f('casinoEnabled', 'Casino activé', 'boolean'), f('slotsPayout', 'Multiplicateur machine à sous', 'number', { min: 0 }),
    f('rouletteEnabled', 'Roulette', 'boolean'), f('blackjackEnabled', 'Blackjack', 'boolean'), f('coinflipEnabled', 'Pile ou face', 'boolean'),
    f('houseEdge', 'Avantage de la maison', 'percent', { min: 0 }),
  ] },
  { title: 'Loterie', fields: [
    f('lotteryEnabled', 'Loterie activée', 'boolean'), f('lotteryTicketPrice', 'Prix du ticket', 'money', { min: 0 }),
    f('lotteryMaxTickets', 'Tickets maximum par membre', 'integer', { min: 1 }), f('lotteryDrawTime', 'Heure du tirage (fuseau du serveur)', 'time'),
    f('lotteryPotPercent', 'Part de la cagnotte reversée', 'percent', { min: 0 }), f('lotteryChannel', 'Salon des tirages', 'channel'),
  ] },
  { title: 'Drops', fields: [
    f('dropsEnabled', 'Drops activés', 'boolean'), f('dropsChannels', 'Salons des drops', 'channels'),
    f('dropsInterval', 'Intervalle minimum', 'duration'), f('dropsChance', 'Probabilité par message', 'percent', { min: 0 }),
    f('dropsMin', 'Montant minimum', 'money', { min: 0 }), f('dropsMax', 'Montant maximum', 'money', { min: 0 }), f('dropsClaimWindow', 'Durée pour récupérer', 'duration'),
  ] },
];

export const SHOP_FIELDS: FieldDef[] = [
  f('name', 'Nom', 'text', { required: true }), f('category', 'Catégorie', 'text'), f('price', 'Prix', 'money', { min: 0, required: true }),
  f('stock', 'Stock (vide = illimité)', 'integer', { min: 0 }), f('maxPerMember', 'Maximum par membre', 'integer', { min: 1 }),
  f('roleReward', 'Rôle attribué à l\'achat', 'role'), f('usable', 'Utilisable', 'boolean'), f('sellable', 'Revendable', 'boolean'),
  f('sellPrice', 'Prix de revente', 'money', { min: 0 }), f('tradable', 'Échangeable entre membres', 'boolean'),
  f('requiredRole', 'Rôle requis pour acheter', 'role'), f('enabled', 'En vente', 'boolean'),
  f('description', 'Description', 'textarea', { wide: true }),
];
export const SHOP_COLUMNS: Column[] = [{ key: 'name', label: 'Article' }, { key: 'category', label: 'Catégorie' }, { key: 'price', label: 'Prix', className: 'text-right tabular-nums' }, { key: 'stock', label: 'Stock', className: 'text-right tabular-nums' }, { key: 'enabled', label: 'En vente' }];

export const JOB_FIELDS: FieldDef[] = [
  f('name', 'Nom du métier', 'text', { required: true }), f('salaryMin', 'Salaire minimum', 'money', { min: 0 }), f('salaryMax', 'Salaire maximum', 'money', { min: 0 }),
  f('cooldown', 'Délai de travail', 'duration'), f('requiredRole', 'Rôle requis', 'role'), f('requiredLevel', 'Niveau requis', 'integer', { min: 0 }),
  f('description', 'Description', 'textarea', { wide: true }),
];
export const JOB_COLUMNS: Column[] = [{ key: 'name', label: 'Métier' }, { key: 'salaryMin', label: 'Min.', className: 'text-right' }, { key: 'salaryMax', label: 'Max.', className: 'text-right' }, { key: 'requiredLevel', label: 'Niveau' }];

export const MISSION_FIELDS: FieldDef[] = [
  f('name', 'Nom', 'text', { required: true }), f('type', 'Objectif', 'select', { options: [
    { value: 'messages', label: 'Envoyer des messages' }, { value: 'voice', label: 'Temps en vocal' }, { value: 'work', label: 'Travailler' },
    { value: 'spend', label: 'Dépenser' }, { value: 'earn', label: 'Gagner' }, { value: 'games', label: 'Jouer' } ] }),
  f('target', 'Valeur à atteindre', 'integer', { min: 1 }), f('period', 'Période', 'select', { options: [{ value: 'daily', label: 'Quotidienne' }, { value: 'weekly', label: 'Hebdomadaire' }, { value: 'once', label: 'Unique' }] }),
  f('reward', 'Récompense', 'money', { min: 0 }), f('rewardItem', 'Objet offert (identifiant)', 'text'), f('enabled', 'Active', 'boolean'),
];
export const MISSION_COLUMNS: Column[] = [{ key: 'name', label: 'Mission' }, { key: 'type', label: 'Objectif' }, { key: 'target', label: 'Valeur' }, { key: 'period', label: 'Période' }, { key: 'reward', label: 'Récompense' }];

export const ACHIEVEMENT_FIELDS: FieldDef[] = [
  f('name', 'Nom', 'text', { required: true }), f('condition', 'Condition', 'select', { options: [
    { value: 'balance', label: 'Atteindre un solde' }, { value: 'earned', label: 'Gains cumulés' }, { value: 'streak', label: 'Série de journaliers' },
    { value: 'purchases', label: 'Nombre d\'achats' }, { value: 'games_won', label: 'Parties gagnées' }, { value: 'messages', label: 'Messages envoyés' } ] }),
  f('threshold', 'Seuil', 'integer', { min: 1 }), f('reward', 'Récompense', 'money', { min: 0 }), f('roleReward', 'Rôle offert', 'role'),
  f('hidden', 'Succès secret', 'boolean'), f('description', 'Description', 'textarea', { wide: true }),
];
export const ACHIEVEMENT_COLUMNS: Column[] = [{ key: 'name', label: 'Succès' }, { key: 'condition', label: 'Condition' }, { key: 'threshold', label: 'Seuil' }, { key: 'reward', label: 'Récompense' }, { key: 'unlockedCount', label: 'Débloqué par' }];
