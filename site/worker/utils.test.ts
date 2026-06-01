import { describe, it, expect } from "bun:test";
import {
  buildGitHubAuthUrl,
  base64UrlEncode,
  base64UrlDecode,
  extractBearerToken,
  buildJWTHeader,
  buildJWTPayload,
  parseJWTPayload,
  isJWTExpired,
  createJWT,
  verifyJWT,
  buildAuthSuccessHtml,
} from "./utils";

describe("utils", () => {
  describe("buildGitHubAuthUrl", () => {
    it("builds correct OAuth URL", () => {
      const url = buildGitHubAuthUrl("my-client-id");

      expect(url).toContain("github.com/login/oauth/authorize");
      expect(url).toContain("client_id=my-client-id");
      expect(url).toContain("scope=read%3Auser");
    });
  });

  describe("base64Url encoding/decoding", () => {
    it("encodes and decodes correctly", () => {
      const original = '{"test": "value"}';
      const encoded = base64UrlEncode(original);
      const decoded = base64UrlDecode(encoded);

      expect(decoded).toBe(original);
    });

    it("handles URL-safe characters", () => {
      const encoded = base64UrlEncode("test+/data");

      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
    });
  });

  describe("extractBearerToken", () => {
    it("extracts token from valid header", () => {
      const token = extractBearerToken("Bearer my-token");
      expect(token).toBe("my-token");
    });

    it("returns null for missing header", () => {
      expect(extractBearerToken(null)).toBeNull();
    });

    it("returns null for non-Bearer header", () => {
      expect(extractBearerToken("Basic abc123")).toBeNull();
    });
  });

  describe("JWT functions", () => {
    const secret = "test-secret-key-that-is-long-enough";

    describe("buildJWTHeader", () => {
      it("returns correct header", () => {
        const header = buildJWTHeader();
        expect(header.alg).toBe("HS256");
        expect(header.typ).toBe("JWT");
      });
    });

    describe("buildJWTPayload", () => {
      it("builds payload with expiry", () => {
        const payload = buildJWTPayload("123", "testuser");

        expect(payload.sub).toBe("123");
        expect(payload.login).toBe("testuser");
        expect(payload.exp).toBeGreaterThan(Date.now());
      });
    });

    describe("parseJWTPayload", () => {
      it("parses valid JWT", async () => {
        const jwt = await createJWT("123", "testuser", secret);
        const payload = parseJWTPayload(jwt);

        expect(payload?.sub).toBe("123");
        expect(payload?.login).toBe("testuser");
      });

      it("returns null for invalid token", () => {
        expect(parseJWTPayload("invalid")).toBeNull();
      });
    });

    describe("isJWTExpired", () => {
      it("returns false for future expiry", () => {
        const payload = { sub: "1", login: "test", exp: Date.now() + 100000 };
        expect(isJWTExpired(payload)).toBe(false);
      });

      it("returns true for past expiry", () => {
        const payload = { sub: "1", login: "test", exp: Date.now() - 1000 };
        expect(isJWTExpired(payload)).toBe(true);
      });
    });

    describe("createJWT and verifyJWT", () => {
      it("creates and verifies valid JWT", async () => {
        const jwt = await createJWT("123", "testuser", secret);
        const payload = await verifyJWT(jwt, secret);

        expect(payload).not.toBeNull();
        expect(payload?.sub).toBe("123");
        expect(payload?.login).toBe("testuser");
      });

      it("rejects JWT with wrong secret", async () => {
        const jwt = await createJWT("123", "testuser", secret);
        const payload = await verifyJWT(jwt, "wrong-secret");

        expect(payload).toBeNull();
      });

      it("rejects tampered JWT", async () => {
        const jwt = await createJWT("123", "testuser", secret);
        const tampered = jwt.slice(0, -5) + "XXXXX";
        const payload = await verifyJWT(tampered, secret);

        expect(payload).toBeNull();
      });
    });
  });

  describe("buildAuthSuccessHtml", () => {
    it("returns HTML with postMessage script", () => {
      const html = buildAuthSuccessHtml("my-token", "testuser");

      expect(html).toContain("postMessage");
      expect(html).toContain("my-token");
      expect(html).toContain("testuser");
      expect(html).toContain("window.close()");
    });
  });
});
