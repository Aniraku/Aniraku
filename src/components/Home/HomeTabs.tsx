import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

// ---------------------------------------------------------------------------
// HomeTabs (miruro.to 1:1) — NEWEST / POPULAR / TOP RATED tabs with a compact
// ‹ page › pager and a digits-only go-to-page input (commits onBlur/Enter).
// ---------------------------------------------------------------------------

const TabsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const ScrollableTabContainer = styled.div`
  flex-grow: 1;
  overflow: auto;
  scrollbar-width: none;
  mask-image: var(--home-tab-mask, none);
  -webkit-mask-image: var(--home-tab-mask, none);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  width: max-content;
  overflow: hidden;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const Tab = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  margin: 0;
  overflow: hidden;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: var(--app-font-family);
  color: ${({ $isActive }) =>
    $isActive ? 'var(--primary-accent)' : 'var(--global-text)'};
  cursor: pointer;
  background-color: ${({ $isActive }) =>
    $isActive
      ? 'var(--primary-accent-tr, rgba(128, 128, 207, 0.25))'
      : 'var(--global-div)'};
  border: none;
  outline: 1px solid var(--global-border-color);

  &:hover,
  &:active {
    color: var(--primary-accent);
  }

  @media (max-width: 500px) {
    padding: 0.5rem 1rem;
    /* mobile pass: ~36px → 44px tap target */
    min-height: 2.75rem;
  }
`;

const Pager = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  max-width: max-content;
  overflow: hidden;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const PageButton = styled.button<{ $disabled?: boolean }>`
  padding: 0.5rem 0.75rem;
  color: var(--global-text);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background-color: var(--global-div);
  border: none;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: filter 0.15s ease;

  &:not(:disabled):hover {
    filter: brightness(1.5);
  }

  @media (max-width: 500px) {
    /* mobile pass: pager chevrons ~35px → 44px tap target */
    min-height: 2.75rem;
  }
`;

const PageInput = styled.input`
  width: 1.5rem;
  padding: 0.5rem;
  color: var(--global-text);
  font-family: var(--app-font-family);
  font-size: 0.75rem;
  text-align: center;
  background-color: var(--global-div);
  border: none;
  outline: none;
  opacity: 0.5;

  &::placeholder {
    color: var(--global-placeholder-text, var(--global-text-muted));
  }
  &:focus {
    opacity: 1;
  }
`;

export const HomeTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
}> = ({ activeTab, onTabChange, page, onPageChange, hasNextPage }) => {
  const [inputValue, setInputValue] = useState(String(page));

  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  const commitPage = () => {
    const digits = inputValue.replace(/\D/g, '');
    const parsed = parseInt(digits, 10);
    if (Number.isNaN(parsed)) {
      setInputValue(String(page));
      return;
    }
    const clamped = Math.max(1, Math.min(parsed, 500));
    setInputValue(String(clamped));
    if (clamped !== page) onPageChange(clamped);
  };

  const showPager = page > 1 || hasNextPage;

  return (
    <TabsRow>
      <ScrollableTabContainer>
        <TabsContainer>
          <Tab
            $isActive={activeTab === 'newest'}
            onClick={() => onTabChange('newest')}
            title='Newest Tab'
          >
            NEWEST
          </Tab>
          <Tab
            $isActive={activeTab === 'popular'}
            onClick={() => onTabChange('popular')}
            title='Popular Tab'
          >
            POPULAR
          </Tab>
          <Tab
            $isActive={activeTab === 'topRated'}
            onClick={() => onTabChange('topRated')}
            title='Top Rated Tab'
          >
            TOP RATED
          </Tab>
        </TabsContainer>
      </ScrollableTabContainer>
      {showPager && (
        <Pager>
          <PageButton
            onClick={() => onPageChange(Math.max(1, page - 1))}
            $disabled={page <= 1}
            disabled={page <= 1}
            title='Previous Page'
          >
            <IoChevronBack />
          </PageButton>
          <PageInput
            type='text'
            inputMode='numeric'
            value={inputValue}
            title='Go to page'
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setInputValue(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitPage();
            }}
            onBlur={commitPage}
          />
          <PageButton
            onClick={() => onPageChange(page + 1)}
            $disabled={!hasNextPage}
            disabled={!hasNextPage}
            title='Next Page'
          >
            <IoChevronForward />
          </PageButton>
        </Pager>
      )}
    </TabsRow>
  );
};
