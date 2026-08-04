import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FaRegThumbsUp, FaThumbsUp, FaTrash, FaReply } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import styled from 'styled-components'

const Wrapper = styled.section`
  margin-top: 40px;
`

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
`

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 16px;
`

const Composer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-elevated);
  flex-shrink: 0;
`

const InitialAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
  text-transform: uppercase;
`

const ComposerName = styled.span`
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
`

const Textarea = styled.textarea`
  flex: 1;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  padding: 10px 12px;
  resize: vertical;
  min-height: 64px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: var(--accent); }
`

const PostBtn = styled.button`
  padding: 10px 22px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${p => p.$disabled ? 'wait' : 'pointer'};
  opacity: ${p => p.$disabled ? 0.6 : 1};
  align-self: flex-start;
  white-space: nowrap;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const Item = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
`

const ItemReply = styled(Item)`
  margin-left: 46px;
  @media (max-width: 480px) { margin-left: 20px; }
`

const ItemHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`

const ItemName = styled(Link)`
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

const ItemTime = styled.span`
  color: var(--text-muted);
  font-size: 12px;
`

const ItemBody = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 10px;
  white-space: pre-wrap;
  word-break: break-word;
`

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

const Action = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: ${p => p.$active ? 'var(--accent)' : 'var(--text-muted)'};
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
  &:hover { color: var(--accent); }
`

const Empty = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
`

const GuestBox = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.8;
  a { color: var(--accent); text-decoration: none; font-weight: 600; }
  a:hover { text-decoration: underline; }
`

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

const Comments = ({ animeId, episodeNumber, label }) => {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [profiles, setProfiles] = useState({})
  const [myProfile, setMyProfile] = useState(null)
  const [likedIds, setLikedIds] = useState(new Set())
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const query = supabase
      .from('comments')
      .select('*')
      .eq('anime_id', animeId)
      .order('created_at', { ascending: true })
    if (episodeNumber) query.eq('episode_number', episodeNumber)
    const { data, error } = await query
    if (error) { console.error('Comments load:', error); setLoading(false); return }
    const rows = data || []
    setComments(rows)

    const ids = [...new Set(rows.map(c => c.user_id).filter(Boolean))]
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', ids)
      if (profs) {
        setProfiles(Object.fromEntries(profs.map(p => [p.id, p])))
      }
    }

    if (user) {
      const { data: me } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      if (me) setMyProfile(me)
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
      if (likes) setLikedIds(new Set(likes.map(l => l.comment_id)))
    }
    setLoading(false)
  }, [animeId, episodeNumber, user])

  useEffect(() => { load() }, [load])

  const nameOf = (uid) => {
    const p = profiles[uid]
    return p?.display_name || p?.username || 'Anonymous'
  }

  const avatarOf = (uid) => profiles[uid]?.avatar_url || null

  const AvatarBlock = ({ url, name }) => url
    ? <Avatar src={url} alt="" />
    : <InitialAvatar>{(name || 'A').charAt(0)}</InitialAvatar>

  const submit = async (e) => {
    e.preventDefault()
    const text = content.trim()
    if (!text || !user || busy) return
    setBusy(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        anime_id: animeId,
        episode_number: episodeNumber || null,
        content: text.slice(0, 2000),
        parent_id: null,
      })
      .select()
      .single()
    setBusy(false)
    if (error) { console.error('Comment post:', error); return }
    setComments(prev => [...prev, data])
    setProfiles(prev => ({
      ...prev,
      [user.id]: prev[user.id] || {
        username: myProfile?.username || user.user_metadata?.username,
        display_name: myProfile?.display_name || null,
        avatar_url: myProfile?.avatar_url || null,
      },
    }))
    setContent('')
  }

  const submitReply = async (parentId) => {
    const text = replyText.trim()
    if (!text || !user || busy) return
    setBusy(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        anime_id: animeId,
        episode_number: episodeNumber || null,
        content: text.slice(0, 2000),
        parent_id: parentId,
      })
      .select()
      .single()
    setBusy(false)
    if (error) { console.error('Reply post:', error); return }
    setComments(prev => [...prev, data])
    setProfiles(prev => ({
      ...prev,
      [user.id]: prev[user.id] || {
        username: myProfile?.username || user.user_metadata?.username,
        display_name: myProfile?.display_name || null,
        avatar_url: myProfile?.avatar_url || null,
      },
    }))
    setReplyTo(null)
    setReplyText('')
  }

  const toggleLike = async (id) => {
    if (!user) return
    const { data, error } = await supabase.rpc('toggle_comment_like', { p_comment_id: id })
    if (error) { console.error('Like toggle:', error); return }
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: data } : c))
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const remove = async (id) => {
    if (!user) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) { console.error('Comment delete:', error); return }
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const repliesOf = (id) => comments.filter(c => c.parent_id === id)

  const renderItem = (c, reply) => {
    const Mine = reply ? ItemReply : Item
    return (
      <Mine key={c.id}>
        <ItemHead>
          <AvatarBlock url={avatarOf(c.user_id)} name={nameOf(c.user_id)} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ItemName to="/profile">{nameOf(c.user_id)}</ItemName>
            <ItemTime>{timeAgo(c.created_at)}</ItemTime>
          </div>
        </ItemHead>
        <ItemBody>{c.content}</ItemBody>
        <ItemActions>
          <Action $active={likedIds.has(c.id)} onClick={() => toggleLike(c.id)} title="Like">
            {likedIds.has(c.id) ? <FaThumbsUp size={13} /> : <FaRegThumbsUp size={13} />}
            {c.likes || 0}
          </Action>
          <Action onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText('') }}>
            <FaReply size={12} /> Reply
          </Action>
          {user && user.id === c.user_id && (
            <Action onClick={() => remove(c.id)} title="Delete" style={{ marginLeft: 'auto' }}>
              <FaTrash size={12} /> Delete
            </Action>
          )}
        </ItemActions>
        {replyTo === c.id && (
          <Composer style={{ marginTop: 12, marginBottom: 0 }}>
            <Textarea
              placeholder={`Reply to ${nameOf(c.user_id)}…`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={2}
            />
            <PostBtn $disabled={busy || !replyText.trim()} onClick={() => submitReply(c.id)}>Post</PostBtn>
          </Composer>
        )}
      </Mine>
    )
  }

  return (
    <Wrapper>
      <Title>Comments ({comments.length})</Title>
      {label && <Subtitle>{label}</Subtitle>}

      {user ? (
        <Composer>
          <AvatarBlock
            url={myProfile?.avatar_url}
            name={myProfile?.display_name || myProfile?.username || user.email || 'You'}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ComposerName>{myProfile?.display_name || myProfile?.username || user.email}</ComposerName>
            <form style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }} onSubmit={submit}>
              <Textarea
                placeholder="Share your thoughts…"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={2000}
              />
              <PostBtn type="submit" $disabled={busy || !content.trim()}>Post</PostBtn>
            </form>
          </div>
        </Composer>
      ) : (
        <GuestBox>
          <Link to="/login">Log in</Link> or <Link to="/signup">create an account</Link> to join the discussion.
        </GuestBox>
      )}

      {loading ? (
        <Empty>Loading comments…</Empty>
      ) : topLevel.length === 0 ? (
        <Empty>No comments yet. Be the first to share your thoughts!</Empty>
      ) : (
        <List>
          {topLevel.map(c => (
            <React.Fragment key={c.id}>
              {renderItem(c, false)}
              {repliesOf(c.id).map(r => renderItem(r, true))}
            </React.Fragment>
          ))}
        </List>
      )}
    </Wrapper>
  )
}

export default Comments
