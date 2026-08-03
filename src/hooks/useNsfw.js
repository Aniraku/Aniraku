import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

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

// filterAdult drops adult titles from a result list when the account has
// NSFW content disabled. Items without an isAdult flag pass through.
export const filterAdult = (items, nsfwEnabled) => {
  if (nsfwEnabled || !Array.isArray(items)) return items
  return items.filter(item => !item.isAdult)
}
