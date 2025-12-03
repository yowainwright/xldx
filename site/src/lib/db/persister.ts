import { get, set, del } from "idb-keyval";
import { DEFAULT_IDB_KEY } from "./constants";
import type { PersistedClient, Persister, IDBPersisterOptions } from "./types";

export function createIDBPersister(options: IDBPersisterOptions = {}): Persister {
  const key = options.key ?? DEFAULT_IDB_KEY;

  return {
    persistClient: async (client: PersistedClient) => {
      await set(key, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(key);
    },
    removeClient: async () => {
      await del(key);
    },
  };
}
