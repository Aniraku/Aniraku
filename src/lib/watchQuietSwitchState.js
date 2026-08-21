/**
 * Tracks a manual provider change that keeps the old player alive until the
 * new provider has returned a browser-playable source.
 */
export function beginQuietProviderSwitch({ from, to, episode, resumeAt, shouldPlay }) {
  if (!from || !to || from === to) return null
  const handoff = {}
  if (Number.isFinite(Number(resumeAt)) && Number(resumeAt) > 0) handoff.resumeAt = Number(resumeAt)
  if (typeof shouldPlay === 'boolean') handoff.shouldPlay = shouldPlay
  return { from, to, episode, ...handoff }
}

/**
 * Returns the provider state to retain after a quiet switch resolves.
 * A failed resolution must restore the provider that is still playing and
 * suppress the source-load effect that would otherwise rebuild that player.
 */
export function settleQuietProviderSwitch({ pending, sourceId, episode, succeeded }) {
  if (!pending || pending.to !== sourceId || pending.episode !== episode) {
    return { pending, restoreSourceId: null, skipSourceLoad: false }
  }

  if (succeeded) {
    return { pending: null, restoreSourceId: null, skipSourceLoad: false }
  }

  return {
    pending: null,
    restoreSourceId: pending.from,
    skipSourceLoad: true,
  }
}
