# Contrat d'API — Panel ClashBot

Le panel est **100 % frontend**. Toutes les données viennent du backend ClashBot (Railway) adossé à Supabase.
Aucune route n'est simulée côté panel : si une route manque, l'écran affiche « Intégration requise » avec la route attendue.

## Généralités

- Base : `VITE_CLASHBOT_API_URL` (build) ou Paramètres → Connexion au backend.
- Authentification : session Discord OAuth gérée par le backend (cookie, `credentials: 'include'`) et/ou `Authorization: Bearer <jeton>`.
- **Chaque route vérifie les permissions côté backend.** Le panel ne masque des boutons qu'à titre indicatif.
- Format JSON. Listes paginées : `{ items, total, page, pageSize }` (paramètres `page`, `pageSize`).
- Erreurs : statut HTTP + `{ message: string }` en français. Codes interprétés : 401 (connexion), 403 (permission), 404, 422 (validation), 429 (limite), 501 (non implémenté → « Intégration requise »), 5xx.
- Ne renvoyer un succès (2xx) **qu'après exécution réelle** (envoi Discord effectué, écriture Supabase validée).
- Configuration économique et modules : **aucune valeur par défaut**. Champ absent ou `null` = « Non configuré ».

## Système et session

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/status` | `{ bot: { online, latencyMs, uptimeSec, version }, backend: { ok, latencyMs }, supabase: { ok, latencyMs } }` |
| GET | `/auth/me` | Administrateur connecté `{ id, username, globalName, avatarUrl, role, permissions[] }` |
| GET | `/auth/login-url?redirect=` | URL OAuth Discord |
| POST | `/auth/logout` | Fermeture de session |
| GET | `/search?q=` | Recherche globale `[{ type, id, label, sub, href }]` |
| GET | `/notifications` · POST `/notifications/read` `{ ids }` | Centre de notifications |
| POST | `/uploads` (multipart `file`, `purpose`) | Stockage d'image → `{ url }` |

## Statistiques

| GET | `/stats/overview?range=24h|7d|30d|90d&guildId=` | Indicateurs, séries `activity`, `growth`, `economy`, `moduleUsage`, `topCommands`, `events`, `alerts` |
|---|---|---|
| GET | `/stats/series?metric=&range=&guildId=&compare=1` | `{ current: [{date,value}], previous?, breakdown? }` |
| GET | `/stats/export?…` | `{ url }` d'un fichier généré |

## Serveurs, membres, commandes

- `GET /guilds` (`search`, `status`, `sort`) · `GET /guilds/:id` (détail, modules, rôles, salons, historique)
- `GET /guilds/:id/roles` · `GET /guilds/:id/channels` · `PATCH /guilds/:id/modules/:key { enabled }`
- `GET|PUT /guilds/:id/settings { timezone }` — fuseau IANA du serveur
- `GET /members` (`guildId`, `search`, `sort`) · `GET /guilds/:id/members/:userId` · `GET /guilds/:id/members/search?q=`
- `GET /commands?guildId=` (catalogue réel enregistré) · `PATCH /guilds/:id/commands/:name { enabled }` · `GET /commands/history`

## Configuration par serveur (générique)

- `GET|PUT /guilds/:id/<section>/config` — sections : `economy/currency`, `economy/rewards`, `economy/activities`, `economy/bank`, `economy/fun`, `support`, `tts`, `bump`.
- Collections CRUD `GET|POST /guilds/:id/<path>`, `PUT|DELETE /guilds/:id/<path>/:itemId` — chemins :
  `economy/shop`, `economy/jobs`, `economy/missions`, `economy/achievements`, `messages/automatic`, `social/{youtube,twitch,spotify,tiktok}`,
  `support/categories`, `roles/auto`, `roles/bindings`.
- Historiques en lecture : `social/<plateforme>/history`, `support/tickets`, `support/logs`, `support/stats` (GET simple), `tts/usage`, `bump/history`, `roles/history`.

## Économie

- `GET /guilds/:id/economy/accounts` · `GET /guilds/:id/economy/transactions` (`search`, `userId`, `type`, `direction`, `from`, `to`)
- `POST /guilds/:id/economy/accounts/:userId/adjust { target: 'wallet'|'bank', amount, reason }` — journalisé
- `GET /guilds/:id/economy/leaderboard?by=total|wallet|bank`
- **Journalier** : réinitialisation au changement de **date civile** dans le fuseau du serveur (pas un délai glissant de 24 h).

## Messages et éditeur

- Profils d'expéditeur : `GET|POST /sender-profiles`, `PUT|DELETE /sender-profiles/:id` (`useWebhook` pour nom/avatar personnalisés).
- Modèles / brouillons : `GET|POST /guilds/:id/messages/{templates|drafts}`, `PUT|DELETE …/:tid`.
- Messages de module : `GET|PUT /guilds/:id/messages/modules/:module` — `join`, `leave`, `welcome-dm`, `rules`, `moderation`, `notifications`, `support-panel`, `support-open`.
- Envoi réel : `POST /guilds/:id/messages/send { channelId, message, scheduledFor? }`.
- Récupération : `GET /guilds/:id/channels/:channelId/messages/:messageId`.
- Publiés : `GET /guilds/:id/messages/history?status=`, `PUT|DELETE /guilds/:id/messages/published/:id`.
- Le format `message` est défini dans `src/types/message.ts` (contenu, embeds, rangées de composants, profil d'expéditeur).

## #clashbot-infos

- `GET /announcements/channels` · `GET /announcements` · `POST /announcements { guildId, channelId, title, message }`

## TTS, bump

- `GET /tts/status` · `GET /tts/voices`
- `GET /guilds/:id/bump?range=` · `GET /bump/leaderboard`

## Journaux et administrateurs

- `GET /logs` (`search`, `category`, `level`, `guildId`, `from`, `to`) · `GET /logs/categories` — **lecture seule**, aucune route de modification.
- `GET|POST /admins`, `PUT|DELETE /admins/:id`, `GET /admins/roles`.
