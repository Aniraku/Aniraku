import React from "react"
import { FaPlay, FaBookmark } from "react-icons/fa"
import { C } from "./card.style"
import { Link } from "react-router-dom"

const Card = ({ data }) => {
  if (!data) return null

  const id = data.id || data.mal_id
  const title = data.title?.english || data.title?.romaji || data.title?.userPreferred || data.title || 'Unknown'
  const poster = data.coverImage?.large || data.images?.jpg?.image_url || ''
  const score = data.averageScore || data.score
  const episodes = data.episodes
  const format = data.format
  const accentColor = data.coverImage?.color || 'var(--accent)'

  return (
    <C.Card style={{ '--media-color': accentColor }}>
      <Link to={`/anime/${id}`} title={`View ${title} details`}>
        <C.Poster>
          {poster ? (
            <C.Image src={poster} alt={`${title} - Anime Poster`} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>No Image</div>
          )}
          <C.Overlay>
            <FaPlay size={28} />
          </C.Overlay>
          <C.BookmarkBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <FaBookmark size={12} />
          </C.BookmarkBtn>
          <C.Badges>
            {score && <C.Badge accent>{score}%</C.Badge>}
            {format && <C.Badge>{format}</C.Badge>}
          </C.Badges>
          {episodes && <C.EpBadge>Ep {episodes}</C.EpBadge>}
        </C.Poster>
      </Link>
      <C.Details>
        <Link to={`/anime/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <C.Name>{title}</C.Name>
        </Link>
      </C.Details>
    </C.Card>
  )
}

export default Card
