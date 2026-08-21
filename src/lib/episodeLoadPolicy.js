export const EPISODE_BACKEND_GRACE_MS = 8_000

export function getEpisodeBackendAttemptPlan() {
  return [
    { delayMs: 0, timeoutMs: 4_000 },
    { delayMs: 500, timeoutMs: 3_500 },
  ]
}

export function getEpisodeBackendRetryDelay(attempt = 0) {
  return getEpisodeBackendAttemptPlan()[attempt]?.delayMs ?? 0
}
