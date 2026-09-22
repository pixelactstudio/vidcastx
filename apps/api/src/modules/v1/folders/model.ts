import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

import { folders } from "@vidcastx/database/schema/folder-schema";
import { videos } from "@vidcastx/database/schema/video-schema";

const _folderSelect = createSelectSchema(folders);
const _videoSelect = createSelectSchema(videos);

export const FolderDetail = t.Omit(_folderSelect, ["createdById"]);

export const FolderSummary = t.Composite([
  t.Pick(_folderSelect, [
    "id",
    "name",
    "parentId",
    "orgId",
    "visibility",
    "color",
    "coverImageUrl",
    "pinned",
    "createdAt",
    "updatedAt",
  ]),
  t.Object({
    videoCount: t.Number(),
    subfolderCount: t.Number(),
  }),
]);

export const VideoSummary = t.Composite([
  t.Pick(_videoSelect, [
    "id",
    "title",
    "folderId",
    "visibility",
    "pinned",
    "duration",
    "status",
    "createdAt",
    "updatedAt",
  ]),
  t.Object({
    thumbnailUrl: t.Optional(t.Nullable(t.String())),
    previewUrl: t.Optional(t.Nullable(t.String())),
  }),
]);

export const BrowseQuery = t.Object({
  parentId: t.Optional(t.String({ pattern: "^fld_" })),
});

export const BrowseResponse = t.Object({
  folder: t.Nullable(FolderDetail),
  ancestors: t.Array(t.Pick(_folderSelect, ["id", "name", "parentId"])),
  folders: t.Array(FolderSummary),
  videos: t.Array(VideoSummary),
  pinnedFolders: t.Array(FolderSummary),
  pinnedVideos: t.Array(VideoSummary),
});

export const FolderIdParam = t.Object({
  id: t.String({ pattern: "^fld_" }),
});

export const CreateFolderBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 60 }),
  parentId: t.Optional(t.Nullable(t.String({ pattern: "^fld_" }))),
  visibility: t.Union([t.Literal("private"), t.Literal("public")]),
  color: t.String({ pattern: "^#[0-9a-fA-F]{6}$" }),
  coverImageUrl: t.Optional(t.Nullable(t.String())),
  description: t.Optional(t.Nullable(t.String({ maxLength: 280 }))),
  pinned: t.Boolean(),
  defaultVideoPrivate: t.Boolean(),
});

export const UpdateFolderBody = t.Partial(
  t.Object({
    name: t.String({ minLength: 1, maxLength: 60 }),
    parentId: t.Nullable(t.String({ pattern: "^fld_" })),
    visibility: t.Union([t.Literal("private"), t.Literal("public")]),
    color: t.String({ pattern: "^#[0-9a-fA-F]{6}$" }),
    coverImageUrl: t.Nullable(t.String()),
    description: t.Nullable(t.String({ maxLength: 280 })),
    pinned: t.Boolean(),
    defaultVideoPrivate: t.Boolean(),
  }),
);

export const ErrorResponse = t.Object({ error: t.String() });
export const DeleteResponse = t.Object({ status: t.Literal("deleted"), folderId: t.String() });
