import { lazy, type ComponentType } from 'react';

// Lazy with one-shot stale-cache recovery.
//
// Failure mode it kills: after a deploy, the service worker / HTTP cache
// can serve an old index.html (or a partially-evicted precache) whose
// chunk hashes no longer exist on the host. The dynamic import() then
// rejects and React Suspense would spin FOREVER (the "three dots, no
// content" hang). On first failure this unregisters service workers,
// clears caches, and hard-reloads once so the fresh bundle boots.
// Guarded per session: if the reload still fails (genuinely broken
// deploy), the rejection propagates to the route ErrorBoundary instead
// of reload-looping.
const RETRY_KEY = 'aniraku:chunk-retry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    loader().catch((err: unknown) => {
      try {
        if (!sessionStorage.getItem(RETRY_KEY)) {
          sessionStorage.setItem(RETRY_KEY, '1');
          void (async () => {
            try {
              const regs =
                (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
              await Promise.all(regs.map((reg) => reg.unregister()));
              const keys = (await caches?.keys?.()) ?? [];
              await Promise.all(keys.map((key) => caches.delete(key)));
            } catch {
              // best-effort — reload anyway
            }
            window.location.reload();
          })();
        }
      } catch {
        // storage unavailable — fall through to the rejection below
      }
      return Promise.reject(err);
    }),
  );
}
