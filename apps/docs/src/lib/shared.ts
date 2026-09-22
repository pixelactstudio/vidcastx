import { createGetUrl } from "fumadocs-core/source";

export const APP_NAME = "VidcastX Docs";
export const DOCS_ROUTE = "/docs";

const getDocsUrl = createGetUrl(DOCS_ROUTE);

/** URL of a page's raw-markdown twin: `["a", "b"]` → `/docs/a/b.md`, `[]` → `/docs/index.md`. */
export function getPageMarkdownUrl(slugs: readonly string[]): string {
  const last = slugs.at(-1);
  const segments = last === undefined ? ["index.md"] : [...slugs.slice(0, -1), `${last}.md`];
  return getDocsUrl(segments);
}

/** Inverse of `getPageMarkdownUrl`: `["a", "b.md"]` → `["a", "b"]`, `["index.md"]` → `[]`. */
export function decodeMarkdownUrl(segments: readonly string[]): string[] {
  const last = segments.at(-1);
  if (last === undefined) return [];

  const slugs = [...segments.slice(0, -1), last.replace(/\.md$/, "")];
  return slugs.length === 1 && slugs[0] === "index" ? [] : slugs;
}
