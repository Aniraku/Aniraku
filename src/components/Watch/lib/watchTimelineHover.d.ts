export interface TimelineSkipSegment {
  start: number;
  end: number;
}
export interface TimelineSkipSegments {
  intro?: TimelineSkipSegment | null;
  outro?: TimelineSkipSegment | null;
}
export const TIMELINE_MARKER_DEFINITIONS: Readonly<
  Record<string, Readonly<{ label: string; color: string }>>
>;
export function formatTimelineTime(seconds: number): string;
export function getTimelineMarkers(
  segments?: TimelineSkipSegments,
  duration?: number,
): unknown[];
export function getTimelineHoverState(args?: {
  ratio?: number;
  duration?: number;
  segments?: TimelineSkipSegments;
}): unknown;
export function createTimelineHoverPreview(
  video: HTMLVideoElement | null,
  progressInner: Element | null,
  getSegments?: () => TimelineSkipSegments,
): { refresh: () => void; cleanup: () => void };
