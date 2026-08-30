// ─────────────────────────────────────────────────────────────────────────────
// Provider Playback Rules
//
// Each rule is a small, named predicate + transport override that decides how
// a given provider's source is delivered to the player. Rules are evaluated
// in declaration order and the first match wins. Adding a new provider-level
// behavior (e.g. force-direct, force-embed, force-proxy) means appending a
// rule here — never hard-coding it inside buildPlayer.
//
// `predicate(source)` returns true if the rule applies.
// `transport` describes how `createMediaTransportPlan` should be shaped for
// sources that match this rule.
// ─────────────────────────────────────────────────────────────────────────────

import { isBonkProvider, isPeweProvider } from './watchProviderDiscovery.js'

export const PROVIDER_PLAYBACK_RULES = Object.freeze([
  Object.freeze({
    name: 'bonkProxyOnly',
    // Bonk's embedded player is unreliable and its direct media URLs are
    // frequently gated by anti-bot checks that browsers cannot satisfy.
    predicate: isBonkProvider,
    transport: Object.freeze({ proxyOnly: true }),
  }),
  Object.freeze({
    name: 'peweDirect',
    // Pewe sources play directly in the browser — no iframe needed.
    // Bypass embed fallback and use direct/native playback.
    predicate: isPeweProvider,
    transport: Object.freeze({ directPreferred: true }),
  }),
])

export function getProviderTransportOverride(source) {
  if (!source) return null
  for (const rule of PROVIDER_PLAYBACK_RULES) {
    try {
      if (rule.predicate(source)) {
        return { rule: rule.name, ...rule.transport }
      }
    } catch {
      // A faulty predicate must never take down playback. Skip and continue.
    }
  }
  return null
}

// Kept for backward compatibility with any external consumer; new code should
// prefer `getProviderTransportOverride` which also returns the matching rule
// name for logging and observability.
export function shouldPreferProviderPlayer(source) {
  return Boolean(getProviderTransportOverride(source))
}
