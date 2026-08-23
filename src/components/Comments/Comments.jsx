import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaRegEye,
  FaEyeSlash,
  FaRegImages,
  FaPaperPlane,
  FaRegThumbsUp,
  FaReply,
  FaThumbsUp,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { canSubmitComment, getCommentDisplayContent, isTrustedGiphyGifUrl, toGiphyGif } from '../../lib/commentContent'
import styled from 'styled-components'

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY?.trim()
const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'

const cleanContent = (raw) => {
  const out = []
  for (const ch of String(raw || '')) {
    const code = ch.codePointAt(0)
    if (code >= 0xD800 && code <= 0xDFFF) continue
    out.push(ch)
    if (out.length >= 2000) break
  }
  return out.join('')
}

const Wrapper = styled.section`
  margin-top: 40px;
`

const Title = styled.h2`
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 16px;
  max-width: 100%;
  overflow-wrap: anywhere;
`

const Composer = styled.form`
  background: transparent;
  border: none;
  border-radius: 0;
  box-sizing: border-box;
  display: flex;
  gap: 8px;
  margin: ${p => p.$compact ? '8px 0 0' : '0 0 16px'};
  max-width: 100%;
  min-width: 0;
  overflow: visible;
  padding: 0;
  position: relative;

  > * { min-width: 0; }

  @media (max-width: 480px) {
    gap: 7px;
  }
`

const ComposerBody = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 8px 9px;
`

const ComposerRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 6px;
  min-width: 0;

  @media (max-width: 480px) {
    align-items: center;
    flex-wrap: nowrap;
  }
`

const ComposerTools = styled.div`
  align-items: center;
  border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  padding-top: 6px;
`

const Avatar = styled.img`
  background: var(--bg-elevated);
  border-radius: 50%;
  flex-shrink: 0;
  height: 32px;
  object-fit: cover;
  width: 32px;
`

const InitialAvatar = styled.div`
  align-items: center;
  background: var(--accent);
  border-radius: 50%;
  color: var(--bg);
  display: flex;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  height: 32px;
  justify-content: center;
  text-transform: uppercase;
  width: 32px;
`

const Textarea = styled.textarea`
  background: transparent;
  border: none;
  box-sizing: border-box;
  color: var(--text-primary);
  flex: 1 1 auto;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.45;
  min-height: 30px;
  min-width: 0;
  outline: none;
  padding: 0;
  resize: vertical;
`

const PostBtn = styled.button`
  align-items: center;
  background: var(--accent);
  border: none;
  border-radius: 7px;
  color: var(--bg);
  cursor: ${p => p.$disabled ? 'wait' : 'pointer'};
  display: inline-flex;
  flex: 0 0 auto;
  height: 28px;
  justify-content: center;
  opacity: ${p => p.$disabled ? 0.6 : 1};
  padding: 0;
  transition: transform 160ms ease, opacity 160ms ease;
  width: 30px;

  &:not(:disabled):hover { transform: translateY(-1px); }
  &:not(:disabled):active { transform: scale(0.97); }

  @media (max-width: 480px) {
    margin-left: auto;
    min-height: 28px;
  }
`

const ToolBtn = styled.button`
  align-items: center;
  background: ${p => p.$active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--bg-elevated)'};
  border: 1px solid ${p => p.$active ? 'color-mix(in srgb, var(--accent) 45%, var(--border))' : 'transparent'};
  border-radius: 7px;
  color: ${p => p.$active ? 'var(--accent)' : 'var(--text-secondary)'};
  cursor: pointer;
  display: inline-flex;
  gap: 5px;
  height: 26px;
  justify-content: center;
  min-height: 26px;
  padding: 0 7px;
  transition: border-color 160ms ease, color 160ms ease, transform 160ms ease;

  &:hover { border-color: var(--accent); color: var(--accent); }
  &:active { transform: scale(0.96); }
  width: auto;
`

const ToolText = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
`

const GifPreview = styled.div`
  align-items: flex-start;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: inline-flex;
  gap: 6px;
  max-width: min(190px, 100%);
  overflow: hidden;
  padding: 4px;

  img { border-radius: 5px; display: block; height: 48px; max-width: 120px; object-fit: cover; width: auto; }
`

const RemoveGif = styled.button`
  align-items: center;
  align-self: stretch;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  padding: 4px;
  &:hover { color: var(--accent); }
`

const Picker = styled.div`
  background: color-mix(in srgb, var(--bg-elevated) 94%, #000);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
  max-width: 368px;
  padding: 8px;
  width: 100%;

  @media (max-width: 480px) {
    max-height: none;
    max-width: 100%;
    position: static;
    width: 100%;
  }
`

const PickerHead = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
`

const PickerTitle = styled.strong`
  color: var(--text-primary);
  font-size: 12px;
`

const PickerSearch = styled.input`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 7px;
  box-sizing: border-box;
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  min-width: 0;
  outline: none;
  padding: 7px 8px;
  width: 100%;
  &:focus { border-color: var(--accent); }
`

const PickerClose = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  padding: 4px;
  &:hover { color: var(--accent); }
`

const GifGrid = styled.div`
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-height: 260px;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: 320px;
  }
`

const GifOption = styled.button`
  background: var(--bg-elevated);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  display: block;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  position: relative;
  &:hover, &:focus-visible { border-color: var(--accent); outline: none; }
  img { display: block; height: auto; object-fit: contain; width: 100%; }
`

const PickerNote = styled.p`
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.45;
  margin: 0;
`

const GiphyAttribution = styled.a`
  align-self: flex-end;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  &:hover { color: var(--accent); }
`

const ErrorMsg = styled.p`
  color: #ef4444;
  font-size: 13px;
  margin: 0;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
`

const Item = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 12px 14px;
`

const ItemReply = styled(Item)`
  margin-left: 46px;
  @media (max-width: 480px) { margin-left: 20px; max-width: calc(100% - 20px); }
  @media (max-width: 380px) { margin-left: 12px; max-width: calc(100% - 12px); }
`

const ItemHead = styled.div`
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  min-width: 0;
`

const ItemName = styled(Link)`
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

const ItemTime = styled.span`
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
`

const ItemBody = styled.div`
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 10px;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: break-word;
`

const ItemGif = styled.img`
  border-radius: 8px;
  display: block;
  margin-top: 8px;
  max-height: 200px;
  max-width: min(300px, 100%);
  width: auto;
  @media (max-width: 480px) { max-width: 100%; }
`

const SpoilerShield = styled.button`
  align-items: center;
  background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-elevated)) 0 9px, var(--bg-elevated) 9px 18px);
  border: 1px dashed color-mix(in srgb, var(--accent) 55%, var(--border));
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 12px;
  gap: 8px;
  justify-content: center;
  margin: 0 0 10px;
  min-height: 54px;
  padding: 10px;
  text-align: center;
  width: 100%;
  &:hover { border-color: var(--accent); color: var(--accent); }
`

const SpoilerTag = styled.div`
  align-items: center;
  color: var(--text-muted);
  display: inline-flex;
  font-size: 11px;
  font-weight: 700;
  gap: 6px;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  text-transform: uppercase;
`

const ItemActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
`

const Action = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${p => p.$active ? 'var(--accent)' : 'var(--text-muted)'};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  gap: 6px;
  min-height: 32px;
  padding: 2px 4px;
  white-space: nowrap;
  &:hover { color: var(--accent); }
`

const Empty = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 24px 0;
  text-align: center;
`

const GuestBox = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-sizing: border-box;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.8;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 24px;
  text-align: center;
  a { color: var(--accent); font-weight: 600; text-decoration: none; }
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

const nameOf = (profiles, uid) => {
  const p = profiles[uid]
  return p?.display_name || p?.username || 'Anonymous'
}

const avatarOf = (profiles, uid) => profiles[uid]?.avatar_url || null

const AvatarBlock = ({ url, name }) => url
  ? <Avatar src={url} alt="" />
  : <InitialAvatar>{(name || 'A').charAt(0)}</InitialAvatar>

function CommentComposer({ avatar, placeholder, value, onChange, gifUrl, onGifChange, spoiler, onSpoilerChange, onSubmit, busy, error, compact = false }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [gifLoading, setGifLoading] = useState(false)
  const [gifError, setGifError] = useState('')
  const canSubmit = canSubmitComment(value, gifUrl)

  useEffect(() => {
    if (!pickerOpen) return undefined
    if (!GIPHY_API_KEY) {
      setGifs([])
      setGifError('GIF search is temporarily unavailable.')
      return undefined
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setGifLoading(true)
      setGifError('')
      try {
        const endpoint = new URL(query.trim() ? `${GIPHY_API_BASE}/search` : `${GIPHY_API_BASE}/trending`)
        endpoint.searchParams.set('api_key', GIPHY_API_KEY)
        endpoint.searchParams.set('limit', '20')
        endpoint.searchParams.set('rating', 'g')
        if (query.trim()) {
          endpoint.searchParams.set('q', query.trim())
          endpoint.searchParams.set('lang', 'en')
        }
        const response = await fetch(endpoint, { signal: controller.signal })
        if (!response.ok) throw new Error(`GIF service returned ${response.status}`)
        const payload = await response.json()
        if (!Array.isArray(payload?.data)) throw new Error('GIF service returned an invalid response')
        setGifs(payload.data.map(toGiphyGif).filter(Boolean))
      } catch (requestError) {
        if (requestError?.name !== 'AbortError') {
          setGifs([])
          setGifError('Could not load GIFs. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setGifLoading(false)
      }
    }, query.trim() ? 260 : 0)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [pickerOpen, query])

  const chooseGif = (gif) => {
    onGifChange(gif.url)
    setPickerOpen(false)
  }

  return (
    <Composer $compact={compact} onSubmit={(event) => { event.preventDefault(); if (canSubmit) onSubmit() }}>
      {avatar && <AvatarBlock url={avatar.url} name={avatar.name} />}
      <ComposerBody>
        <ComposerRow>
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={event => onChange(event.target.value)}
            maxLength={2000}
            rows={compact ? 1 : 2}
          />
          <PostBtn type="submit" $disabled={busy || !canSubmit} disabled={busy || !canSubmit} aria-label="Post comment" title="Post comment">
            <FaPaperPlane size={13} />
          </PostBtn>
        </ComposerRow>
        <ComposerTools>
          {GIPHY_API_KEY && <ToolBtn type="button" onClick={() => setPickerOpen(open => !open)} $active={pickerOpen || Boolean(gifUrl)} aria-expanded={pickerOpen} aria-controls="comment-gif-picker" aria-label="Choose a GIF" title="Choose a GIF">
            <FaRegImages size={13} /> <ToolText>GIF</ToolText>
          </ToolBtn>}
          <ToolBtn type="button" onClick={() => onSpoilerChange(!spoiler)} $active={spoiler} aria-pressed={spoiler} aria-label={spoiler ? 'Spoiler protection on' : 'Mark comment as a spoiler'} title={spoiler ? 'Spoiler protection on' : 'Mark as spoiler'}>
            <FaEyeSlash size={13} /> <ToolText>{spoiler ? 'Spoiler' : 'Spoiler'}</ToolText>
          </ToolBtn>
        </ComposerTools>
        {pickerOpen && (
          <Picker id="comment-gif-picker" role="dialog" aria-label="Choose a reaction GIF">
            <PickerHead>
              <PickerTitle>Reaction GIFs</PickerTitle>
              <PickerClose type="button" onClick={() => setPickerOpen(false)} aria-label="Close GIF picker"><FaTimes size={12} /></PickerClose>
            </PickerHead>
            <PickerSearch value={query} onChange={event => setQuery(event.target.value)} placeholder="Search reactions" aria-label="Search G-rated GIFs" autoFocus />
            {gifLoading ? <PickerNote>Loading…</PickerNote> : gifError ? <PickerNote>{gifError}</PickerNote> : gifs.length ? (
              <GifGrid>
                {gifs.map(gif => (
                  <GifOption type="button" key={gif.id} onClick={() => chooseGif(gif)} title={`Use GIF: ${gif.label}`} aria-label={`Use GIF: ${gif.label}`}>
                    <img src={gif.previewUrl} alt="" loading="lazy" />
                  </GifOption>
                ))}
              </GifGrid>
            ) : <PickerNote>No G-rated GIFs found.</PickerNote>}
            <GiphyAttribution href="https://giphy.com" target="_blank" rel="noreferrer">Powered by GIPHY</GiphyAttribution>
          </Picker>
        )}
        {gifUrl && (
          <GifPreview>
            <img src={gifUrl} alt="Selected reaction GIF" />
            <RemoveGif type="button" onClick={() => onGifChange('')} aria-label="Remove selected GIF"><FaTimes /></RemoveGif>
          </GifPreview>
        )}
        {error && <ErrorMsg>{error}</ErrorMsg>}
      </ComposerBody>
    </Composer>
  )
}

const renderItem = (c, reply, {
  profiles, likedIds, replyTo, replyText, replyGifUrl, replySpoiler, busy, user, revealedIds,
  toggleLike, remove, submitReply, setReplyTo, setReplyText, setReplyGifUrl, setReplySpoiler, setPostError, toggleReveal,
}) => {
  const Mine = reply ? ItemReply : Item
  const { text: textContent, gifUrl } = getCommentDisplayContent(c.content, c.gif_url)
  const spoilerHidden = Boolean(c.is_spoiler) && !revealedIds.has(c.id)

  return (
    <Mine key={c.id}>
      <ItemHead>
        <AvatarBlock url={avatarOf(profiles, c.user_id)} name={nameOf(profiles, c.user_id)} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ItemName to="/profile">{nameOf(profiles, c.user_id)}</ItemName>
          <ItemTime>{timeAgo(c.created_at)}</ItemTime>
        </div>
      </ItemHead>
      {spoilerHidden ? (
        <SpoilerShield type="button" onClick={() => toggleReveal(c.id)} aria-label="Spoiler hidden. Activate to reveal this comment.">
          <FaEyeSlash /> Spoiler hidden · tap to reveal
        </SpoilerShield>
      ) : (
        <>
          {c.is_spoiler && <SpoilerTag><FaRegEye /> Spoiler revealed</SpoilerTag>}
          <ItemBody>
            {textContent && <p style={{ margin: 0 }}>{textContent}</p>}
            {gifUrl && <ItemGif src={gifUrl} alt="Animated reaction GIF" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
          </ItemBody>
        </>
      )}
      <ItemActions>
        <Action $active={likedIds.has(c.id)} onClick={() => toggleLike(c.id)} title="Like">
          {likedIds.has(c.id) ? <FaThumbsUp size={13} /> : <FaRegThumbsUp size={13} />}
          {c.likes || 0}
        </Action>
        <Action onClick={() => {
          const opening = replyTo !== c.id
          setReplyTo(opening ? c.id : null)
          setReplyText('')
          setReplyGifUrl('')
          setReplySpoiler(false)
          setPostError('')
        }}>
          <FaReply size={12} /> Reply
        </Action>
        {user && user.id === c.user_id && (
          <Action onClick={() => remove(c.id)} title="Delete" style={{ marginLeft: 'auto' }}>
            <FaTrash size={12} /> Delete
          </Action>
        )}
      </ItemActions>
      {replyTo === c.id && (
        <CommentComposer
          compact
          placeholder={`Reply to ${nameOf(profiles, c.user_id)}…`}
          value={replyText}
          onChange={setReplyText}
          gifUrl={replyGifUrl}
          onGifChange={setReplyGifUrl}
          spoiler={replySpoiler}
          onSpoilerChange={setReplySpoiler}
          onSubmit={() => submitReply(c.id)}
          busy={busy}
        />
      )}
    </Mine>
  )
}

const Comments = ({ animeId, episodeNumber, label }) => {
  const { user: authenticatedUser } = useAuth()
  const user = authenticatedUser
  const [comments, setComments] = useState([])
  const [profiles, setProfiles] = useState({})
  const [myProfile, setMyProfile] = useState(null)
  const [likedIds, setLikedIds] = useState(new Set())
  const [content, setContent] = useState('')
  const [gifUrl, setGifUrl] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyGifUrl, setReplyGifUrl] = useState('')
  const [replySpoiler, setReplySpoiler] = useState(false)
  const [revealedIds, setRevealedIds] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [postError, setPostError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const query = supabase
        .from('comments')
        .select('*')
        .eq('anime_id', animeId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (episodeNumber) query.eq('episode_number', episodeNumber)
      const { data, error } = await query
      if (cancelled) return
      if (error) { console.error('Comments load:', error); setLoading(false); return }
      const rows = data || []
      setComments(rows)

      const ids = [...new Set(rows.map(c => c.user_id).filter(Boolean))]
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', ids)
        if (cancelled) return
        if (profs) setProfiles(Object.fromEntries(profs.map(p => [p.id, p])))
      }

      if (user) {
        const { data: me } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        if (cancelled) return
        if (me) setMyProfile(me)
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
        if (cancelled) return
        if (likes) setLikedIds(new Set(likes.map(l => l.comment_id)))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [animeId, episodeNumber, user])

  const addProfile = () => {
    if (!user) return
    setProfiles(prev => ({
      ...prev,
      [user.id]: prev[user.id] || {
        username: myProfile?.username || user.user_metadata?.username,
        display_name: myProfile?.display_name || null,
        avatar_url: myProfile?.avatar_url || null,
      },
    }))
  }

  const insertComment = async ({ text, mediaUrl, spoiler, parentId = null }) => {
    const cleaned = cleanContent(text)
    if (!canSubmitComment(cleaned, mediaUrl) || !user || busy) return null
    if (mediaUrl && !isTrustedGiphyGifUrl(mediaUrl)) {
      setPostError('Only GIFs selected from the picker can be attached.')
      return null
    }
    setBusy(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        anime_id: animeId,
        episode_number: episodeNumber || null,
        content: cleaned,
        gif_url: mediaUrl || null,
        is_spoiler: Boolean(spoiler),
        parent_id: parentId,
      })
      .select()
      .single()
    setBusy(false)
    if (error) {
      console.error('Comment post:', error)
      setPostError('Could not post your comment. Please try again.')
      return null
    }
    setPostError('')
    setComments(prev => [...prev, data])
    addProfile()
    return data
  }

  const submit = async () => {
    const posted = await insertComment({ text: content, mediaUrl: gifUrl, spoiler: isSpoiler })
    if (!posted) return
    setContent('')
    setGifUrl('')
    setIsSpoiler(false)
  }

  const submitReply = async (parentId) => {
    const posted = await insertComment({ text: replyText, mediaUrl: replyGifUrl, spoiler: replySpoiler, parentId })
    if (!posted) return
    setReplyTo(null)
    setReplyText('')
    setReplyGifUrl('')
    setReplySpoiler(false)
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
    const { error } = await supabase.from('comments').delete().or(`id.eq.${id},parent_id.eq.${id}`)
    if (error) { console.error('Comment delete:', error); return }
    setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id))
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const repliesOf = (id) => comments.filter(c => c.parent_id === id)
  const toggleReveal = (id) => setRevealedIds(prev => new Set(prev).add(id))
  const itemProps = {
    profiles, likedIds, replyTo, replyText, replyGifUrl, replySpoiler, busy, user, revealedIds,
    toggleLike, remove, submitReply, setReplyTo, setReplyText, setReplyGifUrl, setReplySpoiler, setPostError, toggleReveal,
  }

  return (
    <Wrapper id="comments">
      <Title>Comments ({comments.length})</Title>
      {label && <Subtitle>{label}</Subtitle>}
      {user ? (
        <CommentComposer
          avatar={{
            url: myProfile?.avatar_url,
            name: myProfile?.display_name || myProfile?.username || user.email || 'You',
          }}
          placeholder="Share your thoughts…"
          value={content}
          onChange={(value) => { setContent(value); setPostError('') }}
          gifUrl={gifUrl}
          onGifChange={(value) => { setGifUrl(value); setPostError('') }}
          spoiler={isSpoiler}
          onSpoilerChange={setIsSpoiler}
          onSubmit={submit}
          busy={busy}
          error={postError}
        />
      ) : (
        <GuestBox>
          <Link to="/login">Log in</Link> or <Link to="/signup">create an account</Link> to join the discussion.
        </GuestBox>
      )}
      {loading ? <Empty>Loading comments…</Empty> : topLevel.length === 0 ? (
        <Empty>No comments yet. Be the first to share your thoughts!</Empty>
      ) : (
        <List>
          {topLevel.map(c => (
            <React.Fragment key={c.id}>
              {renderItem(c, false, itemProps)}
              {repliesOf(c.id).map(r => renderItem(r, true, itemProps))}
            </React.Fragment>
          ))}
        </List>
      )}
    </Wrapper>
  )
}

export default Comments
