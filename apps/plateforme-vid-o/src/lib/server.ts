// Shared server-side helpers for endpoints (not an endpoint itself).
import { z } from 'zod';
import { zite } from 'zitejs/db';
import { ZiteError } from 'zitejs/backend';

export const ADMIN_EMAILS = ['alexandre.bourgeais4@gmail.com'];

export const videoCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  youTubeId: z.string(),
  creatorName: z.string(),
  thumbnailUrl: z.string(),
  categoryName: z.string().nullable(),
  categorySlug: z.string().nullable(),
  views: z.number(),
  likeCount: z.number(),
  createdAt: z.string(),
  uploaderId: z.string().nullable(),
  uploaderName: z.string(),
  uploaderUsername: z.string().nullable(),
  uploaderAvatar: z.string().nullable(),
});
export type VideoCard = z.infer<typeof videoCardSchema>;

export const profileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string(),
});

// Base SELECT for a video card. Append WHERE/ORDER/LIMIT.
export const VIDEO_SELECT = `
  SELECT v.id, v."title", v."youTubeId", v."creatorName", v."thumbnailUrl",
    COALESCE(v."views", 0) AS "views", v.created_at AS "createdAt",
    v."uploader"->>0 AS "uploaderId",
    c."name" AS "categoryName", c."slug" AS "categorySlug",
    p."displayName" AS "pDisplay", p."username" AS "pUsername", p."avatarUrl" AS "pAvatar",
    u."name" AS "uName", u."image" AS "uImage",
    (SELECT COUNT(*) FROM "LikesVideos" lv JOIN "Likes" l ON l.id = lv."likesId" WHERE lv."videosId" = v.id) AS "likeCount"
  FROM "Videos" v
  LEFT JOIN "CategoriesVideos" cv ON cv."videosId" = v.id
  LEFT JOIN "Categories" c ON c.id = cv."categoriesId"
  LEFT JOIN "Profiles" p ON p."user"->>0 = v."uploader"->>0
  LEFT JOIN "ziteUsers" u ON u.id = v."uploader"->>0
`;
export const VISIBLE = `COALESCE(v."status", 'Publiée') <> 'Masquée'`;

const s = (x: unknown) => (x == null ? '' : String(x));
export function mapVideo(r: Record<string, unknown>): VideoCard {
  const yt = s(r.youTubeId);
  return {
    id: s(r.id),
    title: s(r.title),
    youTubeId: yt,
    creatorName: s(r.creatorName),
    thumbnailUrl: s(r.thumbnailUrl) || `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    categoryName: r.categoryName ? s(r.categoryName) : null,
    categorySlug: r.categorySlug ? s(r.categorySlug) : null,
    views: Number(r.views ?? 0),
    likeCount: Number(r.likeCount ?? 0),
    createdAt: s(r.createdAt),
    uploaderId: r.uploaderId ? s(r.uploaderId) : null,
    uploaderName: s(r.pDisplay) || s(r.uName) || 'Membre',
    uploaderUsername: r.pUsername ? s(r.pUsername) : null,
    uploaderAvatar: s(r.pAvatar) || (r.uImage ? s(r.uImage) : '') || null,
  };
}

export async function queryVideos(where: string, order: string, limit: number, params: unknown[] = []) {
  const res = await zite.sql({
    query: `${VIDEO_SELECT} WHERE ${VISIBLE} ${where ? `AND ${where}` : ''} ORDER BY ${order} LIMIT ${Math.floor(limit)}`,
    params,
  });
  return res.rows.map(mapVideo);
}

export function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function findProfile(userId: string) {
  return zite.profiles.findOne({ filters: { user: userId } });
}

export async function isAdmin(userId: string) {
  const p = await findProfile(userId);
  return p?.role === 'Administrateur';
}

export async function requireAdmin(userId: string) {
  if (!(await isAdmin(userId))) {
    throw new ZiteError({ code: 'FORBIDDEN', message: 'Admin only', userFacingMessage: 'Accès réservé aux administrateurs.' });
  }
}

export function forbid(msg = 'Action non autorisée.') {
  return new ZiteError({ code: 'FORBIDDEN', message: msg, userFacingMessage: msg });
}

export async function getPlaylists(userId: string, includePrivate: boolean) {
  const res = await zite.sql({
    query: `SELECT pl.id, pl."name", pl."description", pl."visibility", COUNT(pip."playlistItemsId") AS n,
      (SELECT COALESCE(NULLIF(v."thumbnailUrl", ''), 'https://i.ytimg.com/vi/' || v."youTubeId" || '/hqdefault.jpg')
        FROM "PlaylistItemsPlaylists" p2 JOIN "PlaylistItemsVideos" piv ON piv."playlistItemsId" = p2."playlistItemsId"
        JOIN "Videos" v ON v.id = piv."videosId" WHERE p2."playlistsId" = pl.id LIMIT 1) AS cover
      FROM "Playlists" pl LEFT JOIN "PlaylistItemsPlaylists" pip ON pip."playlistsId" = pl.id
      WHERE pl."owner"->>0 = $1 ${includePrivate ? '' : `AND pl."visibility" = 'Public'`}
      GROUP BY pl.id ORDER BY pl.created_at DESC`,
    params: [userId],
  });
  return res.rows.map((r) => ({
    id: String(r.id), name: String(r.name ?? ''), description: String(r.description ?? ''),
    visibility: r.visibility === 'Public' ? ('public' as const) : ('private' as const),
    ownerId: userId, count: Number(r.n ?? 0), cover: (r.cover as string) || null,
  }));
}

export const playlistSchema = z.object({
  id: z.string(), name: z.string(), description: z.string(), visibility: z.enum(['public', 'private']),
  ownerId: z.string(), count: z.number(), cover: z.string().nullable(),
});

export function extractYouTubeId(input: string): string | null {
  const t = input.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
