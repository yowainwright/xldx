export type DemoEnvironment = "browser" | "worker" | "node";

export interface DemoTab {
  id: DemoEnvironment;
  label: string;
  description: string;
}

export interface AuthState {
  token: string | null;
  login: string | null;
}
