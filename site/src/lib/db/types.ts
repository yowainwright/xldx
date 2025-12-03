import type { PersistedClient, Persister } from "@tanstack/query-persist-client-core";

export type { PersistedClient, Persister };

export interface IDBPersisterOptions {
  key?: string;
}
