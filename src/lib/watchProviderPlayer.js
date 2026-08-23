export function shouldPreferProviderPlayer(source) {
  const values = [source?.provider, source?.label, source?.id]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)

  return values.some((value) => /(^|[:\s_-])bonk($|[:\s_-])/.test(value))
}
