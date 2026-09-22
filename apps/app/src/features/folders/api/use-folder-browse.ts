import { useQuery } from "@tanstack/react-query";

import client from "#app/lib/api";

import { folderKeys } from "./folder-keys";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "value" in error) {
    const value = error.value;
    if (value && typeof value === "object" && "error" in value) {
      return String(value.error);
    }
  }
  return fallback;
}

export function useFolderBrowse(parentId: string | null) {
  return useQuery({
    queryKey: folderKeys.browse(parentId),
    queryFn: async () => {
      const { data, error } = await client.api.v1.folders.browse.get({
        query: parentId ? { parentId } : {},
      });
      if (error) {
        const message = extractErrorMessage(error, "Failed to load folders");
        console.error("failed to load folder browse", error);
        throw new Error(message);
      }
      return data;
    },
  });
}

export { extractErrorMessage };
