import type { CSSProperties } from 'react';
import { SiMyanimelist, SiAnilist } from 'react-icons/si';

// Official provider brand glyphs (simple-icons) — port of Aniraku
// `src/components/ProviderIcon.jsx` (byte-stable maps + brand colors).
// Falls back to null for unknown providers so callers can render their
// own placeholder.
const ICONS: Record<string, typeof SiAnilist> = {
  mal: SiMyanimelist,
  anilist: SiAnilist,
};
const BRAND: Record<string, string> = { mal: '#2e51a2', anilist: '#02a9ff' };

export interface ProviderIconProps {
  provider: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const ProviderIcon = ({
  provider,
  size = 18,
  color,
  style,
}: ProviderIconProps) => {
  const Icon = ICONS[provider];
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      color={color || BRAND[provider]}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    />
  );
};

export default ProviderIcon;
