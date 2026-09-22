import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";

import { baseOptions } from "#docs/lib/layout";
import { APP_NAME } from "#docs/lib/shared";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
        <p className="text-fd-muted-foreground max-w-xl">
          Self-hostable video infrastructure: upload, transcode to adaptive HLS, and serve from your own storage.
        </p>
        <Link
          to="/docs/$"
          params={{ _splat: "" }}
          className="bg-fd-primary text-fd-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
        >
          Read the docs
        </Link>
      </main>
    </HomeLayout>
  );
}
