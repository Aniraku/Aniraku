export type SubtitleFormat = 'vtt' | 'srt' | 'ass';

/**
 * Format detection for proxied subtitle links, whose URLs hide the file
 * extension behind an opaque token. Only the head of the file is inspected.
 */
export function detectSubtitleType(text: string): SubtitleFormat | null {
  const head = text
    .replace(/^\uFEFF/, '')
    .trimStart()
    .slice(0, 8192);
  if (head.startsWith('WEBVTT')) return 'vtt';
  if (head.includes('[Script Info]') || /^Dialogue:/m.test(head)) return 'ass';
  if (/^\d{2}:\d{2}:\d{2},\d{3}\s+-->/m.test(head)) return 'srt';
  return null;
}
