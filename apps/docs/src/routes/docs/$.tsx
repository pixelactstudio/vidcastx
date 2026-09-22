import { Suspense, use } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle, MarkdownCopyButton } from "fumadocs-ui/layouts/docs/page";

import { getMDXComponents } from "#docs/components/mdx";
import { baseOptions } from "#docs/lib/layout";
import { APP_NAME, getPageMarkdownUrl } from "#docs/lib/shared";
import { docs, source } from "#docs/lib/source";

function parseSplat(input: unknown): string {
  if (typeof input !== "string") throw new TypeError("Expected the docs path as a string");
  return input;
}

const loadPage = createServerFn({ method: "GET" })
  .validator(parseSplat)
  .handler(async ({ data: splat }) => {
    const slugs = splat.split("/").filter((segment) => segment.length > 0);
    const page = source.getPage(slugs);
    if (!page) return null;

    return {
      path: page.path,
      title: page.data.title,
      description: page.data.description,
      markdownUrl: getPageMarkdownUrl(page.slugs),
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

export const Route = createFileRoute("/docs/$")({
  loader: async ({ params }) => {
    const data = await loadPage({ data: params._splat ?? "" });
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's notFound() throws a special object
    if (!data) throw notFound();

    await docs.getPage(data.path)?.preload();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} | ${APP_NAME}` : APP_NAME },
      { name: "description", content: loaderData?.description ?? "" },
    ],
  }),
  component: Page,
});

function Page() {
  const { path, markdownUrl, pageTree } = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense>
        <Content path={path} markdownUrl={markdownUrl} />
      </Suspense>
    </DocsLayout>
  );
}

function Content({ path, markdownUrl }: { path: string; markdownUrl: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`Unknown docs page: ${path}`);

  const { toc } = use(page.load());
  const MDX = page.body;

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <div className="-mt-4 flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
