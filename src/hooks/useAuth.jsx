import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, email) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
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
          .select()
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
      if (session?.user) fetchProfile(session.user.id, session.user.email)
      else {
        setProfile(null)
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
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: clean,
        display_name: clean,
        avatar_url: defaultAvatar(clean.charCodeAt(0)).url,
      }, { onConflict: 'id' })
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}
