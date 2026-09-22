import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  plugins: [
    fumadocsMdx(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Prerender every crawlable page at build time so `start` serves static HTML.
    // The search route stays dynamic and is served by the same local server.
    tanstackStart({
      prerender: { enabled: true },
      // Match the repo's Prettier quote/semicolon style in the generated routeTree.gen.ts.
      router: { quoteStyle: "double", semicolons: true },
    }),
    viteReact(),
  ],
});

export default config;
