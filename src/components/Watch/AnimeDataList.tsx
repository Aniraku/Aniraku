import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { TbCards } from 'react-icons/tb';
import { FaStar } from 'react-icons/fa';
import { Anime, StatusIndicator } from '../../index';
import { infoPathFor } from '../../utils/animePaths';
import { resolveDisplayTitle } from '../../lib/displayLanguage';

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: 0.2s ease-in-out;
  @media (min-width: 1000px) {
    min-width: 22rem;
  }
  .Section-Title {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    margin: 0;
    padding: 0.25rem 0 1rem 0;
    color: var(--global-text);
    font-size: 1.1rem;
    font-weight: 700;
  }
`;

// 6sw3k_19 — list container: padding .75rem, div-tr bg, border, radius.
const SidebarContainer = styled.div`
  padding: 0.75rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

// 6sw3k_38 — side list card: height 6rem, bg div, hover margin-left +
// brightness. The outer Link handles the accent color on hover.
const Card = styled.div`
  position: relative;
  display: flex;
  height: 6rem;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
  align-items: center;
  overflow: hidden;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease-in-out;
  animation-fill-mode: backwards;
  transition:
    background-color 0s ease-in-out,
    margin-left 0.2s ease-in-out,
    filter 0.2s ease-in-out;
  &:hover,
  &:active,
  &:focus {
    background-color: var(--global-div);
    margin-left: 0.35rem;
    filter: brightness(1.1);
    @media (max-width: 500px) {
      margin-left: unset;
    }
  }
`;

const AnimeImage = styled.img`
  width: 4.25rem;
  height: 6rem;
  object-fit: cover;
  border-radius: var(--global-border-radius);
`;

const Info = styled.div``;

const TitleWithDot = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin-top: 0.35rem;
  gap: 0.4rem;
  border-radius: var(--global-border-radius);
  cursor: pointer;
  transition: background 0.2s ease;
`;

const Title = styled.p`
  top: 0;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.9rem;
  margin: 0;
`;

const Details = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  font-size: 0.75rem;
  margin: 0;
  color: rgba(102, 102, 102, 0.75);
  svg {
    margin-left: 0.15rem;
  }
`;

// 6sw3k_124 — side list card detail pill.
const DetailPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.1rem 0.4rem;
  background-color: var(--global-div);
  border-radius: var(--global-border-radius);
`;

export const AnimeDataList: React.FC<{ animeData: Anime }> = ({
  animeData,
}) => {
  const filteredRecommendations = animeData.recommendations.filter((rec) =>
    ['OVA', 'SPECIAL', 'TV', 'TV_SHORT', 'MOVIE', 'ONA', 'MUSIC'].includes(
      rec.type || '',
    ),
  );

  const filteredRelations = animeData.relations.filter((rel) =>
    ['OVA', 'SPECIAL', 'TV', 'TV_SHORT', 'MOVIE', 'ONA', 'MUSIC'].includes(
      rel.type || '',
    ),
  );

  return (
    <Sidebar>
      {filteredRelations.length > 0 && (
        <SidebarContainer>
          <>
            <p className='Section-Title'>RELATED</p>
            {filteredRelations
              .slice(0, window.innerWidth > 500 ? 5 : 3)
              .map((relation, index) => (
                <Link
                  to={infoPathFor(relation)}
                  key={relation.id}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  title={`Watch ${resolveDisplayTitle(relation.title)}`}
                  aria-label={`Watch ${resolveDisplayTitle(relation.title)}`}
                >
                  <Card style={{ animationDelay: `${index * 0.1}s` }}>
                    <AnimeImage
                      src={relation.image}
                      alt={resolveDisplayTitle(relation.title)}
                      loading='lazy'
                    />
                    <Info>
                      <TitleWithDot>
                        <StatusIndicator status={relation.status} />
                        <Title>
                          {resolveDisplayTitle(relation.title)}
                        </Title>
                      </TitleWithDot>
                      <Details
                        aria-label={`Details about ${resolveDisplayTitle(relation.title)}`}
                      >
                        {/* Conditionally render each piece of detail only if it's not null or empty */}
                        {relation.type && <DetailPill>{relation.type}</DetailPill>}
                        {relation.episodes && (
                          <DetailPill>
                            <TbCards aria-hidden='true' />
                            {`${relation.episodes}`}
                          </DetailPill>
                        )}
                        {relation.rating && (
                          <DetailPill>
                            <FaStar aria-hidden='true' />
                            {`${relation.rating}`}
                          </DetailPill>
                        )}
                      </Details>
                    </Info>
                  </Card>
                </Link>
              ))}
          </>
        </SidebarContainer>
      )}
      {filteredRecommendations.length > 0 && (
        <SidebarContainer>
          <>
            <p className='Section-Title'>RECOMMENDATIONS</p>
            {filteredRecommendations
              .slice(0, window.innerWidth > 500 ? 5 : 3)
              .map((recommendation, index) => (
                <Link
                  to={infoPathFor(recommendation)}
                  key={recommendation.id}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  title={`Watch ${resolveDisplayTitle(recommendation.title)}`}
                  aria-label={`Watch ${resolveDisplayTitle(recommendation.title)}`}
                >
                  <Card style={{ animationDelay: `${index * 0.1}s` }}>
                    <AnimeImage
                      src={recommendation.image}
                      alt={resolveDisplayTitle(recommendation.title)}
                      loading='lazy'
                    />
                    <Info>
                      <TitleWithDot>
                        <StatusIndicator status={recommendation.status} />
                        <Title>
                          {resolveDisplayTitle(recommendation.title)}
                        </Title>
                      </TitleWithDot>
                      <Details
                        aria-label={`Details about ${resolveDisplayTitle(recommendation.title)}`}
                      >
                        {/* Similar conditional rendering for recommendation details */}
                        {recommendation.type && (
                          <DetailPill>{recommendation.type}</DetailPill>
                        )}
                        {recommendation.episodes && (
                          <DetailPill>
                            <TbCards aria-hidden='true' />
                            {`${recommendation.episodes}`}
                          </DetailPill>
                        )}
                        {recommendation.rating && (
                          <DetailPill>
                            <FaStar aria-hidden='true' />
                            {`${recommendation.rating}`}
                          </DetailPill>
                        )}
                      </Details>
                    </Info>
                  </Card>
                </Link>
              ))}
          </>
        </SidebarContainer>
      )}
    </Sidebar>
  );
};
