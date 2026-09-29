import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import {
  videoCardSchema, playlistSchema, queryVideos, VIDEO_SELECT, VISIBLE, mapVideo, one, getPlaylists,
} from '../lib/server';

const categorySchema = z.object({ id: z.string(), name: z.string(), slug: z.string(), count: z.number() });
const creatorSchema = z.object({
  userId: z.string(), username: z.string(), displayName: z.string(), avatarUrl: z.string().nullable(),
  followers: z.number(), videoCount: z.number(),
});
const commentSchema = z.object({
  id: z.string(), content: z.string(), createdAt: z.string(), edited: z.boolean(),
  userId: z.string(), name: z.string(), username: z.string().nullable(), avatarUrl: z.string().nullable(),
});
const POPULAR = `("likeCount" * 5 + COALESCE(v."views",0)) DESC, v.created_at DESC`;

export default createEndpoint({
  description: 'Lit les données publiques de la plateforme (accueil, explorer, recherche, vidéo, profil, playlist)',
  inputSchema: z.object({
    view: z.enum(['home', 'explore', 'search', 'video', 'profile', 'playlist']),
    id: z.string().optional(),
    q: z.string().optional(),
    category: z.string().optional(),
    sort: z.enum(['recent', 'popular']).optional(),
  }),
  outputSchema: z.object({
    videos: z.array(videoCardSchema).optional(),
    featured: videoCardSchema.nullable().optional(),
    popular: z.array(videoCardSchema).optional(),
    recent: z.array(videoCardSchema).optional(),
    recommended: z.array(videoCardSchema).optional(),
    categories: z.array(categorySchema).optional(),
    creators: z.array(creatorSchema).optional(),
    video: videoCardSchema.extend({ description: z.string() }).nullable().optional(),
    viewer: z.object({ liked: z.boolean(), favorited: z.boolean(), following: z.boolean() }).optional(),
    uploaderFollowers: z.number().optional(),
    comments: z.array(commentSchema).optional(),
    profile: creatorSchema.extend({ bio: z.string(), createdAt: z.string(), following: z.number() }).nullable().optional(),
    isFollowing: z.boolean().optional(),
    playlists: z.array(playlistSchema).optional(),
    playlist: playlistSchema.extend({ ownerName: z.string(), ownerUsername: z.string().nullable() }).nullable().optional(),
  }),
  execute: async ({ input, context }) => {
    const viewerId: string | undefined = (context as { user?: { id?: string } | null }).user?.id ?? undefined;

    if (input.view === 'home') {
      const [popular, recent, categories, creators] = await Promise.all([
        queryVideos('', POPULAR, 12),
        queryVideos('', 'v.created_at DESC', 12),
        getCategories(),
        getCreators(8),
      ]);
      let recommended: typeof popular = [];
      if (viewerId) {
        recommended = await queryVideos(
          `cv."categoriesId" IN (
            SELECT cv2."categoriesId" FROM "CategoriesVideos" cv2
            WHERE cv2."videosId" IN (
              SELECT lv."videosId" FROM "LikesVideos" lv JOIN "Likes" l ON l.id = lv."likesId" WHERE l."user"->>0 = $1
              UNION SELECT hv."videosId" FROM "HistoryVideos" hv JOIN "History" h ON h.id = hv."historyId" WHERE h."user"->>0 = $1
            ))
           AND v.id NOT IN (SELECT hv."videosId" FROM "HistoryVideos" hv JOIN "History" h ON h.id = hv."historyId" WHERE h."user"->>0 = $1)`,
          'random()', 8, [viewerId],
        );
      }
      if (recommended.length < 4) recommended = await queryVideos('', 'random()', 8);
      return { featured: popular[0] ?? null, popular, recent, recommended, categories, creators };
    }

    if (input.view === 'explore') {
      const order = input.sort === 'popular' ? POPULAR : 'v.created_at DESC';
      const videos = input.category
        ? await queryVideos('c."slug" = $1', order, 60, [input.category])
        : await queryVideos('', order, 60);
      return { videos, categories: await getCategories() };
    }

    if (input.view === 'search') {
      const q = (input.q ?? '').trim();
      if (!q) return { videos: [], creators: [] };
      const videos = await queryVideos(
        `(v."title" ILIKE $1 OR v."creatorName" ILIKE $1 OR c."name" ILIKE $1 OR p."displayName" ILIKE $1)`,
        'v.created_at DESC', 48, [`%${q}%`],
      );
      const lq = q.toLowerCase();
      const creators = (await getCreators(100))
        .filter((c) => c.displayName.toLowerCase().includes(lq) || c.username.toLowerCase().includes(lq))
        .slice(0, 6);
      return { videos, creators };
    }

    if (input.view === 'video') {
      const id = input.id ?? '';
      const res = await zite.sql({ query: `${VIDEO_SELECT} WHERE v.id::text = $1 AND ${VISIBLE}`, params: [id] });
      const row = res.rows[0];
      if (!row) return { video: null };
      const base = mapVideo(row);
      const rec = await zite.videos.findOne({ id });

      // Internal view counter + viewer history (platform data, not YouTube).
      await zite.videos.update({ id, record: { views: (rec?.views ?? 0) + 1 } as never });
      base.views += 1;
      let viewer = { liked: false, favorited: false, following: false };
      if (viewerId) {
        const [liked, fav, follow, existing] = await Promise.all([
          zite.likes.findOne({ filters: { user: viewerId, video: id } }),
          zite.favorites.findOne({ filters: { user: viewerId, video: id } }),
          base.uploaderId ? zite.subscriptions.findOne({ filters: { follower: viewerId, creator: base.uploaderId } }) : undefined,
          zite.history.findOne({ filters: { user: viewerId, video: id } }),
        ]);
        viewer = { liked: !!liked, favorited: !!fav, following: !!follow };
        const now = new Date().toISOString();
        if (existing) await zite.history.update({ id: existing.id, record: { watchedAt: now } as never });
        else await zite.history.create({ record: { user: viewerId, video: [id], watchedAt: now } });
      }

      const [comments, followers, sameCat] = await Promise.all([
        getComments(id),
        base.uploaderId ? countFollowers(base.uploaderId) : Promise.resolve(0),
        base.categorySlug
          ? queryVideos(`v.id::text <> $1 AND c."slug" = $2`, 'random()', 10, [id, base.categorySlug])
          : Promise.resolve([]),
      ]);
      const seen = new Set(sameCat.map((v) => v.id));
      const more = sameCat.length < 8
        ? (await queryVideos(`v.id::text <> $1`, 'random()', 10, [id])).filter((v) => !seen.has(v.id))
        : [];
      return {
        video: { ...base, description: rec?.description ?? '' },
        viewer,
        uploaderFollowers: followers,
        comments,
        recommended: [...sameCat, ...more].slice(0, 10),
      };
    }

    if (input.view === 'profile') {
      const key = input.id ?? '';
      const p = (await zite.profiles.findOne({ filters: { username: key } }))
        ?? (await zite.profiles.findOne({ filters: { user: key } }));
      const userId = one(p?.user);
      if (!p || !userId) return { profile: null };
      const [followers, following, videos, playlists, follow] = await Promise.all([
        countFollowers(userId),
        zite.sql({ query: `SELECT COUNT(*) AS n FROM "Subscriptions" WHERE "follower"->>0 = $1`, params: [userId] }),
        queryVideos(`v."uploader"->>0 = $1`, 'v.created_at DESC', 60, [userId]),
        getPlaylists(userId, viewerId === userId),
        viewerId ? zite.subscriptions.findOne({ filters: { follower: viewerId, creator: userId } }) : undefined,
      ]);
      return {
        profile: {
          userId, username: p.username ?? '', displayName: p.displayName || p.username || 'Membre',
          avatarUrl: p.avatarUrl || null, bio: p.bio ?? '', createdAt: p.createdAt ?? '',
          followers, following: Number(following.rows[0]?.n ?? 0), videoCount: videos.length,
        },
        videos, playlists, isFollowing: !!follow,
      };
    }

    // playlist
    const pl = input.id ? await zite.playlists.findOne({ id: input.id }) : undefined;
    const ownerId = one(pl?.owner);
    if (!pl || !ownerId || (pl.visibility !== 'Public' && ownerId !== viewerId)) return { playlist: null };
    const owner = await zite.profiles.findOne({ filters: { user: ownerId } });
    const videos = await queryVideos(
      `v.id IN (SELECT piv."videosId" FROM "PlaylistItemsVideos" piv JOIN "PlaylistItemsPlaylists" pip ON pip."playlistItemsId" = piv."playlistItemsId" WHERE pip."playlistsId"::text = $1)`,
      'v.created_at DESC', 200, [pl.id],
    );
    return {
      playlist: {
        id: pl.id, name: pl.name ?? '', description: pl.description ?? '',
        visibility: pl.visibility === 'Public' ? ('public' as const) : ('private' as const),
        ownerId, count: videos.length, cover: videos[0]?.thumbnailUrl ?? null,
        ownerName: owner?.displayName || owner?.username || 'Membre', ownerUsername: owner?.username ?? null,
      },
      videos,
    };
  },
});

async function getCategories() {
  const res = await zite.sql({
    query: `SELECT c.id, c."name", c."slug", COUNT(v.id) AS n
      FROM "Categories" c
      LEFT JOIN "CategoriesVideos" cv ON cv."categoriesId" = c.id
      LEFT JOIN "Videos" v ON v.id = cv."videosId" AND ${VISIBLE}
      GROUP BY c.id ORDER BY COALESCE(c."sortOrder", 999), c."name"`,
  });
  return res.rows.map((r) => ({ id: String(r.id), name: String(r.name ?? ''), slug: String(r.slug ?? ''), count: Number(r.n ?? 0) }));
}

async function getCreators(limit: number) {
  const res = await zite.sql({
    query: `SELECT p."user"->>0 AS "userId", p."username", p."displayName", p."avatarUrl", u."image",
      (SELECT COUNT(*) FROM "Subscriptions" s WHERE s."creator"->>0 = p."user"->>0) AS followers,
      (SELECT COUNT(*) FROM "Videos" v WHERE v."uploader"->>0 = p."user"->>0 AND ${VISIBLE}) AS "videoCount"
      FROM "Profiles" p LEFT JOIN "ziteUsers" u ON u.id = p."user"->>0
      ORDER BY followers DESC, "videoCount" DESC LIMIT ${limit}`,
  });
  return res.rows
    .filter((r) => r.userId)
    .map((r) => ({
      userId: String(r.userId), username: String(r.username ?? ''),
      displayName: String(r.displayName || r.username || 'Membre'),
      avatarUrl: (r.avatarUrl as string) || (r.image as string) || null,
      followers: Number(r.followers ?? 0), videoCount: Number(r.videoCount ?? 0),
    }));
}

async function countFollowers(userId: string) {
  const r = await zite.sql({ query: `SELECT COUNT(*) AS n FROM "Subscriptions" WHERE "creator"->>0 = $1`, params: [userId] });
  return Number(r.rows[0]?.n ?? 0);
}

async function getComments(videoId: string) {
  const res = await zite.sql({
    query: `SELECT cm.id, cm."content", cm.created_at AS "createdAt", cm.updated_at AS "updatedAt", cm."user"->>0 AS "userId",
      p."displayName", p."username", p."avatarUrl", u."name" AS "uName", u."image" AS "uImage"
      FROM "Comments" cm
      JOIN "CommentsVideos" cmv ON cmv."commentsId" = cm.id
      LEFT JOIN "Profiles" p ON p."user"->>0 = cm."user"->>0
      LEFT JOIN "ziteUsers" u ON u.id = cm."user"->>0
      WHERE cmv."videosId"::text = $1 ORDER BY cm.created_at DESC LIMIT 200`,
    params: [videoId],
  });
  return res.rows.map((r) => ({
    id: String(r.id), content: String(r.content ?? ''), createdAt: String(r.createdAt ?? ''),
    edited: !!r.updatedAt && new Date(String(r.updatedAt)).getTime() - new Date(String(r.createdAt)).getTime() > 5000,
    userId: String(r.userId ?? ''), name: String(r.displayName || r.uName || 'Membre'),
    username: (r.username as string) || null, avatarUrl: (r.avatarUrl as string) || (r.uImage as string) || null,
  }));
}
