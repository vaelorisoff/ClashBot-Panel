import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { one, isAdmin, forbid, extractYouTubeId } from '../lib/server';

const bad = (msg: string) => new ZiteError({ code: 'BAD_REQUEST', message: msg, userFacingMessage: msg });

export default createEndpoint({
  description: "Toutes les actions de l'utilisateur connecté : j'aime, favoris, abonnements, commentaires, playlists, historique, profil et publications",
  authenticated: true,
  inputSchema: z.object({
    action: z.enum([
      'toggleLike', 'toggleFavorite', 'toggleFollow',
      'addComment', 'editComment', 'deleteComment',
      'createPlaylist', 'updatePlaylist', 'deletePlaylist', 'togglePlaylistItem', 'playlistsForVideo',
      'removeHistory', 'clearHistory',
      'updateProfile',
      'previewVideo', 'saveVideo', 'deleteVideo', 'getVideoForEdit',
    ]),
    id: z.string().optional(),
    videoId: z.string().optional(),
    creatorId: z.string().optional(),
    playlistId: z.string().optional(),
    content: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    visibility: z.enum(['public', 'private']).optional(),
    username: z.string().optional(),
    displayName: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    youtube: z.string().optional(),
    title: z.string().optional(),
    creatorName: z.string().optional(),
    categoryId: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    active: z.boolean().optional(),
    id: z.string().optional(),
    preview: z.object({ youTubeId: z.string(), title: z.string(), author: z.string(), thumbnailUrl: z.string() }).optional(),
    playlists: z.array(z.object({ id: z.string(), name: z.string(), visibility: z.string(), contains: z.boolean() })).optional(),
    video: z.object({
      id: z.string(), youTubeId: z.string(), title: z.string(), creatorName: z.string(), categoryId: z.string().nullable(),
      thumbnailUrl: z.string(), description: z.string(),
    }).optional(),
  }),
  execute: async ({ input, context }) => {
    const me = context.user.id;
    const need = <T,>(v: T | undefined, label: string): T => {
      if (v === undefined || v === '') throw bad(`${label} manquant.`);
      return v;
    };

    switch (input.action) {
      case 'toggleLike':
      case 'toggleFavorite': {
        const videoId = need(input.videoId, 'Vidéo');
        const table = input.action === 'toggleLike' ? zite.likes : zite.favorites;
        const existing = await table.findOne({ filters: { user: me, video: videoId } });
        if (existing) { await table.delete({ id: existing.id }); return { ok: true, active: false }; }
        await table.create({ record: { user: me, video: [videoId] } });
        return { ok: true, active: true };
      }
      case 'toggleFollow': {
        const creatorId = need(input.creatorId, 'Créateur');
        if (creatorId === me) throw bad('Vous ne pouvez pas vous suivre vous-même.');
        const existing = await zite.subscriptions.findOne({ filters: { follower: me, creator: creatorId } });
        if (existing) { await zite.subscriptions.delete({ id: existing.id }); return { ok: true, active: false }; }
        await zite.subscriptions.create({ record: { follower: me, creator: creatorId } });
        return { ok: true, active: true };
      }

      case 'addComment': {
        const content = need(input.content?.trim(), 'Commentaire').slice(0, 2000);
        const c = await zite.comments.create({ record: { content, user: me, video: [need(input.videoId, 'Vidéo')] } });
        return { ok: true, id: c.id };
      }
      case 'editComment':
      case 'deleteComment': {
        const c = await zite.comments.findOne({ id: need(input.id, 'Commentaire') });
        if (!c) throw bad('Commentaire introuvable.');
        const owner = one(c.user) === me;
        if (input.action === 'editComment') {
          if (!owner) throw forbid();
          await zite.comments.update({ id: c.id, record: { content: need(input.content?.trim(), 'Commentaire').slice(0, 2000) } as never });
        } else {
          if (!owner && !(await isAdmin(me))) throw forbid();
          await zite.comments.delete({ id: c.id });
        }
        return { ok: true };
      }

      case 'createPlaylist': {
        const pl = await zite.playlists.create({
          record: {
            name: need(input.name?.trim(), 'Nom').slice(0, 100), description: input.description ?? '', owner: me,
            visibility: input.visibility === 'public' ? 'Public' : 'Privé', playlistItems: null,
          },
        });
        if (input.videoId) await zite.playlistItems.create({ record: { playlist: [pl.id], video: [input.videoId], position: 1 } });
        return { ok: true, id: pl.id };
      }
      case 'updatePlaylist':
      case 'deletePlaylist': {
        const pl = await zite.playlists.findOne({ id: need(input.id, 'Playlist') });
        if (!pl || one(pl.owner) !== me) throw forbid();
        if (input.action === 'deletePlaylist') {
          const items = await zite.playlistItems.findAll({ filters: { playlist: pl.id }, limit: 2000 });
          await Promise.all(items.records.map((i) => zite.playlistItems.delete({ id: i.id })));
          await zite.playlists.delete({ id: pl.id });
        } else {
          const record: Record<string, string> = {};
          if (input.name !== undefined) record.name = need(input.name.trim(), 'Nom').slice(0, 100);
          if (input.description !== undefined) record.description = input.description;
          if (input.visibility) record.visibility = input.visibility === 'public' ? 'Public' : 'Privé';
          await zite.playlists.update({ id: pl.id, record: record as never });
        }
        return { ok: true };
      }
      case 'togglePlaylistItem': {
        const playlistId = need(input.playlistId, 'Playlist');
        const videoId = need(input.videoId, 'Vidéo');
        const pl = await zite.playlists.findOne({ id: playlistId });
        if (!pl || one(pl.owner) !== me) throw forbid();
        const existing = await zite.playlistItems.findOne({ filters: { playlist: playlistId, video: videoId } });
        if (existing) { await zite.playlistItems.delete({ id: existing.id }); return { ok: true, active: false }; }
        const count = await zite.sql({ query: `SELECT COUNT(*) AS n FROM "PlaylistItemsPlaylists" WHERE "playlistsId"::text = $1`, params: [playlistId] });
        await zite.playlistItems.create({ record: { playlist: [playlistId], video: [videoId], position: Number(count.rows[0]?.n ?? 0) + 1 } });
        return { ok: true, active: true };
      }
      case 'playlistsForVideo': {
        const res = await zite.sql({
          query: `SELECT pl.id, pl."name", pl."visibility",
            EXISTS (SELECT 1 FROM "PlaylistItemsPlaylists" pip JOIN "PlaylistItemsVideos" piv ON piv."playlistItemsId" = pip."playlistItemsId"
              WHERE pip."playlistsId" = pl.id AND piv."videosId"::text = $2) AS contains
            FROM "Playlists" pl WHERE pl."owner"->>0 = $1 ORDER BY pl.created_at DESC`,
          params: [me, input.videoId ?? ''],
        });
        return {
          ok: true,
          playlists: res.rows.map((r) => ({ id: String(r.id), name: String(r.name ?? ''), visibility: String(r.visibility ?? ''), contains: !!r.contains })),
        };
      }

      case 'removeHistory': {
        const h = await zite.history.findOne({ id: need(input.id, 'Élément') });
        if (!h || one(h.user) !== me) throw forbid();
        await zite.history.delete({ id: h.id });
        return { ok: true };
      }
      case 'clearHistory': {
        const all = await zite.history.findAll({ filters: { user: me }, limit: 2000 });
        await Promise.all(all.records.map((h) => zite.history.delete({ id: h.id })));
        return { ok: true };
      }

      case 'updateProfile': {
        const p = await zite.profiles.findOne({ filters: { user: me } });
        if (!p) throw bad('Profil introuvable.');
        const username = need(input.username?.trim().toLowerCase(), "Nom d'utilisateur");
        if (!/^[a-z0-9_]{3,24}$/.test(username)) throw bad("Nom d'utilisateur : 3 à 24 caractères (lettres, chiffres, _).");
        const taken = await zite.profiles.findOne({ filters: { username } });
        if (taken && taken.id !== p.id) throw bad("Ce nom d'utilisateur est déjà pris.");
        await zite.profiles.update({
          id: p.id,
          record: {
            username, displayName: need(input.displayName?.trim(), 'Nom affiché').slice(0, 60),
            bio: (input.bio ?? '').slice(0, 500), avatarUrl: input.avatarUrl || null,
          } as never,
        });
        return { ok: true };
      }

      case 'previewVideo': {
        const ytId = extractYouTubeId(need(input.youtube, 'Lien YouTube'));
        if (!ytId) throw bad('Lien ou identifiant YouTube invalide.');
        const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${ytId}`)}`);
        if (!res.ok) throw bad("Cette vidéo est introuvable, privée ou son intégration n'est pas autorisée par son propriétaire.");
        const data = (await res.json()) as { title?: string; author_name?: string };
        return {
          ok: true,
          preview: {
            youTubeId: ytId, title: data.title ?? '', author: data.author_name ?? '',
            thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          },
        };
      }
      case 'getVideoForEdit': {
        const v = await zite.videos.findOne({ id: need(input.id, 'Vidéo') });
        if (!v) throw bad('Vidéo introuvable.');
        if (one(v.uploader) !== me && !(await isAdmin(me))) throw forbid();
        return {
          ok: true,
          video: {
            id: v.id, youTubeId: v.youTubeId ?? '', title: v.title ?? '', creatorName: v.creatorName ?? '',
            categoryId: one(v.category) ?? null, thumbnailUrl: v.thumbnailUrl ?? '', description: v.description ?? '',
          },
        };
      }
      case 'saveVideo': {
        const ytId = extractYouTubeId(need(input.youtube, 'Lien YouTube'));
        if (!ytId) throw bad('Lien ou identifiant YouTube invalide.');
        const record = {
          title: need(input.title?.trim(), 'Titre').slice(0, 200),
          youTubeId: ytId,
          creatorName: need(input.creatorName?.trim(), 'Créateur').slice(0, 120),
          category: input.categoryId ? [input.categoryId] : null,
          thumbnailUrl: input.thumbnailUrl?.trim() || null,
          description: (input.description ?? '').slice(0, 5000),
        };
        if (input.id) {
          const v = await zite.videos.findOne({ id: input.id });
          if (!v) throw bad('Vidéo introuvable.');
          if (one(v.uploader) !== me && !(await isAdmin(me))) throw forbid();
          await zite.videos.update({ id: v.id, record: record as never });
          return { ok: true, id: v.id };
        }
        const created = await zite.videos.create({
          record: {
            ...record, uploader: me, status: 'Publiée', views: 0,
            likes: null, comments: null, playlistItems: null, favorites: null, history: null,
          },
        });
        return { ok: true, id: created.id };
      }
      case 'deleteVideo': {
        const v = await zite.videos.findOne({ id: need(input.id, 'Vidéo') });
        if (!v) throw bad('Vidéo introuvable.');
        if (one(v.uploader) !== me && !(await isAdmin(me))) throw forbid();
        await zite.videos.delete({ id: v.id });
        return { ok: true };
      }
    }
  },
});
