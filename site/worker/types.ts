export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  JWT_SECRET: string;
}

export interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
}

export interface GitHubUser {
  login: string;
  id: number;
}

export interface JWTPayload {
  sub: string;
  login: string;
  exp: number;
}

export interface JWTHeader {
  alg: string;
  typ: string;
}

export interface AuthMessage {
  token: string;
  login: string;
}
