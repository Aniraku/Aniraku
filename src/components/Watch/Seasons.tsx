import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Relation } from '../../index';
import { infoPathFor } from '../../utils/animePaths';
import { FaFilm } from 'react-icons/fa';

const SeasonsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// Section heading (mirrors the live RELATED / RECOMMENDATIONS headers).
const SeasonsHeading = styled.p`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin: 0;
  padding: 0.25rem 0 0.5rem 0;
  color: var(--global-text);
  font-size: 1.1rem;
  font-weight: 700;
`;

// 1vb3r — season card grid: auto-fill columns min 11rem, gap .5rem.
const SeasonCardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(11rem, 100%), 1fr));
  gap: 0.5rem;
`;

// 1vb3r — season card: 4.84rem tall, real cover image behind a #0000008c
// overlay, title 1.15rem/700.
const SeasonCard = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  height: 4.84rem;
  padding: 0.75rem;
  overflow: hidden;
  border-radius: var(--global-border-radius);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  text-decoration: none;
  text-align: left;
  transition: transform 0.2s ease-in-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #0000008c;
    border-radius: var(--global-border-radius);
    z-index: 1;
  }

  &:hover,
  &:active,
  &:focus {
    transform: translateY(-5px);
    @media (max-width: 500px) {
      transform: none;
    }
  }
`;

const SeasonCover = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const SeasonLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #ffffffd9;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
`;

const SeasonName = styled.div`
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

// Live card label: OVA / SPECIAL relations render as `Specials`, everything
// else falls back to the relation type (live uses TVDB `Season {n}` numbers —
// unavailable locally, noted as a gap).
const SEASON_LIKE = ['SEASON', 'PREQUEL', 'SEQUEL', 'OVA', 'SPECIAL'];

const seasonLabel = (relation: Relation): string => {
  const relType = relation.relationType || '';
  if (relType === 'OVA' || relType === 'SPECIAL') return 'Specials';
  return relType || 'Season';
};

export const Seasons: React.FC<{ relations: Relation[] }> = ({ relations }) => {
  const seasonRelations = relations.filter((relation) =>
    SEASON_LIKE.includes(relation.relationType || ''),
  );

  // Mirrors the live TVDB-gated render — no seasons, no section.
  if (seasonRelations.length === 0) return null;

  const sortedRelations = [...seasonRelations].sort((a, b) => {
    if (a.relationType === 'PREQUEL' && b.relationType !== 'PREQUEL') {
      return -1;
    }
    if (a.relationType !== 'PREQUEL' && b.relationType === 'PREQUEL') {
      return 1;
    }
    return 0;
  });

  return (
    <SeasonsSection>
      <SeasonsHeading>
        <FaFilm aria-hidden='true' /> SEASONS
      </SeasonsHeading>
      <SeasonCardContainer>
        {sortedRelations.map((relation) => {
          const label = seasonLabel(relation);
          return (
            <SeasonCard
              key={relation.id}
              to={infoPathFor(relation)}
              title={`Watch ${label}`}
              aria-label={`Watch ${label}`}
            >
              <SeasonCover
                src={relation.image}
                alt={`${relation.title.english || relation.title.romaji || relation.title.userPreferred} Cover`}
                loading='lazy'
              />
              <Content>
                <SeasonLabel>{label}</SeasonLabel>
                <SeasonName>
                  {relation.title.english ||
                    relation.title.romaji ||
                    relation.title.native ||
                    relation.title.userPreferred}
                </SeasonName>
              </Content>
            </SeasonCard>
          );
        })}
      </SeasonCardContainer>
    </SeasonsSection>
  );
};
