import { createFileRoute } from "@tanstack/react-router";

import { decodeMarkdownUrl } from "#docs/lib/shared";
import { docsLlms, source } from "#docs/lib/source";

// Raw markdown for a docs page (`/docs/architecture/overview.md`). Backs the
// "Copy Markdown" button on every page.
export const Route = createFileRoute("/docs/{$}.md")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs = decodeMarkdownUrl(params._splat?.split("/") ?? []);
        const page = source.getPage(slugs);
        if (!page) return new Response("Not found", { status: 404 });

        return new Response(await docsLlms.page(page), {
          headers: { "Content-Type": "text/markdown; charset=utf-8" },
        });
      },
    },
  },
});
