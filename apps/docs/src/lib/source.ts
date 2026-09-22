import { llms, loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";

import { DOCS_ROUTE } from "#docs/lib/shared";

// `defineDocs` is a build-time macro: the fumadocs-mdx Vite plugin compiles
// every MDX file under `content/docs` and replaces this call with the result.
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: DOCS_ROUTE,
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})\n\n${await page.data.getText("processed")}`,
});
