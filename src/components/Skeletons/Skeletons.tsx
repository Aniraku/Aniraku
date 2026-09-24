import React from "react";
import styled, { keyframes } from "styled-components";

/**
 * Loading skeleton components matching the live site's
 * skeleton pop-in + primary/secondary shimmer.
 */

// Pop-in entrance (live: popInSk base-animation)
const popInSk = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.96);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// Background pulse between primary and secondary skeleton colors
const skeletonPulse = keyframes`
  0%, 100% {
    background-color: var(--global-primary-skeleton);
  }
  50% {
    background-color: var(--global-secondary-skeleton);
  }
`;

export const SkeletonBox = styled.div`
  background-color: var(--global-primary-skeleton);
  border-radius: var(--global-border-radius);
  animation: ${skeletonPulse} 2.5s ease-in-out infinite;
`;

export const SkeletonImageBox = styled(SkeletonBox)`
  width: 100%;
  aspect-ratio: 133 / 184;
`;

export const SkeletonTextLine = styled(SkeletonBox)<{
  width?: string;
  height?: string;
}>`
  width: ${(props) => props.width ?? "100%"};
  height: ${(props) => props.height ?? "1rem"};
  border-radius: 0.3125rem;
`;

const CardSkeletonContainer = styled.div`
  animation: ${popInSk} 2s ease-in-out infinite alternate;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SkeletonImage = styled.div`
  position: relative;
  width: 100%;
  padding-top: calc(100% * 184 / 133);
  background-color: var(--global-primary-skeleton);
  border-radius: var(--global-border-radius);
  overflow: hidden;
  animation: ${skeletonPulse} 2.5s ease-in-out infinite;
`;

const SkeletonTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
  height: 3.75rem;
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 2rem;
`;

const Spinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--global-border-color);
  border-top-color: var(--primary-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const InlineLoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  color: var(--global-text-muted);
  font-size: 0.875rem;
`;

/** Card placeholder shown while anime lists load. */
export const SkeletonCard: React.FC = () => (
  <CardSkeletonContainer>
    <SkeletonImage />
    <SkeletonTextBlock>
      <SkeletonTextLine height="1.5rem" />
      <SkeletonTextLine width="90%" height="0.75rem" />
    </SkeletonTextBlock>
  </CardSkeletonContainer>
);

/** Home hero slide placeholder. */
export const SkeletonSlide: React.FC = () => (
  <SkeletonBox
    style={{
      width: "100%",
      height: "100%",
      minHeight: "20rem",
      borderRadius: "var(--global-border-radius)",
    }}
  />
);

/** Player placeholder (16:9) shown while the embed loads. */
export const SkeletonPlayer: React.FC = () => (
  <SkeletonBox
    style={{
      width: "100%",
      aspectRatio: "16 / 9",
      borderRadius: "var(--global-border-radius)",
    }}
  />
);

/** Centered spinner used for page-level loading states. */
export const LoadingSpinner: React.FC = () => (
  <SpinnerContainer>
    <Spinner />
  </SpinnerContainer>
);

/** Small inline loader used inside lists/sections. */
export const InlineLoader: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => (
  <InlineLoaderContainer>
    <Spinner style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} />
    {text}
  </InlineLoaderContainer>
);

export default SkeletonCard;
