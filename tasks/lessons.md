# Lessons

Patterns that caused mistakes in this repo, and the rule that prevents each. Read at the start of a session; add an entry after every correction.

- **`"latest"` dependency specifiers re-resolve on any lockfile change.** Removing one package bumped every `latest` TanStack dependency and broke type-checking. Pin with caret ranges; let Renovate move them.
- **Partial commits + pnpm 11.** lint-staged stashes unstaged changes, which can leave `node_modules` out of sync with the committed manifests, and pnpm 11 then tries to reinstall during `pnpm exec`. When committing a subset of a dependency change, run the commit with `pnpm_config_verify_deps_before_run=false`.
- **Generated files stay out of prettier.** `routeTree.gen.ts` and `pnpm-lock.yaml` belong to their generators; formatting them makes every build dirty the tree.
- **The project permission list blocks `git restore --*` and `rm -rf`.** Plan edits so they don't need undoing; make throwaway changes in a separate worktree.
- **ESLint's `--cache` ignores dependency changes.** After a lockfile or plugin update, cached results replay stale errors (or hide new ones). Delete `**/.cache/.eslintcache` before trusting `pnpm lint`; CI has no cache.
- **Optional peers linger in the lockfile.** Removing the only real consumer of a package (Next.js via `packages/seo`) left it resolved as an optional peer of other packages. Check `pnpm why <pkg> -r` after removals; a fresh resolve drops it.
- **The push guard matches `dev`/`main` anywhere after `git push` in a command.** Run `git push` and `gh pr create --base dev` as separate commands.
- **PRs opened or updated with `GITHUB_TOKEN` don't trigger workflows.** The release-please PR never got the `CI` check `main` requires. `workflow_dispatch` is exempt, so the Release workflow dispatches CI on the release branch.
- **Transferring a repo drops app installations made on the old owner.** Renovate was installed on the personal account and silently stopped when the repo moved to `pixelactstudio`. After a transfer, reinstall bots on the new owner.
- **Renovate finds its dashboard by title.** Changing `dependencyDashboardTitle` opens a new issue and orphans the old one; close the old one by hand.
