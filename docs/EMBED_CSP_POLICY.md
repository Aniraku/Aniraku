# Embedded Player CSP Policy

The website allows any **HTTPS** embedded-player origin through `frame-src 'self' https:`. This replaces a hostname-by-hostname frame allowlist that prevented new and valid provider hosts from loading in the Watch page.

The policy remains restrictive in other ways: only secure frames are permitted, the application itself cannot be framed (`frame-ancestors 'none'`), direct script loading remains self-only, and connection requests retain their explicit allowlist.

This policy enables a provider frame to load; it does not guarantee that a provider is playable, available in every region, or free of provider-controlled advertising and interstitials. The Watch-page provider fallback remains responsible for moving users to another available source.
