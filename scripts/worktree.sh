#!/usr/bin/env bash
# Create and prepare git worktrees so several branches can be developed side
# by side (T3 Code threads, Claude Code, Codex, plain terminals).
#
#   scripts/worktree.sh setup [--force] [--skip-install]
#       Run inside a new worktree. Copies local, git-ignored files (.env files,
#       .claude/settings.local.json) from the main checkout and installs deps.
#
#   scripts/worktree.sh new <branch> [--base <ref>] [--dir <path>]
#       Fetches origin, creates <branch> from origin/dev (or --base) in a
#       sibling directory, then runs `setup` inside it.
#
# Root package.json exposes both as `pnpm worktree:setup` / `pnpm worktree:new`.
# Env file contents are never printed.

set -euo pipefail

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*" >&2; }
fail() {
  printf '\033[31m✖ %s\033[0m\n' "$*" >&2
  exit 1
}

usage() {
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

# Absolute path of the main checkout (the worktree that owns .git).
main_worktree() {
  local common_dir
  common_dir="$(git rev-parse --path-format=absolute --git-common-dir)"
  dirname "$common_dir"
}

# Prints NUL-separated paths (relative to $1) of local files worth copying.
# .env.example and other templates are tracked, so they are skipped.
local_files() {
  local root="$1"
  (
    cd "$root"
    find . \
      \( -name node_modules -o -name .git -o -name .turbo -o -name dist -o -name .cache \) -prune -o \
      -type f \( -name '.env' -o -name '.env.*' \) \
      ! -name '*.example' ! -name '*.sample' ! -name '*.template' \
      -print0
    if [ -f .claude/settings.local.json ]; then
      printf '%s\0' ./.claude/settings.local.json
    fi
  )
}

cmd_setup() {
  local force=0 skip_install=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --force) force=1 ;;
      --skip-install) skip_install=1 ;;
      -h | --help) usage ;;
      *) fail "unknown option for setup: $1" ;;
    esac
    shift
  done

  local here main
  here="$(git rev-parse --show-toplevel)"
  main="$(main_worktree)"

  bold "Setting up worktree: $here"

  if [ "$here" = "$main" ]; then
    info "This is the main checkout; nothing to copy."
  else
    info "Copying local files from $main"
    local copied=0 kept=0 rel
    while IFS= read -r -d '' rel; do
      rel="${rel#./}"
      if [ -e "$here/$rel" ] && [ "$force" -eq 0 ]; then
        kept=$((kept + 1))
        info "kept    $rel (already present; --force to overwrite)"
        continue
      fi
      mkdir -p "$(dirname "$here/$rel")"
      cp -p "$main/$rel" "$here/$rel"
      copied=$((copied + 1))
      info "copied  $rel"
    done < <(local_files "$main")

    if [ $((copied + kept)) -eq 0 ]; then
      warn "No .env files in the main checkout. Create one first: cp .env.example .env"
    fi
  fi

  if [ "$skip_install" -eq 1 ]; then
    info "Skipping dependency install (--skip-install)"
  else
    bold "Installing dependencies"
    if command -v pnpm >/dev/null 2>&1; then
      (cd "$here" && pnpm install --frozen-lockfile)
    elif command -v corepack >/dev/null 2>&1; then
      # Lifecycle scripts call `pnpm` by name, so expose a temporary shim.
      local shim
      shim="$(mktemp -d)"
      corepack enable --install-directory "$shim" pnpm
      (cd "$here" && PATH="$shim:$PATH" pnpm install --frozen-lockfile)
    else
      fail "pnpm not found. Enable it with: corepack enable pnpm"
    fi
  fi

  bold "Ready."
  info "Postgres, Redis and MinIO are shared across worktrees: docker compose up -d (run once, anywhere)."
  info "Dev servers use fixed ports (app 4000, api 4001, docs 4002); run them in one worktree at a time."
  info "Checks: pnpm check-types && pnpm lint && pnpm test"
}

cmd_new() {
  local branch="" base="origin/dev" dir=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --base)
        base="${2:?--base needs a ref}"
        shift
        ;;
      --dir)
        dir="${2:?--dir needs a path}"
        shift
        ;;
      -h | --help) usage ;;
      -*) fail "unknown option for new: $1" ;;
      *)
        [ -z "$branch" ] || fail "only one branch name expected"
        branch="$1"
        ;;
    esac
    shift
  done
  [ -n "$branch" ] || usage 1

  git check-ref-format --branch "$branch" >/dev/null || fail "invalid branch name: $branch"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    fail "branch $branch already exists; use: git worktree add <path> $branch"
  fi

  local main
  main="$(main_worktree)"
  if [ -z "$dir" ]; then
    dir="$(dirname "$main")/$(basename "$main").worktrees/${branch//\//-}"
  fi
  [ ! -e "$dir" ] || fail "$dir already exists"

  bold "Creating $branch from $base"
  git fetch origin --quiet
  git worktree add -b "$branch" "$dir" "$base"
  # Branching from origin/dev makes it the upstream; unset it so a bare
  # `git push` can never target dev.
  git -C "$dir" branch --unset-upstream 2>/dev/null || true

  (cd "$dir" && cmd_setup)
  bold "Worktree: $dir"
  info "First push: git push -u origin $branch"
}

main() {
  local cmd="${1:-}"
  [ $# -gt 0 ] && shift
  case "$cmd" in
    setup) cmd_setup "$@" ;;
    new) cmd_new "$@" ;;
    -h | --help | help | "") usage ;;
    *)
      warn "unknown command: $cmd"
      usage 1
      ;;
  esac
}

main "$@"
