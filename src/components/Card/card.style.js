import styled from 'styled-components';

export const C = {};

C.Card = styled.div`
  position: relative;

  a { text-decoration: none; color: inherit; }
`;

C.Poster = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 140%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-card);
  cursor: pointer;
`;

C.Image = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.85);
  transition: filter 0.3s, transform 0.3s;

  ${C.Poster}:hover & {
    filter: brightness(1) saturate(1.2);
    transform: scale(1.03);
  }
`;

C.Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.25s;
  z-index: 2;
  color: #fff;

  ${C.Poster}:hover & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    opacity: 1;
    background: rgba(0,0,0,0.25);
  }
`;

C.BookmarkBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.25s;
  z-index: 3;
  border: none;

  ${C.Poster}:hover & {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    background: var(--media-color, var(--accent));
    color: #000;
  }
`;

C.Badges = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  z-index: 3;
`;

C.Badge = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: ${({ accent }) => (accent ? 'var(--media-color, var(--accent))' : 'rgba(255,255,255,0.15)')};
  color: ${({ accent }) => (accent ? '#000' : '#fff')};
  backdrop-filter: blur(4px);
`;

C.EpBadge = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  z-index: 3;
`;

C.Details = styled.div`
  padding: 10px 4px 4px;
`;

C.Name = styled.h3`
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--media-color, var(--accent));
  }
`;
