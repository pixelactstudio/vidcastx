import { and, desc, eq, isNull, sql } from "@vidcastx/database";
import { db } from "@vidcastx/database/client";
import { folders } from "@vidcastx/database/schema/folder-schema";
import { videos } from "@vidcastx/database/schema/video-schema";
import { getDownloadUrl } from "@vidcastx/storage";

type Folder = typeof folders.$inferSelect;

type FolderRow = Pick<
  Folder,
  "id" | "name" | "parentId" | "orgId" | "visibility" | "color" | "coverImageUrl" | "pinned" | "createdAt" | "updatedAt"
>;

type FolderSummaryRow = FolderRow & { videoCount: number; subfolderCount: number };

interface VideoSummaryRow {
  id: string;
  title: string;
  folderId: string | null;
  visibility: "private" | "public";
  pinned: boolean;
  duration: number | null;
  status: typeof videos.$inferSelect.status;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl: string | null;
  previewUrl: string | null;
}

const folderSummaryCols = {
  id: folders.id,
  name: folders.name,
  parentId: folders.parentId,
  orgId: folders.orgId,
  visibility: folders.visibility,
  color: folders.color,
  coverImageUrl: folders.coverImageUrl,
  pinned: folders.pinned,
  createdAt: folders.createdAt,
  updatedAt: folders.updatedAt,
};

async function getDescendantIds(folderId: string, orgId: string): Promise<string[]> {
  const res = await db.execute<{ id: string }>(
    sql`
      WITH RECURSIVE descendants AS (
        SELECT id FROM "folder" WHERE parent_id = ${folderId} AND org_id = ${orgId}
        UNION ALL
        SELECT f.id FROM "folder" f
        JOIN descendants d ON f.parent_id = d.id
        WHERE f.org_id = ${orgId}
      )
      SELECT id FROM descendants
    `,
  );
  return res.rows.map((r) => r.id);
}

export const FolderService = {
  async getByIdIfOwner(folderId: string, orgId: string): Promise<Folder | null> {
    const row = await db.query.folders.findFirst({
      where: and(eq(folders.id, folderId), eq(folders.orgId, orgId)),
    });
    return row ?? null;
  },

  async getAncestors(folderId: string | null, orgId: string): Promise<FolderRow[]> {
    if (!folderId) return [];
    const rows = await db.execute<
      Pick<
        Folder,
        | "id"
        | "name"
        | "parentId"
        | "orgId"
        | "visibility"
        | "color"
        | "coverImageUrl"
        | "pinned"
        | "createdAt"
        | "updatedAt"
      > & { depth: number }
    >(
      sql`
        WITH RECURSIVE ancestors AS (
          SELECT id, name, parent_id AS "parentId", org_id AS "orgId", visibility, color,
                 cover_image_url AS "coverImageUrl", pinned, created_at AS "createdAt", updated_at AS "updatedAt",
                 0 AS depth
          FROM "folder"
          WHERE id = ${folderId} AND org_id = ${orgId}
          UNION ALL
          SELECT f.id, f.name, f.parent_id, f.org_id, f.visibility, f.color,
                 f.cover_image_url, f.pinned, f.created_at, f.updated_at,
                 a.depth + 1
          FROM "folder" f
          JOIN ancestors a ON f.id = a."parentId"
          WHERE f.org_id = ${orgId}
        )
        SELECT * FROM ancestors ORDER BY depth DESC
      `,
    );
    return rows.rows.map((r) => ({
      id: r.id,
      name: r.name,
      parentId: r.parentId,
      orgId: r.orgId,
      visibility: r.visibility,
      color: r.color,
      coverImageUrl: r.coverImageUrl,
      pinned: r.pinned,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },

  async listChildFolders(orgId: string, parentId: string | null): Promise<FolderSummaryRow[]> {
    const rows = await db
      .select({
        ...folderSummaryCols,
        videoCount: sql<number>`(SELECT count(*)::int FROM "video" v WHERE v.folder_id = ${folders.id} AND v.deleted_at IS NULL)`,
        subfolderCount: sql<number>`(SELECT count(*)::int FROM "folder" c WHERE c.parent_id = ${folders.id})`,
      })
      .from(folders)
      .where(
        and(eq(folders.orgId, orgId), parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId)),
      )
      .orderBy(desc(folders.updatedAt));
    return rows;
  },

  async listChildVideos(orgId: string, parentId: string | null): Promise<VideoSummaryRow[]> {
    const rows = await db.query.videos.findMany({
      columns: {
        id: true,
        title: true,
        folderId: true,
        visibility: true,
        pinned: true,
        duration: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      where: and(
        eq(videos.orgId, orgId),
        isNull(videos.deletedAt),
        parentId === null ? isNull(videos.folderId) : eq(videos.folderId, parentId),
      ),
      orderBy: [desc(videos.createdAt)],
      with: {
        assets: {
          columns: { type: true, storageKey: true },
        },
      },
    });

    return Promise.all(
      rows.map(async (v) => {
        const assetMap = new Map(v.assets.map((a) => [a.type, a]));
        const thumb = assetMap.get("thumbnail");
        const preview = assetMap.get("preview_gif");
        const [thumbnailUrl, previewUrl] = await Promise.all([
          thumb ? getDownloadUrl(thumb.storageKey) : Promise.resolve(null),
          preview ? getDownloadUrl(preview.storageKey) : Promise.resolve(null),
        ]);
        const { assets: _assets, ...rest } = v;
        return { ...rest, thumbnailUrl, previewUrl };
      }),
    );
  },

  async browse(orgId: string, parentId: string | null) {
    const [folder, ancestors, children, childVideos] = await Promise.all([
      parentId ? FolderService.getByIdIfOwner(parentId, orgId) : Promise.resolve(null),
      FolderService.getAncestors(parentId, orgId),
      FolderService.listChildFolders(orgId, parentId),
      FolderService.listChildVideos(orgId, parentId),
    ]);

    const pinnedFolders = children.filter((f) => f.pinned);
    const unpinnedFolders = children.filter((f) => !f.pinned);
    const pinnedVideos = childVideos.filter((v) => v.pinned);
    const unpinnedVideos = childVideos.filter((v) => !v.pinned);

    return {
      folder,
      ancestors,
      folders: unpinnedFolders,
      videos: unpinnedVideos,
      pinnedFolders,
      pinnedVideos,
    };
  },

  async create(
    orgId: string,
    userId: string,
    input: {
      name: string;
      parentId?: string | null;
      visibility: "private" | "public";
      color: string;
      coverImageUrl?: string | null;
      description?: string | null;
      pinned: boolean;
      defaultVideoPrivate: boolean;
    },
  ): Promise<Folder> {
    if (input.parentId) {
      const parent = await FolderService.getByIdIfOwner(input.parentId, orgId);
      if (!parent) throw new Error("Parent folder not found");
    }
    const [folder] = await db
      .insert(folders)
      .values({
        orgId,
        createdById: userId,
        name: input.name,
        parentId: input.parentId ?? null,
        visibility: input.visibility,
        color: input.color,
        coverImageUrl: input.coverImageUrl ?? null,
        description: input.description ?? null,
        pinned: input.pinned,
        defaultVideoPrivate: input.defaultVideoPrivate,
      })
      .returning();
    if (!folder) throw new Error("Failed to create folder");
    return folder;
  },

  async update(
    folderId: string,
    orgId: string,
    patch: Partial<{
      name: string;
      parentId: string | null;
      visibility: "private" | "public";
      color: string;
      coverImageUrl: string | null;
      description: string | null;
      pinned: boolean;
      defaultVideoPrivate: boolean;
    }>,
  ): Promise<Folder | null> {
    if (patch.parentId) {
      if (patch.parentId === folderId) throw new Error("Folder cannot be its own parent");
      const descendants = await getDescendantIds(folderId, orgId);
      if (descendants.includes(patch.parentId)) throw new Error("Cannot move folder into its own descendant");
      const parent = await FolderService.getByIdIfOwner(patch.parentId, orgId);
      if (!parent) throw new Error("Parent folder not found");
    }
    const [updated] = await db
      .update(folders)
      .set(patch)
      .where(and(eq(folders.id, folderId), eq(folders.orgId, orgId)))
      .returning();
    return updated ?? null;
  },

  async delete(folderId: string, orgId: string): Promise<boolean> {
    const [deleted] = await db
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.orgId, orgId)))
      .returning({ id: folders.id });
    return !!deleted;
  },
};
