import { Hono } from "hono";
import { cors } from "hono/cors";
import { XLSX_CONTENT_TYPE } from "./constants";
import {
  buildGitHubAuthUrl,
  exchangeCodeForToken,
  fetchGitHubUser,
  createJWT,
  verifyJWT,
  extractBearerToken,
  buildAuthSuccessHtml,
} from "./utils";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/auth/github", (c) => {
  const authUrl = buildGitHubAuthUrl(c.env.GITHUB_CLIENT_ID);
  return c.redirect(authUrl);
});

app.get("/auth/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.text("Missing code", 400);
  }

  const accessToken = await exchangeCodeForToken(
    code,
    c.env.GITHUB_CLIENT_ID,
    c.env.GITHUB_CLIENT_SECRET,
  );

  if (!accessToken) {
    return c.text("Auth failed", 401);
  }

  const user = await fetchGitHubUser(accessToken);

  if (!user) {
    return c.text("Failed to fetch user", 401);
  }

  const jwt = await createJWT(String(user.id), user.login, c.env.JWT_SECRET);
  const html = buildAuthSuccessHtml(jwt, user.login);

  return c.html(html);
});

app.get("/api/generate", async (c) => {
  const token = extractBearerToken(c.req.header("Authorization"));

  if (!token) {
    return c.text("Unauthorized", 401);
  }

  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.text("Invalid token", 401);
  }

  const { Xldx } = await import("xldx");

  const data = [
    { label: "Generated on Node.js (Cloudflare Worker)", value: "" },
    { label: "User", value: payload.login },
    { label: "Timestamp", value: new Date().toISOString() },
  ];

  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Demo" },
    { key: "label", header: "Label" },
    { key: "value", header: "Value" },
  );

  const xlsx = await xldx.toUint8Array();

  return new Response(xlsx as BodyInit, {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": "attachment; filename=demo-node.xlsx",
    },
  });
});

export default app;
