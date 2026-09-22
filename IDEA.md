# VidcastX — product definition

VidcastX is open-source, self-hostable video infrastructure: an API that takes a video in and hands back an adaptive HLS stream, thumbnails, an embeddable player and webhooks. It is a **Mux-shaped** platform you run on your own servers and your own S3-compatible storage, MIT-licensed, with every stage of the pipeline written to be read and learned from.

This file is the source of truth for **what VidcastX is and what V1 contains**. The plan and progress live in [`tasks/todo.md`](tasks/todo.md); how-it-works documentation lives in [`apps/docs`](apps/docs); code conventions live in [`.claude/rules/`](.claude/rules/).

## Audience

1. **Developers embedding video in their product**: course platforms, SaaS onboarding and demo videos, internal tools. They call the API from their backend, receive webhooks, and drop the player into their frontend.
2. **Engineers learning how video infrastructure works**: they clone the repo to see a real upload → transcode → HLS → playback pipeline, with docs that explain the why.

## Positioning

|                | Mux / api.video / Cloudflare Stream | VidcastX                                  |
| -------------- | ----------------------------------- | ----------------------------------------- |
| Hosting        | Their cloud                         | Your servers, your bucket (S3, R2, MinIO) |
| Pricing        | Per minute encoded, stored, viewed  | Your infrastructure cost                  |
| Pipeline       | Closed                              | Readable FFmpeg, documented step by step  |
| Data residency | Vendor regions                      | Wherever you deploy                       |

## Principles

Use these to settle design questions the V1 scope leaves open.

- **Mux-shaped.** When unsure how a resource, endpoint, event or player option should look, follow Mux's model: direct uploads, playback IDs, public vs signed playback, `passthrough` metadata, signed webhooks. Deviate only for self-hosting or readability, and record why.
- **Self-host first.** `docker compose up` runs the whole stack. Every required dependency is open source and runs locally; any S3-compatible store works. Cloud services are optional adapters.
- **Readable pipeline.** The transcoder drives the FFmpeg CLI with commands a learner can copy and run. Prefer the clear implementation over the clever one, and explain the reasoning in `apps/docs`.
- **Narrow and solid.** Finish and harden the V1 surface before adding breadth. A feature ships with tests, docs and a working path through the dashboard.
- **The API orchestrates, never touches bytes.** Uploads go client → storage, transcoding happens in workers, delivery reads from storage.
- **Allowlisted responses.** Responses expose only what the consumer needs (`.claude/rules/response-hygiene.md`).

## Domain model

| Term                 | Meaning                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Organization**     | Unit of isolation; every resource is org-scoped. Members are Owner, Admin or Member. Plays the part of a Mux _environment_.    |
| **Video**            | The central resource (Mux calls it an _asset_). Holds metadata, status, duration, max resolution and `passthrough`.            |
| **Asset**            | One output file of a video: HLS playlist, poster, preview, storyboard, source. Internal; its storage key never leaves the API. |
| **Upload**           | A direct-upload session that creates a video. Large files use S3 multipart (Uppy in the dashboard).                            |
| **Playback ID**      | Public handle used to stream a video. A video has one or more, each with a **playback policy**: `public` or `signed`.          |
| **Signing key**      | Per-org key the customer's backend uses to mint short-lived playback tokens (JWT) for `signed` playback IDs.                   |
| **API key**          | Token ID + secret for server-to-server calls. The dashboard authenticates with browser sessions; the public API with API keys. |
| **Webhook endpoint** | Customer URL subscribed to events. Each **delivery** is HMAC-signed, logged and retried with backoff.                          |
| **Folder**           | Dashboard-only grouping of videos (nested, pinnable). Not part of the public API contract.                                     |

**Video status.** Internally a video moves `draft → uploaded → queued → dispatched → processing → ready | failed`. The public API reports `waiting → processing → ready | errored`; the internal states stay internal.

## V1 scope

V1 is the version that launches publicly. Everything in this section ships in V1; everything else sits in [Beyond V1](#beyond-v1).

### Developer API (`apps/api`)

| Group        | Endpoints                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Videos       | `POST /v1/videos` (ingest from URL), `GET /v1/videos`, `GET` / `PATCH` / `DELETE /v1/videos/:id` |
| Uploads      | `POST /v1/uploads`, `GET /v1/uploads/:id`, multipart part signing and completion for large files |
| Playback IDs | `POST /v1/videos/:id/playback-ids`, `DELETE /v1/videos/:id/playback-ids/:playbackId`             |
| Signing keys | `POST` / `GET` / `DELETE /v1/signing-keys`                                                       |
| Webhooks     | Endpoint CRUD, a test ping, and the delivery log                                                 |

The public API authenticates with API keys, the dashboard with sessions. `DELETE` removes the video's files from storage. OpenAPI docs are generated from the TypeBox schemas.

### Delivery

Public routes keyed by playback ID, no API key:

- `GET /stream/:playbackId.m3u8` checks the playback token for `signed` IDs and serves the master playlist with signed URLs for variant playlists and segments, so the bucket stays private.
- `GET /image/:playbackId/thumbnail.jpg`, `/storyboard.vtt` (with its sprite), `/preview.webm`.

### Transcoding (`workers/transcoder`)

Per video:

- an HLS ladder (1080p / 720p / 480p, capped at the source resolution, extra high-frame-rate rungs for high-fps sources)
- 8-bit `yuv420p` video so every browser can decode it, stereo AAC audio
- correct output for rotated phone video and for videos with no audio track
- a poster JPG, a short hover preview, and a storyboard sprite + VTT for scrub thumbnails
- idempotent retries: a retried job leaves one set of asset rows

### Webhooks

Events: `video.created`, `video.processing`, `video.ready`, `video.errored`, `video.deleted`. Payloads carry the public video shape, including playback IDs and `passthrough`.

### Player (`packages/player`)

`<vidcastx-player playback-id="…">` web component plus a thin React wrapper: HLS playback (native on Safari, hls.js elsewhere), a `token` attribute for signed playback, and the poster and storyboard wired in automatically.

### Dashboard (`apps/app`)

Every navigation item leads to a working page.

- **Overview**: first-run checklist (create org, upload, create API key, add webhook) and real counts.
- **Videos**: folder browser, upload, and a video page with the player, pipeline status, playback IDs, embed snippet, outputs and recent events.
- **Developers**: API keys, signing keys, webhooks with delivery log and manual retry.
- **Settings**: team members and invites, organization.

### Self-hosting and docs

- One `docker compose up` brings up Postgres, Redis, MinIO, API, transcoder and dashboard with a seeded demo account.
- `apps/docs` (Fumadocs, fully offline) covers the quickstart, self-hosting, the API, and how each pipeline stage works.

### Stretch: analytics

With time left in V1: the player reports views, watch time, startup time, rebuffering and playback errors, and the video page shows them. This is the first thing cut when time runs short.

## V1 is done when

Every item holds on a fresh clone:

1. `docker compose up` brings the full stack up healthy; the only manual step is copying `.env.example`.
2. With an API key, a developer creates an upload, uploads a real phone video (rotated, with audio), receives a signed `video.ready` webhook, and plays it through `<vidcastx-player>` with a signed token in current Chrome, Firefox and Safari.
3. The same flow works entirely from the dashboard.
4. `DELETE` removes the video and its files; an expired playback token is rejected.
5. CI passes typecheck, lint, format, unit tests, build, and an end-to-end smoke test of step 2.
6. The docs quickstart, self-hosting guide, API reference and pipeline guides match shipped behaviour.

## Beyond V1

**Parked** until V1 has launched and shown interest; each needs its own scope decision:

- Deployment kits: Terraform for AWS, a Helm chart for Kubernetes.
- In-process libav transcoder (draft PR #69), per-title encoding, AV1, 4K, chunked parallel encoding (`workers/transcoder/ROADMAP.md`).
- Captions: uploaded WebVTT tracks first, automatic captions later.
- MP4 static renditions for download.
- Live streaming: RTMP ingest, recording to VOD.
- SDKs beyond TypeScript; a hosted VidcastX cloud.

**Dropped** from the product: AI summaries, chapters, dubbing and semantic search; cross-posting to social platforms; billing and usage metering. V1 removes their database schemas.
