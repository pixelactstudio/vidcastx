#!/usr/bin/env bash
# PreToolUse hook for Bash. Blocks `pnpm add <pkg>`, `pnpm install <pkg>`, `pnpm i <pkg>`
# unless the user has explicitly approved the install in this session.
#
# A bare `pnpm install` (optionally with flags or redirections such as
# `--frozen-lockfile` or `2>&1`) only syncs the lockfile and is allowed.
#
# Rule reference: .claude/rules/dependencies.md — never install without permission.
# Reads a JSON tool_use payload from stdin; exit code 2 blocks, 0 allows.

set -euo pipefail

payload="$(cat)"
if command -v jq >/dev/null 2>&1; then
  command="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')"
else
  command="$(printf '%s' "$payload" | grep -oE '"command":\s*"[^"]*"' | head -1 | sed -E 's/.*"command":\s*"(.*)"/\1/')"
fi

# pnpm flags that consume the next token as their value.
value_flags=" -F --filter -C --dir --reporter --loglevel --lockfile-dir "

# Returns 0 if one shell segment (no ; & | separators) adds a dependency.
segment_adds_dependency() {
  local -a words
  read -ra words <<< "$1"

  local i=0 subcommand="" skip_next=0
  # Find the pnpm invocation, then its subcommand (first non-flag token).
  while [ "$i" -lt "${#words[@]}" ] && [ "${words[$i]}" != "pnpm" ]; do i=$((i + 1)); done
  [ "$i" -lt "${#words[@]}" ] || return 1
  i=$((i + 1))
  while [ "$i" -lt "${#words[@]}" ]; do
    local word="${words[$i]}"
    i=$((i + 1))
    if [ "$skip_next" -eq 1 ]; then skip_next=0; continue; fi
    case "$value_flags" in *" $word "*) skip_next=1; continue ;; esac
    case "$word" in -*) continue ;; esac
    subcommand="$word"
    break
  done

  case "$subcommand" in
    add) return 0 ;;
    install | i) ;;
    *) return 1 ;;
  esac

  # `pnpm install` only adds a dependency when it is given a package argument.
  while [ "$i" -lt "${#words[@]}" ]; do
    local word="${words[$i]}"
    i=$((i + 1))
    if [ "$skip_next" -eq 1 ]; then skip_next=0; continue; fi
    case "$value_flags" in *" $word "*) skip_next=1; continue ;; esac
    case "$word" in
      -* | [0-9]\>* | [0-9]\<* | \>* | \<* | \&*) continue ;;
      *) return 0 ;;
    esac
  done
  return 1
}

while IFS= read -r segment; do
  if segment_adds_dependency "$segment"; then
    cat <<EOF >&2
BLOCKED by .claude/hooks/block-pnpm-add.sh

This command would install a new dependency:
  $command

The dependencies.md rule requires explicit user approval before any install.
Stop, ask the user, and only proceed once they confirm.

If the user has already approved this install in the current turn, you can:
  - have them paste the command themselves with \`!\` prefix, OR
  - re-issue the command and the user will be prompted to allow it
EOF
    exit 2
  fi
done < <(printf '%s\n' "$command" | sed -E 's/(\&\&|\|\||;|\||\&)/\n/g')

exit 0
