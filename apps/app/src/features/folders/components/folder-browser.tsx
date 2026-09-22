import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FolderPlus, Plus, Upload } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";

import { PageHeader } from "#app/components/page-header";

import type { FolderSummary, VideoSummary } from "../types";
import type { CreateFolderInput } from "../validator/folder-schema";
import { useCreateFolder } from "../api/use-create-folder";
import { useDeleteFolder } from "../api/use-delete-folder";
import { useFolderBrowse } from "../api/use-folder-browse";
import { useToggleVideoPin } from "../api/use-toggle-video-pin";
import { useUpdateFolder } from "../api/use-update-folder";
import { CreateFolderDialog } from "./create-folder-dialog";
import { FolderBreadcrumb } from "./folder-breadcrumb";
import { FolderGridSkeleton } from "./folder-grid-skeleton";
import { MixedGrid } from "./mixed-grid";

interface FolderBrowserProps {
  parentId: string | null;
}

export function FolderBrowser({ parentId }: FolderBrowserProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFolderBrowse(parentId);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder(parentId);
  const deleteFolder = useDeleteFolder(parentId);
  const toggleVideoPin = useToggleVideoPin(parentId);

  const handleOpenFolder = useCallback(
    (id: string) => {
      void navigate({ to: "/dashboard/projects/f/$folderId", params: { folderId: id } });
    },
    [navigate],
  );

  const handleCreateFolder = useCallback(
    async (input: CreateFolderInput) => {
      await createFolder.mutateAsync({ ...input, parentId });
    },
    [createFolder, parentId],
  );

  const handleToggleFolderPin = useCallback(
    (folder: FolderSummary) => {
      updateFolder.mutate({ id: folder.id, patch: { pinned: !folder.pinned } });
    },
    [updateFolder],
  );

  const handleDeleteFolder = useCallback(
    (folder: FolderSummary) => {
      const ok = globalThis.confirm(
        `Delete "${folder.name}"? Subfolders will be removed; videos inside move to the root.`,
      );
      if (!ok) return;
      deleteFolder.mutate({ id: folder.id });
    },
    [deleteFolder],
  );

  const handleToggleVideoPin = useCallback(
    (video: VideoSummary) => {
      toggleVideoPin.mutate({ id: video.id, pinned: !video.pinned });
    },
    [toggleVideoPin],
  );

  const currentFolder = data?.folder ?? null;
  const parentFolderName = currentFolder?.name ?? "All folders";
  const headerTitle = currentFolder?.name ?? "Projects";
  const headerDescription = currentFolder?.description ?? "Manage your video projects.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerTitle}
        description={headerDescription}
        actions={
          <>
            <CreateFolderDialog
              parentFolderName={parentFolderName}
              onCreate={handleCreateFolder}
              isSubmitting={createFolder.isPending}
            >
              <Button variant="outline" size="sm">
                <FolderPlus className="size-4" />
                New folder
              </Button>
            </CreateFolderDialog>
            <Button variant="outline" size="sm">
              <Upload className="size-4" />
              Import
            </Button>
            <Button size="sm">
              <Plus className="size-4" />
              New project
            </Button>
          </>
        }
      />

      <FolderBreadcrumb ancestors={data?.ancestors ?? []} />

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive border px-4 py-3 text-sm">
          {error instanceof Error ? error.message : "Failed to load folders"}
        </div>
      )}

      {isLoading ? (
        <FolderGridSkeleton />
      ) : (
        <MixedGrid
          folders={data?.folders ?? []}
          videos={data?.videos ?? []}
          pinnedFolders={data?.pinnedFolders ?? []}
          pinnedVideos={data?.pinnedVideos ?? []}
          onOpenFolder={handleOpenFolder}
          onToggleFolderPin={handleToggleFolderPin}
          onToggleVideoPin={handleToggleVideoPin}
          onDeleteFolder={handleDeleteFolder}
        />
      )}
    </div>
  );
}
