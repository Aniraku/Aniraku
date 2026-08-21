export function createMediaTransportPlan({ verification, directUrl, proxyUrl }) {
  const direct = { mode: 'direct', url: directUrl }
  const proxy = { mode: 'proxy', url: proxyUrl }

  // A backend datacenter can be blocked while a viewer's browser is allowed.
  // Start these advisory-unverified URLs at the client, before attempting the
  // Aniraku proxy from the same blocked datacenter.
  if (String(verification || '').trim().toLowerCase() === 'unverified') {
    return [direct, proxy]
  }

  return [proxy, direct]
}
