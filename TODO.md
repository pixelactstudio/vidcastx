# VidcastX work queue

This file tracks the gap between the current repository and a repeatable product. `IDEA.md` holds the longer-term vision; it is not a completion checklist.

## P0 — Trust the baseline

- [ ] Merge the reviewed security dependency update and confirm the remaining advisories are either fixed, not reachable, or explicitly accepted with an owner and review date.
- [ ] Keep Renovate and Dependabot updates based on the active development branch and passing the same CI gates as feature work.
- [ ] Add `pnpm audit` reporting to maintenance checks without hiding registry failures or treating an unreviewed override as a complete fix.
- [ ] Expand tests beyond the current controller and utility baseline, especially auth, organization isolation, storage authorization, and worker callbacks.

## P0 — Prove the video path

- [ ] Automate one end-to-end run: create an organization, upload a real video, enqueue it, transcode it, persist generated assets, and play the resulting HLS stream in the browser.
- [ ] Test worker retry, cancellation, duplicate delivery, timeout, partial upload, and FFmpeg failure behavior.
- [ ] Verify S3/MinIO object permissions and signed URL expiry for raw media, thumbnails, previews, and playlists.
- [ ] Record the exact supported codecs, file-size limits, output ladders, and browser playback matrix.

## P1 — Make deployment real

- [ ] Add production containers and deployment manifests for the app, API, and transcoder.
- [ ] Codify secrets, migrations, health/readiness checks, TLS/CORS, observability, backups, and rollback.
- [ ] Define staging and production environments with a repeatable smoke test.

## P1 — Finish the product surfaces already started

- [ ] Complete and verify the video library, folder, publishing, and playback experiences against real API data.
- [ ] Replace placeholder onboarding and billing behavior with an explicitly scoped implementation or remove it from the active flow.
- [ ] Capture authenticated dashboard, upload, processing, and playback screenshots from the reproducible demo environment.

## Later vision — not current scope

- [ ] Embeddable player package and external playback analytics.
- [ ] Transcription, metadata generation, chapters, semantic search, and dubbing.
- [ ] Live RTMP ingestion and automatic VOD creation.
- [ ] Usage billing and webhook delivery.

These items remain product ideas until their scope, owner, acceptance criteria, and deployment path are defined.
