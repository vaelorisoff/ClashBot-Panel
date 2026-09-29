import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireAdmin, forbid } from '../lib/server';

export default createEndpoint({
  description: "Interface d'administration : utilisateurs, vidéos, commentaires et catégories",
  authenticated: true,
  inputSchema: z.object({
    action: z.enum(['overview', 'setRole', 'setVideoStatus', 'saveCategory', 'deleteCategory']),
    id: z.string().optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['published', 'hidden']).optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    stats: z.object({ users: z.number(), videos: z.number(), comments: z.number(), likes: z.number() }).optional(),
    users: z.array(z.object({
      profileId: z.string(), userId: z.string(), username: z.string(), displayName: z.string(), email: z.string(),
      role: z.string(), createdAt: z.string(), videoCount: z.number(),
    })).optional(),
    videos: z.array(z.object({
      id: z.string(), title: z.string(), youTubeId: z.string(), status: z.string(), uploaderName: z.string(),
      views: z.number(), createdAt: z.string(),
    })).optional(),
    comments: z.array(z.object({
      id: z.string(), content: z.string(), userName: z.string(), videoId: z.string(), videoTitle: z.string(), createdAt: z.string(),
    })).optional(),
    categories: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), sortOrder: z.number() })).optional(),
  }),
  execute: async ({ input, context }) => {
    await requireAdmin(context.user.id);

    if (input.action === 'setRole') {
      const p = input.id ? await zite.profiles.findOne({ id: input.id }) : undefined;
      if (!p) throw forbid('Profil introuvable.');
      await zite.profiles.update({ id: p.id, record: { role: input.role === 'admin' ? 'Administrateur' : 'Utilisateur' } as never });
      return { ok: true };
    }
    if (input.action === 'setVideoStatus') {
      if (!input.id) throw forbid('Vidéo introuvable.');
      await zite.videos.update({ id: input.id, record: { status: input.status === 'hidden' ? 'Masquée' : 'Publiée' } as never });
      return { ok: true };
    }
    if (input.action === 'saveCategory') {
      const name = (input.name ?? '').trim();
      if (!name) throw forbid('Nom requis.');
      const slug = (input.slug || name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const record = { name, slug, sortOrder: input.sortOrder ?? 99 };
      if (input.id) await zite.categories.update({ id: input.id, record: record as never });
      else await zite.categories.create({ record: { ...record, videos: null } });
      return { ok: true };
    }
    if (input.action === 'deleteCategory') {
      if (input.id) await zite.categories.delete({ id: input.id });
      return { ok: true };
    }

    const [stats, users, videos, comments, categories] = await Promise.all([
      zite.sql({
        query: `SELECT (SELECT COUNT(*) FROM "Profiles") AS users, (SELECT COUNT(*) FROM "Videos") AS videos,
          (SELECT COUNT(*) FROM "Comments") AS comments, (SELECT COUNT(*) FROM "Likes") AS likes`,
      }),
      zite.sql({
        query: `SELECT p.id, p."user"->>0 AS "userId", p."username", p."displayName", p."role", p.created_at AS "createdAt", u."email",
          (SELECT COUNT(*) FROM "Videos" v WHERE v."uploader"->>0 = p."user"->>0) AS "videoCount"
          FROM "Profiles" p LEFT JOIN "ziteUsers" u ON u.id = p."user"->>0 ORDER BY p.created_at DESC LIMIT 500`,
      }),
      zite.sql({
        query: `SELECT v.id, v."title", v."youTubeId", COALESCE(v."status", 'Publiée') AS status, COALESCE(v."views",0) AS views,
          v.created_at AS "createdAt", COALESCE(p."displayName", u."name", 'Membre') AS "uploaderName"
          FROM "Videos" v LEFT JOIN "Profiles" p ON p."user"->>0 = v."uploader"->>0 LEFT JOIN "ziteUsers" u ON u.id = v."uploader"->>0
          ORDER BY v.created_at DESC LIMIT 500`,
      }),
      zite.sql({
        query: `SELECT cm.id, cm."content", cm.created_at AS "createdAt", COALESCE(p."displayName", u."name", 'Membre') AS "userName",
          v.id AS "videoId", v."title" AS "videoTitle"
          FROM "Comments" cm LEFT JOIN "CommentsVideos" cmv ON cmv."commentsId" = cm.id LEFT JOIN "Videos" v ON v.id = cmv."videosId"
          LEFT JOIN "Profiles" p ON p."user"->>0 = cm."user"->>0 LEFT JOIN "ziteUsers" u ON u.id = cm."user"->>0
          ORDER BY cm.created_at DESC LIMIT 300`,
      }),
      zite.sql({ query: `SELECT id, "name", "slug", COALESCE("sortOrder", 99) AS "sortOrder" FROM "Categories" ORDER BY "sortOrder", "name"` }),
    ]);
    const s = stats.rows[0] ?? {};
    const str = (x: unknown) => (x == null ? '' : String(x));
    return {
      ok: true,
      stats: { users: Number(s.users ?? 0), videos: Number(s.videos ?? 0), comments: Number(s.comments ?? 0), likes: Number(s.likes ?? 0) },
      users: users.rows.map((r) => ({
        profileId: str(r.id), userId: str(r.userId), username: str(r.username), displayName: str(r.displayName),
        email: str(r.email), role: str(r.role) || 'Utilisateur', createdAt: str(r.createdAt), videoCount: Number(r.videoCount ?? 0),
      })),
      videos: videos.rows.map((r) => ({
        id: str(r.id), title: str(r.title), youTubeId: str(r.youTubeId), status: str(r.status), uploaderName: str(r.uploaderName),
        views: Number(r.views ?? 0), createdAt: str(r.createdAt),
      })),
      comments: comments.rows.map((r) => ({
        id: str(r.id), content: str(r.content), userName: str(r.userName), videoId: str(r.videoId), videoTitle: str(r.videoTitle), createdAt: str(r.createdAt),
      })),
      categories: categories.rows.map((r) => ({ id: str(r.id), name: str(r.name), slug: str(r.slug), sortOrder: Number(r.sortOrder ?? 99) })),
    };
  },
});
