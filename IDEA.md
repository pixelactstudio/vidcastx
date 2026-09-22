# VidcastX — Product Vision and Target Architecture

> [!IMPORTANT]
> This document preserves the intended product direction. It is not a claim that every section is implemented, integrated, or production-ready. See `README.md` for the current repository reality and `TODO.md` for the grounded work queue.

## Current implementation boundary

The checked-in repository currently has one TanStack Start application (`apps/app`), one Elysia API (`apps/api`), shared internal packages, and one FFmpeg transcoder worker. The names and services below—such as `apps/dashboard`, `apps/marketing`, `@vidcastx/player`, the AI worker fleet, live-streaming services, billing, and webhook delivery—describe target capabilities unless the current README explicitly marks them as implemented.

The remainder of this file intentionally keeps the original product and architecture ideas intact.

VidcastX is an enterprise-grade, B2B video hosting, streaming, and AI-processing platform. Unlike consumer-oriented platforms, VidcastX is designed specifically for creators, businesses, and developers to host, transcode, analyze, and distribute their video content globally via embeddable players and robust APIs.

This document outlines the core feature set, the monorepo structure, the microservices architecture, and the database relationships driving the platform.

## 1. Core Platform Features

VidcastX provides a comprehensive suite of tools spanning the entire video lifecycle, from ingestion to analytics and playback.

### Video Hosting & Playback

- **Secure Direct Uploads:** Client-to-cloud uploads via presigned URLs, bypassing the main API to ensure infinite scalability for massive files.

- **Adaptive Bitrate Streaming (HLS):** Automated FFmpeg transcoding into multiple resolutions (1080p, 720p, 480p) to guarantee smooth playback across varying network conditions.

- **Drop-in NPM Video Player:** A highly customizable, embeddable video player package (`@vidcastx/player`). Serving as the sole frontend for video consumption, it seamlessly handles adaptive streaming while acting as the data collection engine for all platform analytics.

- **Content Organization:** Deep hierarchical folder structures and granular visibility controls (Public, Private, Unlisted).

- **Smart Thumbnails:** Automated extraction of optimized keyframes for video previews.

### AI-Powered Automation

- **Precision Transcription:** Integration with OpenAI Whisper for highly accurate, noise-resistant speech-to-text generation.

- **Intelligent Metadata:** LLM-driven generation of SEO-optimized titles, descriptions, and interactive video chapters based on transcript context.

- **Multilingual Dubbing:** Voice cloning and translation via ElevenLabs to automatically localize content for global audiences while maintaining original vocal emotion.

- **Semantic Search:** Generation of vector embeddings for transcripts, enabling users to search for specific spoken concepts _inside_ their video library.

### Enterprise Analytics & Telemetry

- **Granular Session Tracking:** High-resolution tracking of device types, geographic regions, buffering events, quality drops, and exact watch percentages automatically collected by the NPM player.

- **Audience Insights:** Video heatmaps detailing re-watches and viewer drop-off points.

- **Distribution Metrics:** Embed domain tracking to help businesses measure ROI and engagement on external websites.

### Live Streaming (RTMP)

- **Broadcast Ingestion:** Secure RTMP channel and stream key generation.

- **Auto-VOD:** Automatic conversion and saving of finished live streams into Video on Demand (VOD) assets.

### B2B Workspace & Billing

- **Organization Management:** Role-Based Access Control (Owner, Admin, Member) with sophisticated soft-delete mechanisms.

- **Usage-Based Billing:** Aggregation of encoding minutes, AI tokens, storage GB, and bandwidth GB for seamless Stripe metering.

- **Developer Extensibility:** Dedicated webhook dispatcher to notify external client systems of processing lifecycle events.

## 2. Monorepo Structure Overview

The repository is structured as a Turbo-driven monorepo containing user-facing frontends (`apps`), the core backend (`api`), containerized background processors (`workers`), and shared internal libraries (`packages`).

    ├── apps/
    │   ├── dashboard/       # Next.js Creator Studio & Admin Panel
    │   ├── marketing/       # Next.js Landing Page & Documentation
    │   └── api/             # Core Hono/Express API
    ├── workers/             # Dockerized Node.js/Python Background Services
    │   ├── transcoder/      # Raw FFmpeg CLI: Video/Audio encoding
    │   ├── thumbnailer/     # Raw FFmpeg CLI: Frame extraction
    │   ├── transcriber/     # OpenAI Whisper: Highly accurate STT
    │   ├── ai-processor/    # LLMs: Chapters, Summaries, SEO
    │   ├── dubbing/         # ElevenLabs: Voice cloning & translation
    │   └── notifications/   # Webhooks & Email dispatcher
    └── packages/            # Shared internal libraries
        ├── player/          # Embeddable NPM Video Player (React/Web Component)
        ├── database/        # Drizzle ORM schemas & migrations
        ├── auth/            # Better-Auth configuration
        ├── ui/              # Shadcn/Tailwind components
        ├── storage/         # AWS S3 / Cloudflare R2 wrappers
        ├── redis/           # BullMQ/Redis client
        └── env/             # Zod environment validation

## 3. Frontends & Client Packages

### `@vidcastx/player` (Embeddable NPM Package)

The official, universally compatible video player designed to be installed via NPM and embedded on any external website or web application.

- **Responsibilities:**
  - Rendering the HLS video streams securely based on environment variables and API keys.

  - Silently capturing complex telemetry (buffering rates, seek events, fullscreen toggles, watch duration).

  - Transmitting heartbeat and interaction payloads back to the `apps/api` to generate heatmaps and session logs.

### `apps/dashboard` (Creator Studio)

The primary administrative interface for workspace owners and members to manage their video library.

- **Key Components:**
  - Drag-and-drop Uppy file uploads with chunking support.

  - Media management interface interacting with the hierarchical `folder` structure.

  - Analytics dashboards visualizing views, watch time, and heatmaps.

  - AI Tooling interface for requesting translations or editing generated chapters.

### `apps/marketing`

SEO-optimized public-facing website.

- **Key Components:** Pricing pages, developer API documentation, and feature showcases.

### `apps/api` (Main Backend)

The fast, lightweight core API. **By design, this service never processes video files directly.**

- **Responsibilities:**
  - Handling authentication and session management via the `@workspace/auth` package.

  - Processing CRUD operations for the Dashboard (fetching libraries, updating metadata).

  - Generating AWS S3 Presigned URLs for secure client-side uploads.

  - Writing to the `ai_job` table and dispatching events to Redis/SQS message brokers.

  - Ingesting high-volume telemetry via the `embed_stats` and `player_event` endpoints from the NPM player.

## 4. The Worker Fleet (`workers/`)

To ensure high availability and prevent the core API from stalling, all heavy computation is offloaded to dedicated workers. **All workers are designed to be fully Dockerized** to run securely and scale horizontally in environments like ECS or Kubernetes.

### `worker-transcoder` (Video Encoding)

- **Execution:** Utilizes Node.js `child_process.spawn()` to execute **raw FFmpeg CLI** commands directly, avoiding fragile Node-FFmpeg abstraction layers.

- **Trigger:** Listens to the `video.uploaded` message queue.

- **Process:**
  1. Downloads the raw source file from the secure ingestion bucket.

  2. Transcodes the file into adaptive bitrate HLS streams (`.m3u8` playlists).

  3. Extracts the master audio track into a lossless format for the transcriber.

  4. Uploads processed chunks to the public delivery bucket.

  5. Updates the `asset` and `video` database tables (setting `status: 'ready'`).

### `worker-thumbnailer` (Image Extraction)

- **Execution:** Raw FFmpeg CLI.

- **Trigger:** Runs in parallel with the `worker-transcoder`.

- **Process:** Seeks through the video timeline to extract 3-5 optimized JPEG frames. Saves references in the database as `asset_type: 'thumbnail'`.

### `worker-transcriber` (Speech-to-Text)

- **Execution:** OpenAI Whisper API (or equivalent highly-precise model).

- **Trigger:** Triggered upon successful extraction of the audio track by the transcoder.

- **Process:** Feeds the isolated audio to the model to generate exact word-level timings and sentences.

- **Database Updates:** Populates the `transcript` table, setting `is_auto_generated: true` and storing the `word_timings` JSON.

### `worker-ai-processor` (The Intelligence)

- **Execution:** Large Language Models (e.g., GPT-4o).

- **Trigger:** Runs sequentially after `worker-transcriber` completes.

- **Process:** Analyzes the raw transcript text.

- **Outputs:**
  - **Chapters:** Identifies logical topic transitions and writes to the `video_chapter` table.

  - **Summaries:** Generates multi-length summaries and SEO metadata, saving to the `video_summary` table.

  - **Embeddings:** Generates vector embeddings for semantic search capabilities, saving to the `transcript_embedding` table.

### `worker-dubbing` (Voice Cloning & Translation)

- **Execution:** ElevenLabs API.

- **Trigger:** Triggered manually by a user request or automatically via the `ai_job` table (`type: 'dub'`).

- **Process:**
  1. Analyzes the isolated audio and original transcript.

  2. Maps original voice characteristics, tone, and pacing.

  3. Generates translated voiceovers matching the original emotional delivery.

  4. Uploads the new audio tracks as alternative language `assets`.

### `worker-notifications` (Event Dispatcher)

- **Execution:** Node.js Webhook & Email Dispatcher.

- **Trigger:** Listens for completed or failed jobs across the system.

- **Process:** Dispatches transactional emails to users and sends JSON payloads to customer endpoints stored in the `webhook` table.

## 5. Database Schema & Architecture Mapping

The system architecture is tightly coupled to the Drizzle PostgreSQL schema. Key mappings include:

### Video & Content Management

- **`video` & `asset`**: The core entities. The `video` table holds metadata and state, while the `asset` table holds the actual CDN links to HLS playlists, thumbnails, and audio tracks.

- **`folder`**: Supports a parent/child tree hierarchy allowing users to organize thousands of videos cleanly.

### Artificial Intelligence (`ai-schema` & `transcript-schema`)

- **`ai_job`**: Tracks the status of asynchronous tasks (`transcribe`, `translate`, `dub`, `generate_metadata`), logging tokens used and precise costs.

- **`transcript` & `video_chapter`**: Stores the structured output of the AI workers.

- **`transcript_embedding`**: Utilizes `pgvector` (1536 dimensions) to allow semantic querying.

### Analytics & Telemetry (`analytics-schema`)

- **`view_session` & `player_event`**: Granular telemetry tracking device types, geographic regions, buffering events, and interaction history automatically fed by the `@vidcastx/player` NPM package.

- **`embed_stats`**: Tracks which external domains (`embed_domain`) are rendering the iframe player.

- **`video_heatmap`**: Tracks re-watches and drop-off points over the video timeline.

### Live Streaming (`live-schema`)

- **`channel` & `stream`**: Manages RTMP ingest endpoints, records peak viewers, and tracks live broadcast duration.

### Organization & Billing (`auth-schema` & `billing-schema`)

- **`organization`, `member`, `invitation`**: Managed via Better-Auth, utilizing a strict soft-delete pattern to maintain data integrity.

- **`usage_record` & `usage_summary`**: Aggregates API requests, encoding minutes, bandwidth, and AI tokens. This table feeds directly into billing meters via the `subscription` and `invoice` tables.

## 6. Infrastructure & Deployment Lifecycle

1. **Upload Phase:** The client requests a presigned URL from the API, then uploads directly to the S3 ingestion bucket. Upon completion, the client notifies the API.

2. **Message Broker:** The API pushes a processing job payload to Redis (BullMQ).

3. **Containerized Processing:** Docker containers running the worker services pick up the jobs, utilizing raw `ffmpeg` installed within the container image for media manipulation.

4. **Delivery:** Processed HLS chunks are moved to a public output S3 bucket, fronted by a global CDN (e.g., Cloudflare or Cloudfront) for low-latency playback.

5. **Telemetry Loop:** The `@vidcastx/player` NPM package embedded on external sites continuously sends lightweight heartbeat events and player interaction data back to the `apps/api` to update the analytics tables in real-time.
