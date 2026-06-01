import { describe, it, expect, mock, beforeEach } from "bun:test";
import app from "./index";

const mockEnv = {
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  JWT_SECRET: "test-jwt-secret-that-is-long-enough",
};

describe("Worker API", () => {
  describe("GET /auth/github", () => {
    it("redirects to GitHub OAuth", async () => {
      const res = await app.request("/auth/github", {}, mockEnv);

      expect(res.status).toBe(302);
      const location = res.headers.get("Location");
      expect(location).toContain("github.com/login/oauth/authorize");
      expect(location).toContain("client_id=test-client-id");
    });
  });

  describe("GET /auth/callback", () => {
    it("returns 400 when code is missing", async () => {
      const res = await app.request("/auth/callback", {}, mockEnv);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Missing code");
    });
  });

  describe("GET /api/generate", () => {
    it("returns 401 when no token provided", async () => {
      const res = await app.request("/api/generate", {}, mockEnv);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized");
    });

    it("returns 401 when token is invalid", async () => {
      const res = await app.request(
        "/api/generate",
        { headers: { Authorization: "Bearer invalid-token" } },
        mockEnv,
      );

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Invalid token");
    });
  });

  describe("CORS", () => {
    it("includes CORS headers", async () => {
      const res = await app.request("/auth/github", {}, mockEnv);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBeDefined();
    });
  });
});
