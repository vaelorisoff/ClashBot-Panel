import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireAdmin, forbid, extractYouTubeId } from '../lib/server';

const slugify = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default createEndpoint({
  description: "Interface d'administration : utilisateurs, vidéos, commentaires et catégories",
  authenticated: true,
  inputSchema: z.object({
    action: z.enum([
      'overview', 'setRole', 'updateUser', 'setVideoStatus', 'updateVideo', 'deleteVideo', 'deleteComment',
      'saveCategory', 'deleteCategory', 'reorderCategories',
    ]),
    id: z.string().optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['published', 'hidden']).optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    sortOrder: z.number().optional(),
    ids: z.array(z.string()).optional(),
    reassignTo: z.string().optional(),
    // user
    displayName: z.string().optional(),
    username: z.string().optional(),
    bio: z.string().optional(),
    suspended: z.boolean().optional(),
    // video
    title: z.string().optional(),
    description: z.string().optional(),
    creatorName: z.string().optional(),
    categoryId: z.string().optional(),
    youtube: z.string().optional(),
    videoFileUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    stats: z.object({
      users: z.number(), suspended: z.number(), admins: z.number(), videos: z.number(), hidden: z.number(),
      withFile: z.number(), comments: z.number(), likes: z.number(), favorites: z.number(), playlists: z.number(),
      categories: z.number(), views: z.number(), newVideos7d: z.number(), newUsers7d: z.number(),
    }).optional(),
    users: z.array(z.object({
      profileId: z.string(), userId: z.string(), username: z.string(), displayName: z.string(), email: z.string(),
      bio: z.string(), avatarUrl: z.string(), role: z.string(), suspended: z.boolean(), createdAt: z.string(), videoCount: z.number(),
    })).optional(),
    videos: z.array(z.object({
      id: z.string(), title: z.string(), youTubeId: z.string(), videoFileUrl: z.string(), thumbnailUrl: z.string(),
      description: z.string(), creatorName: z.string(), status: z.string(), uploaderId: z.string(), uploaderName: z.string(),
      categoryId: z.string(), categoryName: z.string(), views: z.number(), createdAt: z.string(),
    })).optional(),
    comments: z.array(z.object({
      id: z.string(), content: z.string(), userName: z.string(), videoId: z.string(), videoTitle: z.string(), createdAt: z.string(),
    })).optional(),
    categories: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), sortOrder: z.number(), count: z.number() })).optional(),
  }),
  execute: async ({ input, context }) => {
    // Every action — reads included — is refused server-side for non-admins.
    await requireAdmin(context.user.id);

    switch (input.action) {
      case 'setRole': {
        const p = input.id ? await zite.profiles.findOne({ id: input.id }) : undefined;
        if (!p) throw forbid('Profil introuvable.');
        if (input.role !== 'admin' && p.user && [p.user].flat()[0] === context.user.id) throw forbid('Vous ne pouvez pas retirer votre propre rôle.');
        await zite.profiles.update({ id: p.id, record: { role: input.role === 'admin' ? 'Administrateur' : 'Utilisateur' } as never });
        return { ok: true };
      }
      case 'updateUser': {
        const p = input.id ? await zite.profiles.findOne({ id: input.id }) : undefined;
        if (!p) throw forbid('Profil introuvable.');
        const self = [p.user].flat()[0] === context.user.id;
        if (self && input.suspended) throw forbid('Vous ne pouvez pas suspendre votre propre compte.');
        const record: Record<string, unknown> = {};
        if (input.displayName !== undefined) record.displayName = input.displayName.trim().slice(0, 80);
        if (input.username !== undefined) {
          const u = slugify(input.username).slice(0, 40);
          if (!u) throw forbid("Nom d'utilisateur invalide.");
          const clash = await zite.profiles.findOne({ filters: { username: u } });
          if (clash && clash.id !== p.id) throw forbid("Ce nom d'utilisateur est déjà pris.");
          record.username = u;
        }
        if (input.bio !== undefined) record.bio = input.bio.slice(0, 500);
        if (input.suspended !== undefined) record.suspended = input.suspended;
        await zite.profiles.update({ id: p.id, record: record as never });
        return { ok: true };
      }
      case 'setVideoStatus': {
        if (!input.id) throw forbid('Vidéo introuvable.');
        await zite.videos.update({ id: input.id, record: { status: input.status === 'hidden' ? 'Masquée' : 'Publiée' } as never });
        return { ok: true };
      }
      case 'updateVideo': {
        const v = input.id ? await zite.videos.findOne({ id: input.id }) : undefined;
        if (!v) throw forbid('Vidéo introuvable.');
        const yt = input.youtube?.trim() ? extractYouTubeId(input.youtube) : null;
        if (input.youtube?.trim() && !yt) throw forbid('Lien YouTube invalide.');
        const file = input.videoFileUrl?.trim() || null;
        if (!yt && !file) throw forbid('La vidéo doit garder au moins une source (YouTube ou fichier).');
        const title = (input.title ?? '').trim();
        if (!title) throw forbid('Titre requis.');
        await zite.videos.update({
          id: v.id,
          record: {
            title: title.slice(0, 200), description: (input.description ?? '').slice(0, 5000),
            creatorName: (input.creatorName ?? v.creatorName ?? '').trim().slice(0, 120),
            category: input.categoryId ? [input.categoryId] : null,
            youTubeId: yt, videoFileUrl: file, thumbnailUrl: input.thumbnailUrl?.trim() || null,
            status: input.status === 'hidden' ? 'Masquée' : 'Publiée',
          } as never,
        });
        return { ok: true };
      }
      case 'deleteVideo': {
        if (!input.id) throw forbid('Vidéo introuvable.');
        await zite.videos.delete({ id: input.id });
        return { ok: true };
      }
      case 'deleteComment': {
        if (!input.id) throw forbid('Commentaire introuvable.');
        await zite.comments.delete({ id: input.id });
        return { ok: true };
      }
      case 'saveCategory': {
        const name = (input.name ?? '').trim();
        if (!name) throw forbid('Nom requis.');
        const record = { name, slug: slugify(input.slug || name), sortOrder: input.sortOrder ?? 99 };
        if (input.id) await zite.categories.update({ id: input.id, record: record as never });
        else await zite.categories.create({ record: { ...record, videos: null } });
        return { ok: true };
      }
      case 'reorderCategories': {
        const ids = input.ids ?? [];
        await Promise.all(ids.map((id, i) => zite.categories.update({ id, record: { sortOrder: i + 1 } as never })));
        return { ok: true };
      }
      case 'deleteCategory': {
        if (!input.id) throw forbid('Catégorie introuvable.');
        const used = await zite.sql({ query: `SELECT "videosId" AS id FROM "CategoriesVideos" WHERE "categoriesId"::text = $1`, params: [input.id] });
        if (used.rows.length) {
          if (!input.reassignTo) throw forbid('Cette catégorie contient des vidéos : choisissez une catégorie de remplacement.');
          if (input.reassignTo === input.id) throw forbid('Choisissez une autre catégorie.');
          const ids = used.rows.map((r) => String(r.id));
          for (let i = 0; i < ids.length; i += 10) {
            await Promise.all(ids.slice(i, i + 10).map((vid) => zite.videos.update({ id: vid, record: { category: [input.reassignTo!] } as never })));
          }
        }
        await zite.categories.delete({ id: input.id });
        return { ok: true };
      }
    }

    const [stats, users, videos, comments, categories] = await Promise.all([
      zite.sql({
        query: `SELECT
          (SELECT COUNT(*) FROM "Profiles") AS users,
          (SELECT COUNT(*) FROM "Profiles" WHERE "suspended" = true) AS suspended,
          (SELECT COUNT(*) FROM "Profiles" WHERE "role" = 'Administrateur') AS admins,
          (SELECT COUNT(*) FROM "Videos") AS videos,
          (SELECT COUNT(*) FROM "Videos" WHERE "status" = 'Masquée') AS hidden,
          (SELECT COUNT(*) FROM "Videos" WHERE COALESCE("videoFileUrl", '') <> '') AS "withFile",
          (SELECT COALESCE(SUM("views"), 0) FROM "Videos") AS views,
          (SELECT COUNT(*) FROM "Videos" WHERE created_at > now() - interval '7 days') AS "newVideos7d",
          (SELECT COUNT(*) FROM "Profiles" WHERE created_at > now() - interval '7 days') AS "newUsers7d",
          (SELECT COUNT(*) FROM "Comments") AS comments, (SELECT COUNT(*) FROM "Likes") AS likes,
          (SELECT COUNT(*) FROM "Favorites") AS favorites, (SELECT COUNT(*) FROM "Playlists") AS playlists,
          (SELECT COUNT(*) FROM "Categories") AS categories`,
      }),
      zite.sql({
        query: `SELECT p.id, p."user"->>0 AS "userId", p."username", p."displayName", p."bio", p."avatarUrl", p."role",
          COALESCE(p."suspended", false) AS suspended, p.created_at AS "createdAt", u."email",
          (SELECT COUNT(*) FROM "Videos" v WHERE v."uploader"->>0 = p."user"->>0) AS "videoCount"
          FROM "Profiles" p LEFT JOIN "ziteUsers" u ON u.id = p."user"->>0 ORDER BY p.created_at DESC LIMIT 1000`,
      }),
      zite.sql({
        query: `SELECT v.id, v."title", v."youTubeId", v."videoFileUrl", v."thumbnailUrl", v."description", v."creatorName",
          COALESCE(v."status", 'Publiée') AS status, COALESCE(v."views",0) AS views, v.created_at AS "createdAt",
          v."uploader"->>0 AS "uploaderId", COALESCE(p."displayName", u."name", 'Membre') AS "uploaderName",
          c.id AS "categoryId", c."name" AS "categoryName"
          FROM "Videos" v LEFT JOIN "Profiles" p ON p."user"->>0 = v."uploader"->>0 LEFT JOIN "ziteUsers" u ON u.id = v."uploader"->>0
          LEFT JOIN "CategoriesVideos" cv ON cv."videosId" = v.id LEFT JOIN "Categories" c ON c.id = cv."categoriesId"
          ORDER BY v.created_at DESC LIMIT 1000`,
      }),
      zite.sql({
        query: `SELECT cm.id, cm."content", cm.created_at AS "createdAt", COALESCE(p."displayName", u."name", 'Membre') AS "userName",
          v.id AS "videoId", v."title" AS "videoTitle"
          FROM "Comments" cm LEFT JOIN "CommentsVideos" cmv ON cmv."commentsId" = cm.id LEFT JOIN "Videos" v ON v.id = cmv."videosId"
          LEFT JOIN "Profiles" p ON p."user"->>0 = cm."user"->>0 LEFT JOIN "ziteUsers" u ON u.id = cm."user"->>0
          ORDER BY cm.created_at DESC LIMIT 500`,
      }),
      zite.sql({
        query: `SELECT c.id, c."name", c."slug", COALESCE(c."sortOrder", 99) AS "sortOrder",
          (SELECT COUNT(*) FROM "CategoriesVideos" cv WHERE cv."categoriesId" = c.id) AS count
          FROM "Categories" c ORDER BY "sortOrder", "name"`,
      }),
    ]);
    const s = stats.rows[0] ?? {};
    const n = (x: unknown) => Number(x ?? 0);
    const str = (x: unknown) => (x == null ? '' : String(x));
    return {
      ok: true,
      stats: {
        users: n(s.users), suspended: n(s.suspended), admins: n(s.admins), videos: n(s.videos), hidden: n(s.hidden),
        withFile: n(s.withFile), comments: n(s.comments), likes: n(s.likes), favorites: n(s.favorites),
        playlists: n(s.playlists), categories: n(s.categories), views: n(s.views), newVideos7d: n(s.newVideos7d), newUsers7d: n(s.newUsers7d),
      },
      users: users.rows.map((r) => ({
        profileId: str(r.id), userId: str(r.userId), username: str(r.username), displayName: str(r.displayName),
        email: str(r.email), bio: str(r.bio), avatarUrl: str(r.avatarUrl), role: str(r.role) || 'Utilisateur',
        suspended: r.suspended === true || r.suspended === 'true', createdAt: str(r.createdAt), videoCount: n(r.videoCount),
      })),
      videos: videos.rows.map((r) => ({
        id: str(r.id), title: str(r.title), youTubeId: str(r.youTubeId), videoFileUrl: str(r.videoFileUrl), thumbnailUrl: str(r.thumbnailUrl),
        description: str(r.description), creatorName: str(r.creatorName), status: str(r.status), uploaderId: str(r.uploaderId),
        uploaderName: str(r.uploaderName), categoryId: str(r.categoryId), categoryName: str(r.categoryName),
        views: n(r.views), createdAt: str(r.createdAt),
      })),
      comments: comments.rows.map((r) => ({
        id: str(r.id), content: str(r.content), userName: str(r.userName), videoId: str(r.videoId), videoTitle: str(r.videoTitle), createdAt: str(r.createdAt),
      })),
      categories: categories.rows.map((r) => ({ id: str(r.id), name: str(r.name), slug: str(r.slug), sortOrder: n(r.sortOrder), count: n(r.count) })),
    };
  },
});
