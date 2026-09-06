import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { API_BASE } from '../config'

const LOCAL_KEY = 'aniraku-nsfw-enabled'

const readLocal = () => {
  try { return localStorage.getItem(LOCAL_KEY) === 'true' } catch { return false }
}

// Shared per-account NSFW state: every useNsfw instance subscribes to one
// module-level value so N instances on a page fire a single user_settings
// query and stay in sync when the toggle flips anywhere.
const shared = {
  userId: null,
  value: null,
  pending: null,
  listeners: new Set(),
}

const publish = (v) => {
  shared.value = v
  shared.listeners.forEach(l => l(v))
}

// Per-account NSFW preference. Stored in user_settings (key: nsfw_enabled)
// when signed in; falls back to localStorage for guests so the toggle still
// works without an account. Default is off.
export const useNsfw = () => {
  const { user, loading } = useAuth()
  // When a session exists the account value (user_settings) is authoritative,
  // so never seed from localStorage — a stale key left by a guest session or
  // another account would flash the wrong state before the DB answers. Guests
  // (auth resolved, no user) still read the device key.
  const [nsfwEnabled, setNsfwEnabled] = useState(() => {
    if (shared.userId === (user?.id || null) && shared.value !== null) return shared.value
    return !user && !loading ? readLocal() : false
  })

  useEffect(() => {
    const uid = user?.id || null
    if (shared.userId !== uid) {
      shared.userId = uid
      shared.value = null
      shared.pending = null
    }
    const listener = (v) => setNsfwEnabled(v)
    shared.listeners.add(listener)
    if (shared.value !== null) {
      setNsfwEnabled(shared.value)
      return () => { shared.listeners.delete(listener) }
    }
    if (!user && !loading) {
      publish(readLocal())
      return () => { shared.listeners.delete(listener) }
    }
    if (!user) {
      return () => { shared.listeners.delete(listener) }
    }
    let cancelled = false
    const query = shared.pending || supabase.from('user_settings')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', 'nsfw_enabled')
      .maybeSingle()
    shared.pending = query
    query
      .then(({ data }) => {
        if (cancelled || shared.userId !== uid) return
        publish(data?.value === true)
      })
      .catch(() => {})
      .finally(() => {
        if (shared.pending === query) shared.pending = null
      })
    return () => { cancelled = true; shared.listeners.delete(listener) }
  }, [user, loading])

  const updateNsfw = useCallback(async (enabled) => {
    publish(enabled)
    if (user) {
      // Account-backed: the DB row is the source of truth, and a stale device
      // key must never leak into another session, so drop it on save.
      try { localStorage.removeItem(LOCAL_KEY) } catch {}
      await supabase.from('user_settings').upsert(
        { user_id: user.id, key: 'nsfw_enabled', value: enabled },
        { onConflict: 'user_id,key' },
      )
    } else {
      try { localStorage.setItem(LOCAL_KEY, String(enabled)) } catch {}
    }
  }, [user])

  const toggleNsfw = useCallback(() => updateNsfw(!nsfwEnabled), [nsfwEnabled, updateNsfw])

  return { nsfwEnabled, toggleNsfw, updateNsfw }
}

// A title counts as NSFW only when it carries the Hentai genre on AniList.
// isAdult alone is too broad — AniList flags some non-hentai series as adult.
export const isNsfw = (item) =>
  Array.isArray(item?.genres) && item.genres.some(g => g.toLowerCase() === 'hentai')

// filterAdult drops hentai titles from a result list when the account has
// NSFW content disabled. Everything else always passes through.
export const filterAdult = (items, nsfwEnabled) => {
  if (nsfwEnabled || !Array.isArray(items)) return items
  return items.filter(item => !isNsfw(item))
}

// Hentai titles are no longer pre-filtered by stream availability: the
// Miruro provider (and its backend probe) was removed, and playability is
// handled at play time by the anikoto/flixcloud provider fallback chain,
// exactly like every other title.
export const useStreamable = (items) => {
  const { nsfwEnabled } = useNsfw()
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items])
  const rest = useMemo(() => list.filter(it => !isNsfw(it)), [list])
  const adult = useMemo(() => list.filter(isNsfw), [list])

  return nsfwEnabled ? [...rest, ...adult] : rest
}
