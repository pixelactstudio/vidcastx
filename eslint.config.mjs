import { config as baseConfig } from "@vidcastx/eslint-config/base";

/**
 * Root fallback ESLint config.
 *
 * Each workspace has its own `eslint.config.js` — ESLint flat config
 * resolves per-file via ancestor walk, so workspace configs win for
 * files under `apps/*`, `packages/*`, `workers/*`.
 *
 * This root config covers loose files that don't live in a workspace
 * with its own config (e.g. `tooling/prettier/index.js`, root configs,
 * `.eslintrc`-shaped stragglers picked up by lint-staged).
 *
 * @type {import("eslint").Linter.Config}
 */
export default [
  ...baseConfig,
  {
    ignores: [
      "apps/**",
      "packages/**",
      "workers/**",
      "tooling/**",
      ".agents/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/routeTree.gen.ts",
    ],
  },
];
