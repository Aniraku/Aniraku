import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// ---------------------------------------------------------------------------
// HomeBanner (the live site 1:1) — community notice at the top of the tabs block.
// One random avatar, "Love the Site?" + rotating submessages (absolutely
// positioned, slide + fade every 4s). Social strip (Reddit/Discord/X) removed
// per Aniraku rebrand (Wave: global social strip).
// ---------------------------------------------------------------------------

const NoticeSection = styled.section`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const NoticeRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: clamp(0.5rem, 2vw, 0.75rem);
  align-items: center;
  padding: 0.75rem;
`;

const NoticeImageWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: clamp(36px, 8vw, 48px);
  height: clamp(36px, 8vw, 48px);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: 50%;
`;

const NoticeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: var(--global-div);
  border-radius: 50%;
`;

const NoticeContent = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
`;

const NoticeTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  min-width: 0;
`;

const NoticeText = styled.p`
  margin: 0;
  font-size: clamp(0.9rem, 2.5vw, 1.15rem);
  font-weight: 700;
  color: var(--global-text);
`;

const NoticeSubTextContainer = styled.div`
  position: relative;
  width: 100%;
  height: 1.2rem;
  overflow-y: hidden;
`;

const NoticeSubText = styled.p`
  position: absolute;
  width: max-content;
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: var(--global-text-muted);
  opacity: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    transform 0.5s ease-in-out,
    opacity 0.5s ease-in-out;
`;

const MESSAGES = [
  'Share it With your Friends!',
  'Add it to your Bookmarks!',
  'Comments are Back!',
];

// Five avatars hotlinked from the live site; the two inline base64 avatars
// from the live site are omitted (reported as a gap).
const LIVE = '/assets/'; // localized: downloaded to ~/assets, served via public/assets symlink
const AVATARS = [
  `${LIVE}creepyegg-CYGjjnAR.webp`,
  `${LIVE}down-yHzbyGZh.webp`,
  `${LIVE}skipperfbi-D_Ekt3uz.webp`,
  `${LIVE}smoker-E3ffMAuf.webp`,
  `${LIVE}thebat-CCD8p-uW.webp`,
];
const FALLBACK_AVATAR =
  'https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png';

export const HomeBanner: React.FC = () => {
  const [avatar] = useState(
    () => AVATARS[Math.floor(Math.random() * AVATARS.length)],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((n) => (n + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <NoticeSection aria-label='Community notice'>
      <NoticeRow>
        <NoticeImageWrapper>
          <NoticeImage
            src={avatar}
            alt=''
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_AVATAR;
            }}
          />
        </NoticeImageWrapper>
        <NoticeContent>
          <NoticeTextContainer>
            <NoticeText>Love the Site?</NoticeText>
            <NoticeSubTextContainer>
              {MESSAGES.map((m, i) => (
                <NoticeSubText
                  key={i}
                  style={{
                    transform: `translateY(${(i - idx) * 100}%)`,
                    opacity: i === idx ? 1 : 0,
                  }}
                >
                  {m}
                </NoticeSubText>
              ))}
            </NoticeSubTextContainer>
          </NoticeTextContainer>
        </NoticeContent>
      </NoticeRow>
      {/* Live renders a 1920x140 ad slot here — no local ad component (reported). */}
    </NoticeSection>
  );
};
