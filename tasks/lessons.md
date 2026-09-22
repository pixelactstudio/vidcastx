# Lessons

Patterns that caused mistakes in this repo, and the rule that prevents each. Read at the start of a session; add an entry after every correction.

- **`"latest"` dependency specifiers re-resolve on any lockfile change.** Removing one package bumped every `latest` TanStack dependency and broke type-checking. Pin with caret ranges; let Renovate move them.
- **Partial commits + pnpm 11.** lint-staged stashes unstaged changes, which can leave `node_modules` out of sync with the committed manifests, and pnpm 11 then tries to reinstall during `pnpm exec`. When committing a subset of a dependency change, run the commit with `pnpm_config_verify_deps_before_run=false`.
- **Generated files stay out of prettier.** `routeTree.gen.ts` and `pnpm-lock.yaml` belong to their generators; formatting them makes every build dirty the tree.
- **The project permission list blocks `git restore --*` and `rm -rf`.** Plan edits so they don't need undoing; make throwaway changes in a separate worktree.
