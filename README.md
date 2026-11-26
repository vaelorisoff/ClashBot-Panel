# ClashBot — Panel d'administration

Panel React + TypeScript + Vite, entièrement en français, destiné à être intégré au dépôt GitHub de ClashBot et déployé sur Railway.

## Principes

- **Frontend uniquement.** Le backend ClashBot et Supabase restent les seules sources de vérité. Aucune base, authentification ni stockage tiers.
- **Aucune donnée fictive.** Chaque écran gère les états chargement / vide / erreur / non configuré / intégration requise.
- **Aucun faux succès.** Les notifications de réussite ne s'affichent qu'après une réponse 2xx du backend.
- **Configuration indépendante par serveur**, sans valeur imposée par défaut.

## Structure

```
src/
  layouts/        AppLayout, barre latérale rétractable, barre supérieure, recherche globale, navigation
  pages/          Un écran par section (economy/ regroupe l'économie)
  modules/editor/ Éditeur de messages commun (aperçu Discord éditable, embeds, composants, profils, modèles)
  components/     common/ (états, graphiques, mise en page) · forms/ (champs, configuration, collections)
  services/       http.ts (couche HTTP) · clashbot.ts (toutes les routes)
  contexts/       AppContext (thème, session, serveur sélectionné, fuseau)
  hooks/          useApi, useAction
  types/          Types de l'API et du format de message
  utils/          Formatage, horodatages Discord, fuseaux horaires
```

## Configuration

- `VITE_CLASHBOT_API_URL` : URL de l'API du backend (sinon, la renseigner dans Paramètres).
- Le backend doit autoriser l'origine du panel (CORS avec `credentials`).
- Contrat complet des routes : **API.md**.

## Éditeur de messages

`src/modules/editor/` contient l'éditeur commun réutilisé par les annonces, arrivées, départs, règlement, assistance,
notifications sociales et messages automatiques. Les fichiers de rendu de l'éditeur DraftBot sous licence n'ont pas
encore été fournis : l'éditeur actuel est une implémentation propre à ClashBot. Les fichiers autorisés pourront remplacer
`EmbedEditor.tsx`, `Editable.tsx` et `DiscordMarkdown.tsx` en conservant l'interface `DiscordMessage` (`src/types/message.ts`).

## Dépendances partagées

Les composants d'interface (`@project/components/ui/*`) proviennent du paquet partagé `packages/components` du monorepo ;
copiez-le avec l'application lors de l'intégration au dépôt ClashBot.
