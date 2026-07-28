import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import useLocalStorage from '../hooks/useLocalStorage'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  padding: 40px 20px;
`

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
`

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
`

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`

const Input = styled.input`
  flex: 1;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  &:focus { border-color: var(--accent); }
`

const TextArea = styled.textarea`
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  outline: none;
  &:focus { border-color: var(--accent); }
`

const Btn = styled.button`
  background: ${p => p.primary ? 'var(--accent)' : '#2a2c31'};
  color: ${p => p.primary ? '#000' : '#aaa'};
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`

const CommentCard = styled.div`
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: background 0.2s;
  &:hover { background: var(--bg-elevated); }
`

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const CommentUser = styled.span`
  font-weight: 600;
  color: var(--accent);
  font-size: 14px;
`

const CommentTime = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`

const CommentText = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 14px;
`

const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
`

const LikeBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.liked ? 'var(--accent)' : '#888'};
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
  &:hover { color: var(--accent); }
`

const ReplyBtn = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  &:hover { color: var(--text-primary); }
`

const ReplyBox = styled.div`
  margin-top: 12px;
  padding-left: 20px;
  border-left: 2px solid var(--accent);
`

const TabRow = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
`

const Tab = styled.button`
  background: none;
  border: none;
  border-bottom: 2px solid ${p => p.active ? 'var(--accent)' : 'transparent'};
  color: ${p => p.active ? '#fff' : '#888'};
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
`

const initialComments = [
  { id: 1, user: 'AnimeFan42', text: 'Welcome to Aniraku community! Open-source client, AniList metadata, no media hosting.', time: 'pinned', likes: 12, replies: [] },
]

function formatTime(iso) {
  if (!iso || iso === 'Just now' || iso === 'pinned') return iso || ''
  try {
    const d = new Date(iso)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString()
  } catch {
    return iso
  }
}

const Comments = () => {
  const { user, profile } = useAuth()
  const [localComments, setLocalComments] = useLocalStorage('aniraku-comments-v4', initialComments)
  const [remoteComments, setRemoteComments] = useState([])
  const [likedIds, setLikedIds] = useState(new Set())
  const [newComment, setNewComment] = useState('')
  const [username, setUsername] = useLocalStorage('aniraku-username', '')
  const [sortBy, setSortBy] = useState('newest')
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)

  const activeUsername = user ? (profile?.username || user.email) : username

  useEffect(() => {
    const load = async () => {
      // Load community comments from Supabase (global feed uses anime_id = 0)
      const { data } = await supabase
        .from('comments')
        .select('id, user_id, content, likes, created_at, parent_id')
        .eq('anime_id', 0)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!data?.length) return

      const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))]
      let profiles = {}
      if (userIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
        ;(profs || []).forEach(p => { profiles[p.id] = p })
      }

      // Load which comments the current user has liked
      let liked = new Set()
      if (user) {
        const commentIds = data.map(c => c.id)
        const { data: likes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', commentIds)
        liked = new Set((likes || []).map(l => l.comment_id))
      }
      setLikedIds(liked)

      const mapped = data
        .filter(c => !c.parent_id)
        .map(c => ({
          id: c.id,
          user: profiles[c.user_id]?.username || 'Member',
          text: c.content,
          time: c.created_at,
          likes: c.likes || 0,
          replies: data
            .filter(r => r.parent_id === c.id)
            .map(r => ({
              id: r.id,
              user: profiles[r.user_id]?.username || 'Member',
              text: r.content,
              time: r.created_at,
            })),
          remote: true,
        }))
      setRemoteComments(mapped)
    }
    load().catch(() => {})
  }, [user])

  const comments = remoteComments.length ? remoteComments : localComments

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0)
    return String(b.id).localeCompare(String(a.id))
  })

  const addComment = async () => {
    if (!newComment.trim() || !activeUsername.trim()) return
    setPosting(true)
    if (user) {
      const { data, error } = await supabase.from('comments').insert({
        user_id: user.id,
        anime_id: 0,
        content: newComment.trim(),
        likes: 0,
      }).select().single()
      if (!error && data) {
        setRemoteComments(prev => [{
          id: data.id,
          user: activeUsername,
          text: data.content,
          time: data.created_at || 'Just now',
          likes: 0,
          replies: [],
          remote: true,
        }, ...prev])
        setNewComment('')
        setPosting(false)
        return
      }
    }
    const comment = {
      id: Date.now(),
      user: activeUsername.trim(),
      text: newComment.trim(),
      time: 'Just now',
      likes: 0,
      replies: [],
    }
    setLocalComments([comment, ...localComments])
    setNewComment('')
    setPosting(false)
  }

  const addReply = async (commentId) => {
    if (!replyText.trim()) return
    if (user && typeof commentId === 'string') {
      await supabase.from('comments').insert({
        user_id: user.id,
        anime_id: 0,
        content: replyText.trim(),
        parent_id: commentId,
        likes: 0,
      })
    }
    const updater = (list) => list.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), {
            id: Date.now(),
            user: activeUsername || 'Anonymous',
            text: replyText.trim(),
            time: 'Just now',
          }],
        }
      }
      return c
    })
    if (remoteComments.length) setRemoteComments(updater)
    else setLocalComments(updater(localComments))
    setReplyText('')
    setReplyTo(null)
  }

  const likeComment = async (id) => {
    const target = comments.find(c => c.id === id)
    if (!target) return
    const alreadyLiked = likedIds.has(id)
    const delta = alreadyLiked ? -1 : 1

    if (target?.remote && user) {
      if (alreadyLiked) {
        await supabase.from('comment_likes').delete().eq('comment_id', id).eq('user_id', user.id)
        await supabase.from('comments').update({ likes: Math.max(0, (target.likes || 0) - 1) }).eq('id', id)
      } else {
        await supabase.from('comment_likes').insert({ comment_id: id, user_id: user.id })
        await supabase.from('comments').update({ likes: (target.likes || 0) + 1 }).eq('id', id)
      }
      setLikedIds(prev => {
        const next = new Set(prev)
        alreadyLiked ? next.delete(id) : next.add(id)
        return next
      })
      setRemoteComments(prev => prev.map(c => c.id === id ? { ...c, likes: Math.max(0, (c.likes || 0) + delta) } : c))
    } else {
      setLocalComments(localComments.map(c => c.id === id ? { ...c, likes: Math.max(0, c.likes + delta) } : c))
    }
  }

  return (
    <Page>
      <Container>
        <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>&larr; Back to Home</Link>
        <Title>Community</Title>
        <Subtitle>
          Discuss anime with other fans. Signed-in comments sync via Supabase.
          Aniraku does not host video — this feed is community text only.
        </Subtitle>

        {/* Comment Input */}
        <div style={{ background: '#2a2c31', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          {!user && (
            <InputRow>
              <Input placeholder="Your name" value={username} onChange={e => setUsername(e.target.value)} />
            </InputRow>
          )}
          <TextArea placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} rows={2} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn primary onClick={addComment} disabled={posting}>{posting ? 'Posting…' : 'Post Comment'}</Btn>
          </div>
        </div>

        {/* Sort Tabs */}
        <TabRow>
          <Tab active={sortBy === 'newest'} onClick={() => setSortBy('newest')}>Newest</Tab>
          <Tab active={sortBy === 'likes'} onClick={() => setSortBy('likes')}>Most Liked</Tab>
        </TabRow>

        {/* Comments List */}
        {sortedComments.length === 0 ? (
          <EmptyState>No comments yet. Be the first to comment!</EmptyState>
        ) : (
          sortedComments.map(comment => (
            <CommentCard key={comment.id}>
              <CommentHeader>
                <CommentUser>{comment.user}</CommentUser>
                <CommentTime>{formatTime(comment.time)}</CommentTime>
              </CommentHeader>
              <CommentText>{comment.text}</CommentText>
              <CommentFooter>
                <LikeBtn liked={likedIds.has(comment.id)} onClick={() => likeComment(comment.id)}>
                  ♥ {comment.likes}
                </LikeBtn>
                <ReplyBtn onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                  Reply {comment.replies?.length > 0 && `(${comment.replies.length})`}
                </ReplyBtn>
              </CommentFooter>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <ReplyBox>
                  {comment.replies.map(reply => (
                    <div key={reply.id} style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>{reply.user}</span>
                      <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>{formatTime(reply.time)}</span>
                      <p style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>{reply.text}</p>
                    </div>
                  ))}
                </ReplyBox>
              )}

              {/* Reply Input */}
              {replyTo === comment.id && (
                <ReplyBox>
                  <InputRow>
                    <TextArea placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} />
                  </InputRow>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Btn onClick={() => setReplyTo(null)}>Cancel</Btn>
                    <Btn primary onClick={() => addReply(comment.id)}>Reply</Btn>
                  </div>
                </ReplyBox>
              )}
            </CommentCard>
          ))
        )}
      </Container>
    </Page>
  )
}

export default Comments
