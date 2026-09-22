import { treaty } from "@elysiajs/eden";
import { describe, expect, it, mock } from "bun:test";

// Mock DB and storage before importing the controller
void mock.module("@vidcastx/database/client", () => ({
  db: {
    insert: () => ({
      values: () => Promise.resolve(),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  },
}));

// Mock drizzle-orm operators — needed because VideoService imports from both
// @vidcastx/database and drizzle-orm depending on the module resolution path
const drizzleStubs = {
  eq: (a: unknown, b: unknown) => ({ a, b }),
  and: (...args: unknown[]) => args,
  asc: (col: unknown) => col,
  desc: (col: unknown) => col,
  inArray: (col: unknown, vals: unknown[]) => ({ col, vals }),
  isNull: (col: unknown) => ({ isNull: col }),
};

void mock.module("@vidcastx/database", () => ({
  ...drizzleStubs,
  alias: () => ({}),
  sql: {},
}));

void mock.module("drizzle-orm", () => drizzleStubs);

void mock.module("drizzle-orm/sql", () => ({
  sql: {},
}));

void mock.module("drizzle-orm/pg-core", () => ({
  alias: () => ({}),
}));

void mock.module("@vidcastx/database/schema/video-schema", () => ({
  assets: {
    type: "type",
    storageKey: "storage_key",
  },
  videos: {
    id: "id",
    status: "status",
    playbackUrl: "playback_url",
    errorReason: "error_reason",
  },
}));

void mock.module("@vidcastx/storage", () => ({
  getDownloadUrl: (key: string) => Promise.resolve(`https://s3.example.com/${key}`),
  initMultipartUpload: () => Promise.resolve("mock-upload-id"),
  signMultipartPart: () => Promise.resolve("https://s3.example.com/signed-url"),
  completeMultipartUpload: () => Promise.resolve(),
  listParts: () => Promise.resolve([{ PartNumber: 1, ETag: "abc", Size: 1024 }]),
  abortMultipartUpload: () => Promise.resolve(),
}));

void mock.module("@vidcastx/database/utils/id", () => ({
  generateId: (prefix: string) => `${prefix}_testgenerated123`,
}));

// Provide env vars the controller expects
const TEST_JWT_SECRET = "test-jwt-secret-for-testing-only-32chars!";
const TEST_TRANSCODER_SECRET = "test-transcoder-secret";

void mock.module("../src/env", () => ({
  env: {
    JWT_SECRET: TEST_JWT_SECRET,
    TRANSCODER_SECRET: TEST_TRANSCODER_SECRET,
    PORT: 3001,
    NODE_ENV: "test",
  },
}));

// Import after mocks
const { default: internalController } = await import("../src/modules/internal");
const api = treaty(internalController);

async function getValidToken(): Promise<string> {
  const { data } = await api.internal.token.post({
    clientId: "worker-transcoder",
    clientSecret: TEST_TRANSCODER_SECRET,
  });
  if (!data?.access_token) throw new Error("failed to obtain test token");
  return data.access_token;
}

describe("Internal Controller — M2M Authentication", () => {
  describe("POST /internal/token", () => {
    it("grants token with valid credentials", async () => {
      const { data, status } = await api.internal.token.post({
        clientId: "worker-transcoder",
        clientSecret: TEST_TRANSCODER_SECRET,
      });

      expect(status).toBe(200);
      expect(data?.access_token).toBeDefined();
      expect(data?.token_type).toBe("Bearer");
      expect(data?.expires_in).toBe(3600);
    });

    it("rejects invalid client secret", async () => {
      const { data, status } = await api.internal.token.post({
        clientId: "worker-transcoder",
        clientSecret: "wrong-secret",
      });

      expect(status).toBe(401);
      expect(data).toBeNull();
    });

    it("rejects unknown client ID", async () => {
      const { status } = await api.internal.token.post({
        clientId: "unknown-worker",
        clientSecret: "some-secret",
      });

      expect(status).toBe(401);
    });

    it("rejects empty credentials", async () => {
      const { status } = await api.internal.token.post({
        clientId: "",
        clientSecret: "",
      });

      // Elysia returns 422 for TypeBox validation failures (minLength: 1)
      expect(status).toBe(422);
    });
  });

  describe("PATCH /internal/videos/:id/status", () => {
    it("updates video status with valid token", async () => {
      const token = await getValidToken();

      const { data, status } = await api.internal
        .videos({ id: "vid_test123" })
        .status.patch({ status: "processing" }, { headers: { Authorization: `Bearer ${token}` } });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("marks video as ready with playback URL", async () => {
      const token = await getValidToken();

      const { status } = await api.internal.videos({ id: "vid_test123" }).status.patch(
        {
          status: "ready",
          playbackKey: "processed/org_123/vid_test123/master.m3u8",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      expect(status).toBe(200);
    });

    it("marks video as failed with error reason", async () => {
      const token = await getValidToken();

      const { status } = await api.internal.videos({ id: "vid_test123" }).status.patch(
        {
          status: "failed",
          errorReason: "FFmpeg encoding failed",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      expect(status).toBe(200);
    });

    it("rejects invalid status value", async () => {
      const token = await getValidToken();

      const { status } = await api.internal.videos({ id: "vid_test123" }).status.patch(
        // @ts-expect-error — intentionally sending invalid status to test 422 path
        { status: "nonexistent" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Elysia returns 422 for TypeBox validation failures
      expect(status).toBe(422);
    });

    it("rejects request without bearer token", async () => {
      const { status } = await api.internal.videos({ id: "vid_test123" }).status.patch({ status: "processing" });

      // Should fail auth — either 401 or 403
      expect(status).toBeGreaterThanOrEqual(400);
    });

    it("rejects request with invalid token", async () => {
      const { status } = await api.internal
        .videos({ id: "vid_test123" })
        .status.patch({ status: "processing" }, { headers: { Authorization: "Bearer fake-jwt-token" } });

      expect(status).toBeGreaterThanOrEqual(400);
    });
  });
});
