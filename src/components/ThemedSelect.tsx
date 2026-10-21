import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { FaCheck, FaChevronDown } from 'react-icons/fa';

// ThemedSelect — a reusable replacement for the native <select> everywhere it
// would otherwise open the phone's OS picker on Android/touch. It renders the
// SAME themed menu the Watch-page server/language dropdown already uses: a
// button trigger + an absolutely-positioned listbox. Outside `pointerdown` and
// Escape close it, so it behaves identically on desktop and mobile — no more
// un-themed system popup.
//
// Each call site controls layout (width / flex) by wrapping this component or
// passing `className`; the trigger and menu styling are theme-aware via the
// global CSS variables so it fits every context it's dropped into.

export type ThemedSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ThemedSelectProps = {
  value: string;
  options: ThemedSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  /** Stretch to fill the parent (e.g. a flex row) instead of hugging content. */
  fullWidth?: boolean;
  /** Horizontal alignment of the menu relative to the trigger. */
  align?: 'left' | 'right';
  className?: string;
};

const Root = styled.div<{ $fullWidth: boolean }>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? 'flex' : 'inline-flex')};
  ${({ $fullWidth }) => ($fullWidth ? 'flex: 1; min-width: 0;' : '')}
`;

const Trigger = styled.button`
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 2.25rem;
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--global-text);
  text-align: left;
  cursor: pointer;
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: var(--global-text);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const TriggerLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Caret = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  font-size: 0.7rem;
  opacity: 0.65;
`;

const Menu = styled.div<{ $open: boolean; $align: 'left' | 'right' }>`
  position: absolute;
  top: calc(100% + 0.375rem);
  ${({ $align }) => ($align === 'left' ? 'left: 0;' : 'right: 0;')}
  z-index: var(--z-index-dropdown, 40);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100%;
  padding: 0.25rem;
  max-height: min(60vh, 320px);
  overflow-y: auto;
  overscroll-behavior: contain;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  background-color: var(--global-primary-bg, var(--global-div));
  border: 1px solid var(--global-border-color);
  border-radius: 0.65rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.2),
    0 10px 25px -5px rgba(0, 0, 0, 0.35);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) =>
    $open ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.96)'};
  transform-origin: ${({ $align }) =>
    $align === 'left' ? 'top left' : 'top right'};
  transition: ${({ $open }) =>
    $open
      ? 'opacity .16s cubic-bezier(.16,1,.3,1), transform .16s cubic-bezier(.16,1,.3,1)'
      : 'opacity .12s ease-in, transform .12s ease-in'};
`;

const MenuItem = styled.button`
  position: relative;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 2.4rem;
  padding: 0.5rem 0.6rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--global-text);
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 0.4rem;

  &:hover:not(:disabled) {
    background-color: var(--global-button-hover-bg);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const MenuItemName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemCheck = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  font-size: 0.85rem;
  color: var(--primary-accent);
`;

export const ThemedSelect: React.FC<ThemedSelectProps> = ({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  fullWidth = false,
  align = 'left',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  // Live: menu closes whenever the value changes (parent re-render).
  useEffect(() => {
    setOpen(false);
  }, [value]);

  // Outside tap/click + Escape close. `pointerdown` (not mousedown) so a touch
  // outside dismisses the menu too — this is the whole point: the themed menu
  // must work on Android/touch, replacing the native <select> OS picker.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <Root ref={rootRef} $fullWidth={fullWidth} className={className}>
      <Trigger
        type='button'
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <TriggerLabel>{selected?.label ?? value}</TriggerLabel>
        <Caret>
          <FaChevronDown />
        </Caret>
      </Trigger>
      <Menu $open={open} $align={align} role='listbox' aria-label={ariaLabel}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            type='button'
            role='option'
            aria-selected={o.value === value}
            disabled={o.disabled}
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            <MenuItemName>{o.label}</MenuItemName>
            {o.value === value && (
              <ItemCheck>
                <FaCheck />
              </ItemCheck>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Root>
  );
};

export default ThemedSelect;
