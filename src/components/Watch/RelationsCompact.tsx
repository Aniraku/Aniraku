import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Relation } from '../../index';
import { infoPathFor } from '../../utils/animePaths';

const CompactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0.45rem;
  margin-top: 0.75rem;
`;

const Row = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
  text-decoration: none;
  color: var(--global-text);
  transition:
    background-color 0.15s,
    margin-left 0.2s ease-in-out 0.1s;
  &:hover {
    background-color: var(--global-div-tr);
    margin-left: 0.35rem;
  }
`;

const Thumb = styled.img`
  width: 2.75rem;
  height: 3.75rem;
  object-fit: cover;
  border-radius: var(--global-border-radius);
  flex-shrink: 0;
`;

const Title = styled.span`
  flex: 1;
  font-size: 0.85rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const TypeBadge = styled.span`
  font-size: 0.65rem;
  font-weight: bold;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: var(--global-border-radius);
  background-color: var(--primary-accent-bg);
  color: var(--primary-accent);
  white-space: nowrap;
  flex-shrink: 0;
`;

const ShowMoreButton = styled.button`
  background-color: var(--global-div);
  color: var(--global-text-muted);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: var(--global-border-radius);
  margin-top: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover {
    background-color: var(--primary-accent-bg);
    color: #fff;
  }
`;

// All AniList relations in a compact grid (rows AND columns) so long
// relation lists never overflow the page. Manga entries are excluded —
// there is no manga route. Visible rows end where the recommendations end
// (5 desktop / 3 mobile) with an expander for the rest.
const PAGE_SIZE = window.innerWidth > 500 ? 5 : 3;

export const RelationsCompact: React.FC<{ relations: Relation[] }> = ({
  relations,
}) => {
  const [expanded, setExpanded] = useState(false);
  const items = (relations ?? []).filter(
    (r) =>
      r?.id &&
      r.type?.toUpperCase() !== 'MANGA' &&
      r.type?.toUpperCase() !== 'NOVEL',
  );
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, PAGE_SIZE);
  return (
    <>
      <CompactGrid>
        {visible.map((relation) => (
        <Row
          key={relation.id}
          to={infoPathFor(relation)}
          title={`${relation.relationType} — ${relation.title.userPreferred}`}
        >
          <Thumb
            src={relation.image}
            alt={relation.title.userPreferred}
            loading='lazy'
          />
          <Title>
            {relation.title.english ||
              relation.title.romaji ||
              relation.title.userPreferred}
          </Title>
          <TypeBadge>{relation.relationType?.replace(/_/g, ' ')}</TypeBadge>
        </Row>
      ))}
      </CompactGrid>
      {items.length > PAGE_SIZE && (
        <ShowMoreButton onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less' : `Show All ${items.length}`}
        </ShowMoreButton>
      )}
    </>
  );
};
