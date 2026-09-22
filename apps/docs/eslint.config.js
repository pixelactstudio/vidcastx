// @ts-check
import { config as vidcastxApp } from "@vidcastx/eslint-config/tanstack-app";

/** @type {import("eslint").Linter.Config} */
export default [
  ...vidcastxApp,

  {
    ignores: ["eslint.config.js", "src/routeTree.gen.ts", ".source/**", ".tanstack/**", "dist/**"],
  },
];
