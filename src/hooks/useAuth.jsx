import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { defaultAvatar } from '../lib/avatars'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

function sanitizeUsername(raw) {
  const base = (raw || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const clipped = base.slice(0, 20)
  return clipped.length >= 3 ? clipped : `user_${Math.random().toString(36).slice(2, 6)}`
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, email) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, banner_url, location, socials, created_at')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      if (data) {
        setProfile(data)
      } else {
        // Ensure profile row exists (trigger may have failed on bad username)
        const username = sanitizeUsername(email?.split('@')[0] || `user_${userId.slice(0, 6)}`)
        const fallbackAvatar = defaultAvatar(username.charCodeAt(0)).url
        const { data: created } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            username,
            display_name: username,
            avatar_url: fallbackAvatar,
          }, { onConflict: 'id' })
          .select('id, username, display_name, bio, avatar_url, banner_url, location, socials, created_at')
          .maybeSingle()
        setProfile(created || { id: userId, username, display_name: username, avatar_url: fallbackAvatar })
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
      const username = sanitizeUsername(email?.split('@')[0] || 'user')
      setProfile({ id: userId, username, display_name: username, avatar_url: defaultAvatar(0).url })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) fetchProfile(session.user.id, session.user.email)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
        supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data)).catch(() => setIsAdmin(false))
      }
      else {
        setProfile(null)
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email, password, username) => {
    const clean = sanitizeUsername(username || email.split('@')[0])
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: clean, display_name: clean },
      },
    })
    if (error) throw error
    if (!data.user?.identities?.length) {
      throw new Error('This email is already registered. Try signing in instead.')
    }
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }

  const updateProfile = async (updates) => {
    if (!user) return
    const { id, ...fields } = updates
    if (fields.username) fields.username = sanitizeUsername(fields.username)
    // Use .update() to avoid NOT NULL violation on username when only updating avatar/bio
    const { error } = await supabase.from('profiles').update(fields).eq('id', user.id)
    if (error) throw error
    setProfile(prev => ({ ...prev, ...fields }))
  }

  const ctx = useMemo(() => ({ user, profile, isAdmin, loading, signUp, signIn, signOut, updateProfile, isSupabaseConfigured }), [user, profile, isAdmin, loading, isSupabaseConfigured])
  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  )
}
