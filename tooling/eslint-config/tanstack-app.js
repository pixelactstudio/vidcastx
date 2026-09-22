import reactRefresh from "eslint-plugin-react-refresh";

import { config as baseConfig } from "./base.js";

/**
 * Config for apps/app (TanStack Start on Vite).
 *
 * Usage:
 *   import { config as vidcastxApp } from "@vidcastx/eslint-config/tanstack-app";
 *   export default [...vidcastxApp];
 *
 * Note: we do NOT compose with @tanstack/eslint-config — under ESLint 9 it
 * re-registers @typescript-eslint, causing a "Cannot redefine plugin" crash.
 * Our base already covers what tanstack's preset adds.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  /* ─── Base (strict type-safety, hygiene, error-handling) ─ */
  ...baseConfig,

  /* ─── Vite HMR boundary (react-refresh) ────────────── */
  reactRefresh.configs.vite,

  /* ─── TanStack file-based routes ──────────────────── */
  {
    // Route files export `Route` (createFileRoute result) alongside the route
    // component — the prescribed TanStack Router pattern. HMR works in practice
    // via Vite + TanStack plugin; the rule's static analysis can't see that.
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /* ─── Integration modules (not HMR-relevant) ──────── */
  {
    // TanStack Query / Router integration files export factory functions,
    // not components. HMR boundary enforcement doesn't apply.
    files: ["src/integrations/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /* ─── Frontend ↔ backend boundary (frontend.md) ─────── */
  {
    // apps/app is UI only — no backend packages or runtimes may be imported.
    // Type-only imports are permitted (allowTypeImports: true) since they
    // erase at build time and don't pull backend code into the bundle.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@vidcastx/database",
              message: "Backend-only. Talk to the API via Eden Treaty (apps/app/src/lib/api.ts).",
              allowTypeImports: true,
            },
            { name: "@vidcastx/queue", message: "Backend-only. Dispatch via API endpoint.", allowTypeImports: true },
            {
              name: "@vidcastx/storage",
              message: "Backend-only. Request presigned URLs from the API.",
              allowTypeImports: true,
            },
            { name: "@vidcastx/redis", message: "Backend-only.", allowTypeImports: true },
            { name: "@vidcastx/m2m", message: "Backend-only.", allowTypeImports: true },
            { name: "drizzle-orm", message: "Backend-only ORM.", allowTypeImports: true },
            { name: "bullmq", message: "Backend-only queue.", allowTypeImports: true },
            { name: "ioredis", message: "Backend-only." },
            { name: "pg", message: "Backend-only." },
            { name: "bun", message: "Backend-only runtime API." },
          ],
          patterns: [
            { group: ["drizzle-orm/*"], message: "Backend-only ORM.", allowTypeImports: true },
            { group: ["@aws-sdk/*"], message: "Backend-only SDK.", allowTypeImports: true },
          ],
        },
      ],
    },
  },

  /* ─── Stylistic opinions we disagree with ──────────── */
  {
    rules: {
      "@typescript-eslint/array-type": "off",
    },
  },

  /* ─── TanStack throw-to-navigate pattern ──────────── */
  {
    // TanStack Router's `redirect()` and `notFound()` return non-Error objects
    // (Redirect extends Response; NotFoundError is a plain object) that the
    // router catches inside loaders/beforeLoad/server functions to short-circuit
    // navigation. This is the prescribed API — allow-list the types so the
    // rule doesn't force bogus Error wrappers around framework sentinels.
    rules: {
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            {
              from: "package",
              name: ["Redirect", "AnyRedirect", "ResolvedRedirect"],
              package: "@tanstack/router-core",
            },
            { from: "package", name: "NotFoundError", package: "@tanstack/router-core" },
          ],
        },
      ],
    },
  },
];
