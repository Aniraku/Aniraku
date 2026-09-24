import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getSessionUserId, subscribeToSession } from '../lib/sync';

// ---------------------------------------------------------------------------
// useNsfw — TS port of Aniraku `src/hooks/useNsfw.js` (hook body + shared
// module state + isNsfw/filterAdult), re-based onto Miruro:
//   - session detection goes through lib/sync (`supabase.auth` getSession /
//     onAuthStateChange bridge) — NO auth-hook import (cross-wave rule),
//     with an explicit "loading" phase so a stale guest key can never seed
//     before the bridge has answered (Aniraku's `loading` guard, :36-39).
//   - account value lives in `user_settings` (key `nsfw_enabled`,
//     select eq user_id+key, upsert onConflict `user_id,key`); guests fall
//     back to the device key `aniraku-nsfw-enabled` (kept verbatim — Wave A's
//     AuthProvider already clears it on sign-out).
//   - DEFAULT IS OFF / hidden: `readLocal()` is `=== 'true'` (→ false) and
//     the account read is `data?.value === true` (→ false when no row).
//   - shared per-account state: N instances fire a single user_settings
//     query and stay in sync when the toggle flips anywhere.
//
// NSFW gates browse/display ONLY (Hentai-genre rule via isNsfw/filterAdult);
// it must never influence sync payloads (sync = unfiltered, per user
// decision — see lib/sync.ts import/export).
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'aniraku-nsfw-enabled';

const readLocal = (): boolean => {
  try {
    return localStorage.getItem(LOCAL_KEY) === 'true';
  } catch {
    return false;
  }
};

interface SharedNsfwState {
  userId: string | null;
  value: boolean | null;
  pending: Promise<void> | null;
  listeners: Set<(value: boolean) => void>;
}

const shared: SharedNsfwState = {
  userId: null,
  value: null,
  pending: null,
  listeners: new Set(),
};

const publish = (value: boolean): void => {
  shared.value = value;
  shared.listeners.forEach((listener) => listener(value));
};

export interface UseNsfwResult {
  nsfwEnabled: boolean;
  toggleNsfw: () => void;
  updateNsfw: (enabled: boolean) => Promise<void>;
}

export const useNsfw = (): UseNsfwResult => {
  // Supabase session identity (undefined loading → resolved uid/guest).
  const [auth, setAuth] = useState<{ loading: boolean; uid: string | null }>({
    loading: true,
    uid: null,
  });

  useEffect(() => {
    let cancelled = false;
    let seenUser = false;
    // Bridge listener: fires immediately (may be pre-resolution null), then
    // on every auth change.
    const unsubscribe = subscribeToSession((userId) => {
      if (cancelled) return;
      if (userId) {
        seenUser = true;
        setAuth({ loading: false, uid: userId });
      } else if (seenUser) {
        // sign-out after a session — back to the guest device key
        setAuth({ loading: false, uid: null });
      }
    });
    // Resolve the guest case once: setUserId(null) early-returns when the
    // bridge's cached id is already null, so probe getSession explicitly.
    getSessionUserId()
      .then((id) => {
        if (!cancelled && !id && !seenUser) setAuth({ loading: false, uid: null });
      })
      .catch(() => {
        // bridge keeps loading — Aniraku semantics (never seed local while
        // auth is unresolved)
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const { loading, uid } = auth;
  const user = uid ? { id: uid } : null;

  // When a session exists the account value (user_settings) is authoritative,
  // so never seed from localStorage — a stale key left by a guest session or
  // another account would flash the wrong state before the DB answers. Guests
  // (auth resolved, no user) still read the device key.
  const [nsfwEnabled, setNsfwEnabled] = useState<boolean>(() => {
    if (shared.userId === (user?.id ?? null) && shared.value !== null) {
      return shared.value;
    }
    return !user && !loading ? readLocal() : false;
  });

  useEffect(() => {
    const nextUid = user?.id ?? null;
    if (shared.userId !== nextUid) {
      shared.userId = nextUid;
      shared.value = null;
      shared.pending = null;
    }
    const listener = (value: boolean) => setNsfwEnabled(value);
    shared.listeners.add(listener);
    const cleanup = () => {
      shared.listeners.delete(listener);
    };
    if (shared.value !== null) {
      setNsfwEnabled(shared.value);
      return cleanup;
    }
    if (!user && !loading) {
      publish(readLocal());
      return cleanup;
    }
    if (!user) return cleanup; // still loading — wait for the bridge
    let cancelled = false;
    const guardUid = nextUid;
    if (!shared.pending) {
      shared.pending = (async () => {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('value')
            .eq('user_id', guardUid)
            .eq('key', 'nsfw_enabled')
            .maybeSingle();
          if (shared.userId !== guardUid) return;
          publish(data?.value === true);
        } catch {
          // offline / unconfigured — default (off) stays
        }
      })().finally(() => {
        shared.pending = null;
      });
    }
    void shared.pending.then(() => {
      if (cancelled || shared.userId !== guardUid) return;
      if (shared.value !== null) setNsfwEnabled(shared.value);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [user, loading]);

  const updateNsfw = useCallback(
    async (enabled: boolean): Promise<void> => {
      publish(enabled);
      if (uid) {
        // Account-backed: the DB row is the source of truth, and a stale
        // device key must never leak into another session, so drop it.
        try {
          localStorage.removeItem(LOCAL_KEY);
        } catch {
          // storage unavailable
        }
        await supabase
          .from('user_settings')
          .upsert(
            { user_id: uid, key: 'nsfw_enabled', value: enabled },
            { onConflict: 'user_id,key' },
          );
      } else {
        try {
          localStorage.setItem(LOCAL_KEY, String(enabled));
        } catch {
          // storage unavailable
        }
      }
    },
    [uid],
  );

  const toggleNsfw = useCallback(() => {
    void updateNsfw(!nsfwEnabled);
  }, [nsfwEnabled, updateNsfw]);

  return { nsfwEnabled, toggleNsfw, updateNsfw };
};

// A title counts as NSFW only when it carries the Hentai genre on AniList.
// isAdult alone is too broad — AniList flags some non-hentai series as adult.
export const isNsfw = (item: { genres?: string[] } | null | undefined): boolean =>
  Array.isArray(item?.genres) &&
  item.genres.some((genre) => genre.toLowerCase() === 'hentai');

// filterAdult drops hentai titles from a result list when the account has
// NSFW content disabled. Everything else always passes through.
export const filterAdult = <T extends { genres?: string[] }>(
  items: T[],
  nsfwEnabled: boolean,
): T[] => {
  if (nsfwEnabled || !Array.isArray(items)) return items;
  return items.filter((item) => !isNsfw(item));
};
