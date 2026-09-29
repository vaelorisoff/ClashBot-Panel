import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import {
  ADMIN_EMAILS, profileSchema, videoCardSchema, playlistSchema, queryVideos, findProfile, getPlaylists,
} from '../lib/server';

const creatorSchema = z.object({
  userId: z.string(), username: z.string(), displayName: z.string(), avatarUrl: z.string().nullable(),
});

export default createEndpoint({
  description: "Charge la session de l'utilisateur connecté (crée son profil au besoin) et sa bibliothèque",
  authenticated: true,
  inputSchema: z.object({ section: z.enum(['session', 'library']) }),
  outputSchema: z.object({
    profile: profileSchema.optional(),
    history: z.array(videoCardSchema.extend({ watchedAt: z.string(), historyId: z.string() })).optional(),
    liked: z.array(videoCardSchema).optional(),
    favorites: z.array(videoCardSchema).optional(),
    playlists: z.array(playlistSchema).optional(),
    following: z.array(creatorSchema).optional(),
    feed: z.array(videoCardSchema).optional(),
  }),
  execute: async ({ input, context }) => {
    const u = context.user;

    if (input.section === 'session') {
      let p = await findProfile(u.id);
      const shouldBeAdmin = ADMIN_EMAILS.includes(u.email.toLowerCase());
      if (!p) {
        const base = (u.email.split('@')[0] || 'membre').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'membre';
        let username = base;
        for (let i = 0; i < 5 && (await zite.profiles.findOne({ filters: { username } })); i++) {
          username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
        }
        const display = [u.firstName, u.lastName].filter(Boolean).join(' ') || username;
        const [created] = (await zite.profiles.bulkCreate({
          records: [{
            username, displayName: display, user: u.id, avatarUrl: null, bio: '',
            role: shouldBeAdmin ? 'Administrateur' : 'Utilisateur',
          }],
          matchOn: ['user'],
        })).records;
        p = created;
      } else if (shouldBeAdmin && p.role !== 'Administrateur') {
        await zite.profiles.update({ id: p.id, record: { role: 'Administrateur' } as never });
        p = { ...p, role: 'Administrateur' };
      }
      return {
        profile: {
          id: p.id, userId: u.id, username: p.username ?? '', displayName: p.displayName ?? '',
          avatarUrl: p.avatarUrl || null, bio: p.bio ?? '',
          role: p.role === 'Administrateur' ? ('admin' as const) : ('user' as const),
          createdAt: p.createdAt ?? new Date().toISOString(),
        },
      };
    }

    const historyRows = await zite.sql({
      query: `SELECT h.id AS "historyId", h."watchedAt", hv."videosId" AS "videoId" FROM "History" h
        JOIN "HistoryVideos" hv ON hv."historyId" = h.id WHERE h."user"->>0 = $1
        ORDER BY h."watchedAt" DESC NULLS LAST LIMIT 100`,
      params: [u.id],
    });
    const ids = historyRows.rows.map((r) => String(r.videoId));
    const [hVideos, liked, favorites, playlists, followingRes] = await Promise.all([
      ids.length ? queryVideos(`v.id::text = ANY($1)`, 'v.created_at DESC', 100, [ids]) : Promise.resolve([]),
      queryVideos(`v.id IN (SELECT lv."videosId" FROM "LikesVideos" lv JOIN "Likes" l ON l.id = lv."likesId" WHERE l."user"->>0 = $1)`, 'v.created_at DESC', 200, [u.id]),
      queryVideos(`v.id IN (SELECT fv."videosId" FROM "FavoritesVideos" fv JOIN "Favorites" f ON f.id = fv."favoritesId" WHERE f."user"->>0 = $1)`, 'v.created_at DESC', 200, [u.id]),
      getPlaylists(u.id, true),
      zite.sql({
        query: `SELECT s."creator"->>0 AS "userId", p."username", p."displayName", p."avatarUrl", zu."image"
          FROM "Subscriptions" s LEFT JOIN "Profiles" p ON p."user"->>0 = s."creator"->>0
          LEFT JOIN "ziteUsers" zu ON zu.id = s."creator"->>0
          WHERE s."follower"->>0 = $1 ORDER BY s.created_at DESC`,
        params: [u.id],
      }),
    ]);
    const byId = new Map(hVideos.map((v) => [v.id, v]));
    const history = historyRows.rows.flatMap((r) => {
      const v = byId.get(String(r.videoId));
      return v ? [{ ...v, watchedAt: String(r.watchedAt ?? ''), historyId: String(r.historyId) }] : [];
    });
    const following = followingRes.rows.filter((r) => r.userId).map((r) => ({
      userId: String(r.userId), username: String(r.username ?? ''),
      displayName: String(r.displayName || r.username || 'Membre'),
      avatarUrl: (r.avatarUrl as string) || (r.image as string) || null,
    }));
    const followIds = following.map((f) => f.userId);
    const feed = followIds.length
      ? await queryVideos(`v."uploader"->>0 = ANY($1)`, 'v.created_at DESC', 60, [followIds])
      : [];
    return { history, liked, favorites, playlists, following, feed };
  },
});
