import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
`;

const Iframe = styled.iframe`
  width: 100%;
  margin: 0 auto;
  background-color: var(--global-div);
  border: none;
  border-radius: var(--global-border-radius);
  min-height: 16.24rem;
`;

type EmbedPlayerProps = {
  src: string;
  /** Live switches the embed aspect: 16/9 normal, 21/9 in theater mode. */
  aspectRatio?: string;
};

export const EmbedPlayer: React.FC<EmbedPlayerProps> = ({
  src,
  aspectRatio = '16/9',
}) => {
  return (
    <Container>
      {/* key={src} forces a clean iframe remount when the server switch
          changes the embed URL (React would otherwise just mutate src,
          which some embeds don't reload reliably). */}
      <Iframe
        key={src}
        src={src}
        allowFullScreen
        style={{ aspectRatio }}
      />
    </Container>
  );
};
