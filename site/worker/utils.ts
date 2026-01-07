import {
  GITHUB_OAUTH_URL,
  GITHUB_TOKEN_URL,
  GITHUB_USER_URL,
  WORKER_URL,
  AUTH_CALLBACK_PATH,
  JWT_EXPIRY_MS,
  JWT_ALGORITHM,
  JWT_TYPE,
} from "./constants";
import type {
  GitHubTokenResponse,
  GitHubUser,
  JWTPayload,
  JWTHeader,
} from "./types";

export function buildGitHubAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "read:user",
    redirect_uri: `${WORKER_URL}${AUTH_CALLBACK_PATH}`,
  });

  return `${GITHUB_OAUTH_URL}?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const data = (await response.json()) as GitHubTokenResponse;
  return data.access_token ?? null;
}

export async function fetchGitHubUser(
  accessToken: string,
): Promise<GitHubUser | null> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "xldx-demo",
    },
  });

  if (!response.ok) return null;

  return response.json() as Promise<GitHubUser>;
}

export function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlDecode(data: string): string {
  const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

export function buildJWTHeader(): JWTHeader {
  return { alg: JWT_ALGORITHM, typ: JWT_TYPE };
}

export function buildJWTPayload(sub: string, login: string): JWTPayload {
  return { sub, login, exp: Date.now() + JWT_EXPIRY_MS };
}

export async function createJWT(
  sub: string,
  login: string,
  secret: string,
): Promise<string> {
  const header = base64UrlEncode(JSON.stringify(buildJWTHeader()));
  const payload = base64UrlEncode(JSON.stringify(buildJWTPayload(sub, login)));
  const signature = await hmacSign(`${header}.${payload}`, secret);

  return `${header}.${payload}.${signature}`;
}

export function parseJWTPayload(token: string): JWTPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyJWTSignature(
  token: string,
  secret: string,
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [header, payload, signature] = parts;
  const expectedSignature = await hmacSign(`${header}.${payload}`, secret);

  return signature === expectedSignature;
}

export function isJWTExpired(payload: JWTPayload): boolean {
  return payload.exp < Date.now();
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload | null> {
  const isValidSignature = await verifyJWTSignature(token, secret);
  if (!isValidSignature) return null;

  const payload = parseJWTPayload(token);
  if (!payload) return null;

  if (isJWTExpired(payload)) return null;

  return payload;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function buildAuthSuccessHtml(token: string, login: string): string {
  return `<script>window.opener.postMessage({ token: "${token}", login: "${login}" }, "*"); window.close();</script>`;
}
