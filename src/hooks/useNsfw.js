import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { API_BASE } from '../config'

const LOCAL_KEY = 'aniraku-nsfw-enabled'

// Per-account NSFW preference. Stored in user_settings (key: nsfw_enabled)
// when signed in; falls back to localStorage for guests so the toggle still
// works without an account. Default is off.
export const useNsfw = () => {
  const { user } = useAuth()
  const [nsfwEnabled, setNsfwEnabled] = useState(() => {
    try { return localStorage.getItem(LOCAL_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase.from('user_settings')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', 'nsfw_enabled')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const v = data?.value === true
        setNsfwEnabled(v)
        try { localStorage.setItem(LOCAL_KEY, String(v)) } catch {}
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user])

  const updateNsfw = useCallback(async (enabled) => {
    setNsfwEnabled(enabled)
    try { localStorage.setItem(LOCAL_KEY, String(enabled)) } catch {}
    if (user) {
      await supabase.from('user_settings').upsert(
        { user_id: user.id, key: 'nsfw_enabled', value: enabled },
        { onConflict: 'user_id,key' },
      )
    }
  }, [user])

  return { nsfwEnabled, updateNsfw }
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

// Most hentai on AniList has no Miruro stream — surface only what can play.
// Results are cached per anime so re-renders and repeated views cost nothing.
const streamCache = new Map()

async function hasMiruroStreams(id) {
  if (!id) return Promise.resolve(false)
  if (streamCache.has(id)) return streamCache.get(id)
  const p = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/miruro/episodes/${id}`)
      if (!res.ok) return false
      const d = await res.json()
      return Object.values(d?.providers || {}).some(pv => {
        const eps = pv?.episodes
        return eps && ((Array.isArray(eps.sub) && eps.sub.length > 0) || (Array.isArray(eps.dub) && eps.dub.length > 0))
      })
    } catch {
      return false
    }
  })()
  streamCache.set(id, p)
  return p
}

// useStreamable keeps normal anime as-is and drops hentai entries that have
// no playable Miruro stream (checked against the backend, cached). When NSFW
// is disabled it drops all hentai, mirroring filterAdult.
export const useStreamable = (items) => {
  const { nsfwEnabled } = useNsfw()
  const list = Array.isArray(items) ? items : []
  const rest = list.filter(it => !isNsfw(it))
  const adult = list.filter(isNsfw)
  const [extra, setExtra] = useState([])

  useEffect(() => {
    if (!nsfwEnabled || adult.length === 0) { setExtra([]); return }
    let cancelled = false
    Promise.all(adult.map(async it => ((await hasMiruroStreams(it.id)) ? it : null)))
      .then(kept => {
        if (cancelled) return
        const next = kept.filter(Boolean)
        setExtra(prev => prev.length === next.length && prev.every((p, i) => p.id === next[i].id) ? prev : next)
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsfwEnabled, list])

  return nsfwEnabled ? [...rest, ...extra] : rest
}
