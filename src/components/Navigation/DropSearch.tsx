import { useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaStar,
  FaArrowRight,
  FaClosedCaptioning,
  FaAngleUp,
  FaAngleDown,
} from 'react-icons/fa';
import { PiKeyReturn } from 'react-icons/pi';
import { FiX } from 'react-icons/fi';
import { MdRecordVoiceOver } from 'react-icons/md';
import { showToast } from '../Toaster';
import type { Anime } from '../../hooks/animeInterface';
import { infoPathFor } from '../../utils/animePaths';

interface DropSearchProps {
  results: Anime[];
  isVisible: boolean;
  isLoading: boolean;
  /** live keys the pikachu loader on the error branch too (plus toast) */
  error?: boolean;
  query: string;
  onClear: () => void;
  onClose: () => void;
}

const DropSearch = ({
  results,
  isVisible,
  isLoading,
  error,
  query,
  onClear,
  onClose,
}: DropSearchProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIndexRef = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;

      const items = listRef.current?.querySelectorAll('.searchItem');
      const itemCount = items?.length || 0;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        onClear();
        return;
      }

      if (itemCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items && selectedIndexRef.current < itemCount - 1) {
          if (items[selectedIndexRef.current]) {
            items[selectedIndexRef.current].classList.remove('selected');
          }
          selectedIndexRef.current++;
          const selectedItem = items[selectedIndexRef.current];
          selectedItem.classList.add('selected');
          selectedItem.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items && selectedIndexRef.current > 0) {
          if (items[selectedIndexRef.current]) {
            items[selectedIndexRef.current].classList.remove('selected');
          }
          selectedIndexRef.current--;
          const selectedItem = items[selectedIndexRef.current];
          selectedItem.classList.add('selected');
          selectedItem.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items && selectedIndexRef.current >= 0 && results[selectedIndexRef.current]) {
          navigate(infoPathFor(results[selectedIndexRef.current]));
          onClose();
          onClear();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (items && itemCount > 0) {
          if (items[selectedIndexRef.current]) {
            items[selectedIndexRef.current].classList.remove('selected');
          }
          selectedIndexRef.current = (selectedIndexRef.current + 1) % itemCount;
          const selectedItem = items[selectedIndexRef.current];
          selectedItem.classList.add('selected');
          selectedItem.scrollIntoView({ block: 'nearest' });
        }
      }
    },
    [isVisible, navigate, onClose, onClear, results]
  );

  const handleBlur = useCallback(
    (e: FocusEvent) => {
      if (
        isVisible &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
        onClear();
      }
    },
    [isVisible, onClose, onClear]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleBlur);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleBlur);
    };
  }, [handleKeyDown, handleBlur]);

  useEffect(() => {
    selectedIndexRef.current = -1;
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.searchItem');
      items.forEach((item) => item.classList.remove('selected'));
    }
  }, [results]);

  // live `wv`: search failure → error toast (fires once per error flip;
  // fires only for guests' visible searches, same copy as live)
  useEffect(() => {
    if (error) {
      showToast('Failed to load search results', {
        type: 'error',
        description: 'Please try again later.',
      });
    }
  }, [error]);

  return (
    <div
      ref={containerRef}
      className={`dropSearchContainer ${isVisible ? 'visible' : ''}`}
      role="listbox"
      aria-label="Search results"
    >
      <ul className="searchResults" ref={listRef}>
        {isLoading || error ? (
          <li>
            <div className="searchLoadingWrapper">
              <img
                className="searchLoadingImage"
                src="/assets/pikachu-BzF97nTe.gif"
                alt="pika"
              />
            </div>
          </li>
        ) : results.length > 0 ? (
          <>
            {results.map((anime) => (
              <li key={anime.id} className="searchItem" role="option" aria-selected="false">
                <Link
                  to={infoPathFor(anime)}
                  onClick={() => {
                    onClose();
                    onClear();
                  }}
                >
                  <img
                    src={anime.image}
                    alt={`Search Result for ${anime.title.romaji || anime.title.english || anime.title.romaji}`}
                    loading="lazy"
                  />
                  <div className="searchDetails">
                    <div className="searchTitleContainer">
                      <div className="searchTitle">
                        {anime.title.romaji || anime.title.english || anime.title.romaji}
                      </div>
                    </div>
                    <div className="searchDetailsRow">
                      <div className="detail">
                        {anime.releaseDate || '?'}
                      </div>
                      <div className="detail">
                        {anime.type || '?'}
                      </div>
                      <div className="detail">
                        {anime.subOrDub && /dub/i.test(anime.subOrDub) && (
                          <MdRecordVoiceOver aria-label="Dub" />
                        )}
                        <FaClosedCaptioning aria-label="Sub" />
                        {anime.totalEpisodes || '?'}
                      </div>
                      <div className="detail">
                        <FaStar aria-label="Score" />
                        {(anime.rating && Math.round(anime.rating * 10)) || '?'}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            <li className="searchItem viewAllItem" role="option" aria-selected="false">
              <Link
                to={`/search?query=${encodeURIComponent(query)}&sort=SEARCH_MATCH`}
                onClick={() => {
                  onClose();
                  onClear();
                }}
                aria-label="View all search results"
              >
                <div className="searchViewAll">
                  <div className="searchViewAllTitle">VIEW ALL</div>
                  <FaArrowRight />
                </div>
                <div className="shortcutContainer">
                  <div className="shortcut">
                    <FaAngleUp aria-label="Arrow Up" />
                    <FaAngleDown aria-label="Arrow Down" />
                    <span>to navigate</span>
                  </div>
                  <div className="shortcut">
                    <PiKeyReturn aria-label="Enter" />
                    <span>to select</span>
                  </div>
                  <div className="shortcut">
                    <FiX aria-label="Esc" />
                    <span>Esc to exit</span>
                  </div>
                </div>
              </Link>
            </li>
          </>
        ) : (
          query && <li className="noResults">No results found</li>
        )}
      </ul>
    </div>
  );
};

export default DropSearch;
