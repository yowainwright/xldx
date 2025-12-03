"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { createIDBPersister, CACHE_TIME_MS } from "@/lib/db";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: CACHE_TIME_MS,
          },
        },
      })
  );

  useEffect(() => {
    const persister = createIDBPersister();
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: CACHE_TIME_MS,
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
