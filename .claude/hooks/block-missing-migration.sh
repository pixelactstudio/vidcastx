#!/usr/bin/env bash
# PreToolUse hook for Bash.
# Intercepts `git commit` (including `git commit -m "..."`). If the staged
# changeset includes files under packages/database/src/schema/ but NO files
# under packages/database/drizzle/, refuse the commit.
#
# Rule reference: .claude/rules/database.md, .claude/rules/commit-discipline.md
# Exit 2 blocks; exit 0 allows.

set -euo pipefail

payload="$(cat)"
command="$(printf '%s' "$payload" | grep -oE '"command":\s*"[^"]*"' | head -1 | sed -E 's/.*"command":\s*"(.*)"/\1/')"

[ -z "$command" ] && exit 0

# Only care about `git commit`. Allow `git commit --amend` to pass — the user
# may be tweaking message on an already-correct commit.
if ! printf '%s' "$command" | grep -qE '\bgit\s+commit\b'; then
  exit 0
fi
if printf '%s' "$command" | grep -qE '\bgit\s+commit\b.*--amend\b'; then
  exit 0
fi

# Must run from a git worktree.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

staged="$(git diff --cached --name-only --diff-filter=d)"
[ -z "$staged" ] && exit 0

schema_changed=0
migration_added=0

while IFS= read -r f; do
  case "$f" in
    packages/database/src/schema/*) schema_changed=1 ;;
    packages/database/drizzle/*) migration_added=1 ;;
  esac
done <<< "$staged"

if [ "$schema_changed" -eq 1 ] && [ "$migration_added" -eq 0 ]; then
  cat <<EOF >&2
BLOCKED by .claude/hooks/block-missing-migration.sh

The staged changeset modifies Drizzle schema files but does NOT include a
generated migration:

$(git diff --cached --name-only --diff-filter=d | grep '^packages/database/src/schema/' | sed 's/^/  • /')

Per .claude/rules/database.md the schema change and the generated migration
SQL must land in the SAME commit. Run:

  pnpm run db:migrate -- --name="<descriptive_snake_case_name>"

Then \`git add\` the new migration file and re-commit.
EOF
  exit 2
fi

exit 0
