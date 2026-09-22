import { describe, expect, it } from "vitest";

import { tryCatch } from "./try-catch";

describe("tryCatch", () => {
  it("returns resolved data and no error", async () => {
    const [data, error] = await tryCatch(Promise.resolve("ready"));

    expect(data).toBe("ready");
    expect(error).toBeNull();
  });

  it("returns the rejection and no data", async () => {
    const rejection = new Error("failed");
    const [data, error] = await tryCatch(Promise.reject(rejection));

    expect(data).toBeNull();
    expect(error).toBe(rejection);
  });
});
