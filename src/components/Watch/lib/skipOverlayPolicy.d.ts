export interface SkipOverlaySegment {
  start: number;
  end: number;
}
export function isSkipPromptWindow(
  segment: SkipOverlaySegment | null | undefined,
  currentTime: number,
): boolean;
export function shouldShowManualSkipOverlay(args: {
  segment?: SkipOverlaySegment | null;
  currentTime: number;
  autoSkip?: boolean;
  autoSkipFailed?: boolean;
  autoSkipHandled?: boolean;
}): boolean;
export function getSkipTarget(
  segment: SkipOverlaySegment | null | undefined,
  duration: number,
): number | null;
export function attemptSkipSegment(
  video: HTMLVideoElement | null,
  segment: SkipOverlaySegment | null | undefined,
): boolean;
