"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * Defaults matter more here than the provider itself.
 *
 * With an unconfigured client every query is stale on arrival, so switching
 * tabs or remounting the sidebar refetches collections that have not changed.
 * Workspace data changes when *this* user changes it - and those paths already
 * invalidate explicitly - so a short staleness window costs nothing and removes
 * most of the traffic.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Long enough to cover a tab switch and a remount, short enough that a
        // teammate's change shows up without a reload.
        staleTime: 30_000,
        gcTime: 5 * 60_000,

        // Refetching every time the window regains focus is the wrong default
        // for an app you alt-tab out of constantly to read API docs.
        refetchOnWindowFocus: false,

        retry: (failureCount, error) => {
          // "Unauthorized" and "Forbidden" come from lib/authz and will not
          // succeed on a second attempt; retrying them three times only delays the
          // error the user needs to see.
          const message = error instanceof Error ? error.message : "";
          if (/unauthorized|forbidden|not found/i.test(message)) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        // A mutation has already had a side effect by the time it fails;
        // replaying it risks doing the work twice.
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Created in state so a re-render never swaps the client and drops the cache.
  const [client] = useState(makeQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
