# VidcastX V1 plan

Scope and the definition of done live in [`IDEA.md`](../IDEA.md). This file is the working plan: tick items as they land on `dev`, and add a short review under each finished phase.

Each phase is a feature branch (`pnpm worktree:new feat/<name>`) merged into `dev` through a PR. Build test-first with the `tdd` skill.

## Phase 0 — Streamline the repo ✅

- [x] Merge #82 (tests in CI, dependency refresh) with an MIT license instead of the proprietary notice
- [x] Close superseded dependency PRs; turn off Dependabot security PRs against `main` (Renovate covers `dev`)
- [x] Review #69 (libav transcoder): parked as draft, findings on the PR, good ideas carried into Phase 1
- [x] Remove unused `packages/seo` and `packages/analytics`; pin `latest`-tag dependencies
- [x] Fix git/agent hooks (migration path, new-worktree checkout, install guard)
- [x] CI: typecheck, lint, format, test, build + CodeQL, PR title and dependency review, release-please
- [x] `pnpm worktree:new` / `pnpm worktree:setup`
- [x] Agent skills installed; `IDEA.md` rewritten around V1
- [x] `apps/docs` (Fumadocs, offline)
- [x] Lockfile refreshed within declared ranges: `pnpm audit` 59 → 2 moderate (vitest 3)

**Review:** `dev` and `main` synced through #82, #84, #85, #87 and #86; only draft #69 is open. `CI` is a required check on both branches.

**Follow-ups:**

- [x] Allow GitHub Actions to create pull requests; release-please opened #90 (its CI runs need a one-click approval, see `release.yml`)
- [x] Dependabot config removed; Renovate batches minor/patch into one weekly PR, majors wait for a dashboard tick
- [ ] Install the Renovate app on the `pixelactstudio` org (it stayed on the personal account when the repo moved, so Renovate hasn't run since July)
- [ ] Remove the Blacksmith app's access to this repo (it appends a Codesmith footer to every PR body; CI doesn't use Blacksmith runners)
- [ ] Upgrade better-auth to 1.7 (held on `~1.6` plus a `@better-auth/core` override in `pnpm-workspace.yaml`; 1.7 changes the secondary-storage and plugin option types in `packages/auth`)
- [ ] vitest 4 major (clears the last two audit advisories)

## Phase 1 — Foundations (day 1)

- [ ] Schema cleanup: drop AI, transcript, live, distribution, billing and unused analytics tables and enums; move `webhook` out of `live-schema`; migration generated via `pnpm db:migrate` (decide with the owner whether to squash into a fresh initial migration before launch)
- [ ] Drop the pgvector extension and image (plain Postgres)
- [ ] Transcoder hardening, test-first against generated clips:
  - [ ] force 8-bit `yuv420p` output (10-bit sources currently produce High 10 H.264 that browsers can't decode)
  - [ ] stereo AAC; clips with no audio track; rotated phone video
  - [ ] idempotent retries (no duplicate `asset` rows), report `failed` only on the final attempt
  - [ ] upload progress (`90 * Math.floor(uploaded / total)` sits at 0 until the end)
  - [ ] preview asset type: output is WebM but stored as `preview_gif`
  - [ ] graceful shutdown on SIGTERM
  - [ ] align keyframes across renditions (fixed GOP, `-sc_threshold 0`) so players can switch rungs cleanly
  - [ ] `-ac:${idx}` targets output stream N, not audio stream N (`-ac:a:${idx}`)
  - [ ] sources below 480p are upscaled to the 480p floor
  - [ ] `CONCURRENT_JOBS` is never read
- [ ] Status machine: `uploaded` is never set (multipart complete jumps to `queued`)
- [ ] `createbuckets` in docker-compose hard-codes the MinIO credentials; read them from the same env vars as the `minio` service
- [ ] Integration test harness for the API against real Postgres/Redis/MinIO (docker compose services in CI)

## Phase 2 — Developer API (day 2)

- [ ] API keys (Better Auth API-key plugin or own table) and an auth guard accepting key or session
- [ ] Public video shape + status mapping (`waiting / processing / ready / errored`), `passthrough`
- [ ] `POST /v1/videos` from URL (worker downloads the input)
- [ ] `POST /v1/uploads` / `GET /v1/uploads/:id`
- [ ] Real `DELETE` (rows + storage); remove the restore stub and the stub user routes

## Phase 3 — Playback (day 3)

- [ ] `playback_id` table, `public` / `signed` policies, endpoints
- [ ] Signing keys + JWT playback tokens
- [ ] `/stream/:playbackId.m3u8` with playlist rewriting to signed segment URLs; make the MinIO bucket private
- [ ] Storyboard sprite + VTT in the transcoder; `/image/:playbackId/*` routes

## Phase 4 — Player (day 4)

- [ ] `packages/player`: web component + React wrapper (new deps: hls.js, maybe media-chrome — ask first)
- [ ] Video page in the dashboard: player, pipeline status, playback IDs, embed snippet, outputs
- [ ] Clicking a card opens the video (`FolderBrowser` never passes `onOpenVideo` to `MixedGrid`)

## Phase 5 — Webhooks (day 5)

- [ ] Endpoints + deliveries tables, HMAC signing, BullMQ delivery with backoff
- [ ] Events from the status transitions
- [ ] Dashboard: API keys, signing keys, webhooks with delivery log and retry

## Phase 6 — Dashboard cleanup (day 6)

- [ ] Remove placeholder routes (`analytics/reports`, `assets/*`, `billing/*`, `integrations/*`, `developers/docs`, `studio/index`, `studio/editor`, `team/roles`) and the fake notifications / hardcoded sidebar user
- [ ] Merge the duplicate `VideoCard`s (`features/folders` and `features/videos`); wire card actions (rename, move, copy link, delete)
- [ ] Overview page with checklist and real counts
- [ ] Team members + invites; organization settings; drop the onboarding billing step

## Phase 7 — Analytics (day 7, stretch)

- [ ] Player beacon → view sessions; views, watch time, startup time, rebuffering, errors on the video page

## Phase 8 — Self-hosting (day 8)

- [ ] Dockerfiles for api, transcoder (with ffmpeg) and app; one compose file for the whole stack with a seeded demo account
- [ ] Publish images to GHCR from CI on release
- [ ] End-to-end smoke test in CI: API key → upload → `video.ready` webhook → playlist fetch

## Phase 9 — Docs and launch prep (days 9–10)

- [ ] Docs: quickstart, self-hosting, API reference, pipeline guides match shipped behaviour
- [ ] README with demo GIF and screenshots
- [ ] Bug bash with real-world files (phone, screen recordings, 4K, VFR, no-audio, `.mov` with PCM)
- [ ] Walk the "V1 is done when" list in `IDEA.md`; tag v1.0.0 via release-please

## Open decisions

- Terraform (AWS) + Helm (Kubernetes) deployment kit: before or after launch?
- Squash migrations before launch?
