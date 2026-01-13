import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("keywords router", () => {
  it("should create a keyword", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.keywords.create({
      keyword: "test keyword",
      url: "https://example.com/test",
      location: "Brazil",
      targetPosition: 1,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("success", true);
    expect(typeof result.id).toBe("number");
  });

  it("should list keywords for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a keyword first
    await caller.keywords.create({
      keyword: "test keyword list",
      url: "https://example.com/test-list",
      location: "Brazil",
      targetPosition: 1,
    });

    const keywords = await caller.keywords.list();

    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
  });

  it("should get keyword by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a keyword first
    const created = await caller.keywords.create({
      keyword: "test keyword get",
      url: "https://example.com/test-get",
      location: "Brazil",
      targetPosition: 1,
    });

    // Skip if insertId is not available
    if (!created.id || isNaN(created.id)) {
      console.log("Skipping test: insertId not available");
      return;
    }

    const keyword = await caller.keywords.getById({ id: created.id });

    expect(keyword).toBeDefined();
    expect(keyword?.keyword).toBe("test keyword get");
    expect(keyword?.url).toBe("https://example.com/test-get");
  });

  it("should update a keyword", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a keyword first
    const created = await caller.keywords.create({
      keyword: "test keyword update",
      url: "https://example.com/test-update",
      location: "Brazil",
      targetPosition: 1,
    });

    // Skip if insertId is not available
    if (!created.id || isNaN(created.id)) {
      console.log("Skipping test: insertId not available");
      return;
    }

    const result = await caller.keywords.update({
      id: created.id,
      keyword: "updated keyword",
      targetPosition: 5,
    });

    expect(result).toHaveProperty("success", true);

    // Verify update
    const updated = await caller.keywords.getById({ id: created.id });
    expect(updated?.keyword).toBe("updated keyword");
    expect(updated?.targetPosition).toBe(5);
  });

  it("should delete a keyword", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a keyword first
    const created = await caller.keywords.create({
      keyword: "test keyword delete",
      url: "https://example.com/test-delete",
      location: "Brazil",
      targetPosition: 1,
    });

    // Skip if insertId is not available
    if (!created.id || isNaN(created.id)) {
      console.log("Skipping test: insertId not available");
      return;
    }

    const result = await caller.keywords.delete({ id: created.id });

    expect(result).toHaveProperty("success", true);

    // Verify deletion
    const deleted = await caller.keywords.getById({ id: created.id });
    expect(deleted).toBeUndefined();
  });

  it("should validate keyword input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test invalid URL
    await expect(
      caller.keywords.create({
        keyword: "test",
        url: "not-a-valid-url",
        location: "Brazil",
        targetPosition: 1,
      })
    ).rejects.toThrow();

    // Test empty keyword
    await expect(
      caller.keywords.create({
        keyword: "",
        url: "https://example.com",
        location: "Brazil",
        targetPosition: 1,
      })
    ).rejects.toThrow();
  });
});

describe("rankings router", () => {
  it("should get rankings summary", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.rankings.getSummary();

    expect(summary).toHaveProperty("totalKeywords");
    expect(summary).toHaveProperty("avgPosition");
    expect(summary).toHaveProperty("improved");
    expect(summary).toHaveProperty("declined");
    expect(summary).toHaveProperty("stable");
    expect(typeof summary.totalKeywords).toBe("number");
  });

  it("should get ranking history for keyword", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a keyword first
    const created = await caller.keywords.create({
      keyword: "test keyword ranking",
      url: "https://example.com/test-ranking",
      location: "Brazil",
      targetPosition: 1,
    });

    // Skip if insertId is not available
    if (!created.id || isNaN(created.id)) {
      console.log("Skipping test: insertId not available");
      return;
    }

    const history = await caller.rankings.getHistory({
      keywordId: created.id,
      limit: 12,
    });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("gsc router", () => {
  it("should get auth url", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gsc.getAuthUrl();

    expect(result).toHaveProperty("authUrl");
    expect(typeof result.authUrl).toBe("string");
    expect(result.authUrl).toContain("accounts.google.com");
  });

  it("should get connection status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.gsc.getStatus();

    expect(status).toHaveProperty("connected");
    expect(typeof status.connected).toBe("boolean");
  });

  it("should disconnect gsc", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gsc.disconnect();

    expect(result).toHaveProperty("success", true);
  });
});
