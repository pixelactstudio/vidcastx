import { createFileRoute } from "@tanstack/react-router";
import { createFromSource } from "fumadocs-core/search/server";

import { source } from "#docs/lib/source";

// Orama full-text index built in-process from the MDX sources. No external
// search service is involved; the search dialog queries this route.
const search = createFromSource(source, {
  language: "english",
});

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: ({ request }) => search.GET(request),
    },
  },
});
